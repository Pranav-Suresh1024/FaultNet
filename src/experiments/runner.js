import { performance } from 'node:perf_hooks';
import { setTimeout as wait } from 'node:timers/promises';
import { normalizeSettings, experimentLimitMs } from '../control/validation.js';
import { createRecord, refreshRecord } from '../storage/records.js';
import { probe } from './probe.js';
import { problem, safeError } from '../errors.js';

export function createRunner({ demoPort, proxy, store }) {
  let active = null;
  let opening = false;
  let startSettled = Promise.resolve();
  let closing = false;
  const retained = new Map();

  async function demoReady() {
    return (await probe({ port: demoPort, timeoutMs: 3000 })).successful;
  }
  async function getExperiment(id) {
    if (active?.record.id === id) {
      const job = active;
      if (!['running', 'stopping'].includes(job.record.state)) await job.done;
      return structuredClone(job.record);
    }
    if (retained.has(id)) return structuredClone(retained.get(id));
    return store.readRecord(id);
  }
  async function save(record) {
    try { await store.saveRecord(record); }
    catch (error) { record.persistence = { state: 'failed', error: safeError(error) }; throw error; }
  }
  async function run(job) {
    const { record, controller } = job;
    const { signal } = controller;
    const limit = setTimeout(() => { job.deadline = true; controller.abort(); }, experimentLimitMs);
    async function observe(phase, until = Infinity) {
      const remaining = until - performance.now();
      if (remaining <= 0 || signal.aborted) return false;
      let windowExpired = false;
      const window = new AbortController();
      const windowTimer = Number.isFinite(remaining) ? setTimeout(() => { windowExpired = true; window.abort(); }, remaining) : null;
      const result = await probe({ port: proxy.port, timeoutMs: Math.min(record.settings.timeoutMs, remaining),
        signal: AbortSignal.any([signal, window.signal]) });
      clearTimeout(windowTimer);
      if (windowExpired && result.outcome === 'cancelled' && !signal.aborted) result.outcome = 'timeout';
      record.observations.push({ phase, ...result });
      refreshRecord(record);
      return result.successful && performance.now() <= until;
    }
    async function phase(name, fault) {
      job.phase = name;
      proxy.setFault(fault);
      for (let i = 0; i < record.settings.probeCount && !signal.aborted; i++) {
        await observe(name);
        if (i + 1 < record.settings.probeCount && !signal.aborted) await wait(record.settings.intervalMs, undefined, { signal });
      }
      if (!signal.aborted) await save(record);
    }
    try {
      await phase('baseline', { type: 'none' });
      if (record.settings.mode === 'comparison' && !signal.aborted) {
        await phase('faulty', record.settings.fault);
        await proxy.clearFault();
        record.recovery.removedAt = new Date().toISOString();
        const removed = performance.now();
        job.phase = 'recovery';
        const until = removed + record.settings.recoveryWindowMs;
        let streak = 0;
        while (!signal.aborted && performance.now() < until) {
          streak = await observe('recovery', until) ? streak + 1 : 0;
          if (streak === record.settings.recoverySuccessCount) {
            record.recovery.observed = true;
            record.recovery.confirmedAt = new Date().toISOString();
            record.recovery.durationMs = performance.now() - removed;
            break;
          }
          const remaining = until - performance.now();
          if (remaining > 0) await wait(Math.min(record.settings.intervalMs, remaining), undefined, { signal });
        }
      }
      await proxy.clearFault();
      if (record.settings.mode === 'comparison' && record.recovery.removedAt === null) record.recovery.removedAt = new Date().toISOString();
      record.state = signal.aborted ? (job.deadline ? 'failed' : 'stopped') : 'completed';
      if (job.deadline) record.error = { code: 'experiment_deadline', message: 'The experiment probing deadline was reached.' };
    } catch (error) {
      await proxy.clearFault();
      if (record.settings.mode === 'comparison' && record.recovery.removedAt === null) record.recovery.removedAt = new Date().toISOString();
      record.state = signal.aborted && !job.deadline ? 'stopped' : 'failed';
      if (job.deadline) record.error = { code: 'experiment_deadline', message: 'The experiment probing deadline was reached.' };
      else if (!signal.aborted) record.error = safeError(error);
    } finally {
      clearTimeout(limit);
      record.endedAt = new Date().toISOString();
      refreshRecord(record);
      try { await save(record); }
      catch (error) { record.state = 'failed'; record.error = safeError(error); }
      if (record.persistence.state === 'failed') retained.set(record.id, structuredClone(record));
      active = null;
    }
  }
  async function startExperiment(input) {
    if (closing) throw problem('prohibited_request', 403, 'The application is shutting down.');
    if (active || opening) throw problem('experiment_busy', 409, 'An experiment is already running.');
    const settings = normalizeSettings(input);
    opening = true;
    let settle;
    startSettled = new Promise(resolve => { settle = resolve; });
    try {
      if (!await demoReady()) throw problem('demo_unavailable', 503, 'The fixed demo server is unavailable.');
      await store.checkReady();
      if (closing) throw problem('prohibited_request', 403, 'The application is shutting down.');
      const record = createRecord(settings);
      await save(record);
      const job = { record, controller: new AbortController(), phase: 'baseline', deadline: false, done: null };
      active = job;
      job.done = run(job);
      return structuredClone(record);
    } finally { opening = false; settle(); }
  }
  async function stopExperiment(id) {
    if (active?.record.id === id) {
      const record = active.record;
      if (!['running', 'stopping'].includes(record.state)) return getExperiment(id);
      record.state = 'stopping';
      active.controller.abort();
      return structuredClone(record);
    }
    return getExperiment(id);
  }
  return { startExperiment, stopExperiment, getExperiment, demoReady,
    status: () => ({ activeExperimentId: active?.record.id ?? null, phase: active?.phase ?? null, fault: proxy.getFault() }),
    async listExperiments() {
      const { records, errors } = await store.listRecords();
      const byId = new Map(records.map(record => [record.id, record]));
      for (const [id, record] of retained) byId.set(id, record);
      if (active) byId.set(active.record.id, active.record);
      const experiments = [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(record => {
        const { id, createdAt, state, settings, summary, recovery, persistence } = record;
        return { id, createdAt, state, settings, summary, recovery, persistence };
      });
      return structuredClone({ experiments, errors });
    }, async close() {
      closing = true;
      await startSettled;
      if (active) { active.controller.abort(); await active.done; }
      await proxy.clearFault();
      if (retained.size) throw problem('storage_unavailable', 503, 'Some experiment evidence could not be saved and will be lost when this process exits.');
    } };
}
