import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, unlink, readFile, readdir, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { normalizeSettings, objectKeys, payloadBytes } from '../control/validation.js';
import { summarize } from '../experiments/metrics.js';
import { problem } from '../errors.js';

export const phases = ['baseline', 'faulty', 'recovery'];
const states = ['running', 'stopping', 'completed', 'stopped', 'failed', 'interrupted'];
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const corrupt = () => { throw problem('record_corrupt', 500, 'The experiment record is corrupt or inconsistent.'); };
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const nullableTime = value => value === null || timestamp(value);
const errorShape = value => value === null || (objectKeys(value, ['code', 'message']) && typeof value.code === 'string'
  && /^[a-z_]{1,64}$/.test(value.code) && typeof value.message === 'string' && value.message.length <= 2000);

export function validateId(id) {
  if (typeof id !== 'string' || !idPattern.test(id)) throw problem('invalid_input', 400, 'Invalid experiment identifier.');
  return id;
}

export function createRecord(settings) {
  const now = new Date().toISOString();
  const record = { schemaVersion: 1, id: randomUUID(), createdAt: now, startedAt: now, endedAt: null, state: 'running',
    settings: structuredClone(settings), observations: [], summary: {}, recovery: { removedAt: null, confirmedAt: null,
      observationWindowMs: 15000, successCountRequired: 3, observed: settings.mode === 'baseline' ? null : false, durationMs: null },
    persistence: { state: 'saved', error: null }, error: null, evidenceReferences: [] };
  return refreshRecord(record);
}

export function refreshRecord(record) {
  record.summary = Object.fromEntries(phases.map(phase => [phase, summarize(record.observations.filter(item => item.phase === phase))]));
  return record;
}

export function validateRecord(record) {
  if (!record || typeof record !== 'object') corrupt();
  if (record.schemaVersion !== 1) throw problem('record_unsupported', 500, 'Unsupported experiment schema version.');
  const fields = ['schemaVersion', 'id', 'createdAt', 'startedAt', 'endedAt', 'state', 'settings', 'observations', 'summary',
    'recovery', 'persistence', 'error', 'evidenceReferences'];
  if (!objectKeys(record, fields) || fields.some(key => !Object.hasOwn(record, key)) || !idPattern.test(record.id)
    || !states.includes(record.state) || !timestamp(record.createdAt) || !timestamp(record.startedAt) || !nullableTime(record.endedAt)
    || Date.parse(record.startedAt) < Date.parse(record.createdAt) || (record.endedAt && Date.parse(record.endedAt) < Date.parse(record.startedAt))) corrupt();
  if (['running', 'stopping'].includes(record.state) !== (record.endedAt === null)) corrupt();
  const { settings } = record;
  if (!objectKeys(settings, ['mode', 'probeCount', 'intervalMs', 'timeoutMs', 'fault', 'demoContract', 'recoverySuccessCount', 'recoveryWindowMs'])) corrupt();
  let normalized;
  try { normalized = normalizeSettings(Object.fromEntries(['mode', 'probeCount', 'intervalMs', 'timeoutMs', 'fault'].map(key => [key, settings[key]]))); }
  catch { corrupt(); }
  if (Object.keys(normalized).some(key => JSON.stringify(normalized[key]) !== JSON.stringify(settings[key]))) corrupt();
  if (!Array.isArray(record.observations) || record.observations.length > 200) corrupt();
  let lastPhase = 0;
  let lastStarted = Date.parse(record.startedAt);
  for (const item of record.observations) {
    const fields = ['phase', 'startedAt', 'elapsedMs', 'outcome', 'httpStatus', 'bytesReceived', 'successful'];
    const phaseIndex = phases.indexOf(item?.phase);
    if (!objectKeys(item, fields) || fields.some(key => !Object.hasOwn(item, key)) || phaseIndex < lastPhase || phaseIndex < 0
      || (settings.mode === 'baseline' && phaseIndex > 0) || !timestamp(item.startedAt) || Date.parse(item.startedAt) < lastStarted
      || (record.endedAt !== null && Date.parse(item.startedAt) > Date.parse(record.endedAt))
      || !(item.elapsedMs === null || (Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0))
      || !(item.httpStatus === null || (Number.isInteger(item.httpStatus) && item.httpStatus >= 100 && item.httpStatus <= 599))
      || !Number.isInteger(item.bytesReceived) || item.bytesReceived < 0 || item.bytesReceived > payloadBytes
      || !['response_complete', 'timeout', 'connection_error', 'interrupted', 'cancelled'].includes(item.outcome)
      || typeof item.successful !== 'boolean') corrupt();
    if (item.successful && (item.outcome !== 'response_complete' || item.httpStatus !== 200 || item.bytesReceived !== payloadBytes || item.elapsedMs === null)) corrupt();
    lastPhase = phaseIndex;
    lastStarted = Date.parse(item.startedAt);
  }
  if (!objectKeys(record.summary, phases) || phases.some(phase => !Object.hasOwn(record.summary, phase))) corrupt();
  for (const phase of phases) {
    const expected = summarize(record.observations.filter(item => item.phase === phase));
    if (!objectKeys(record.summary[phase], Object.keys(expected)) || Object.keys(expected).some(key => record.summary[phase][key] !== expected[key])) corrupt();
    if (phase !== 'recovery' && expected.attemptCount > settings.probeCount) corrupt();
  }
  const recovery = record.recovery;
  if (!objectKeys(recovery, ['removedAt', 'confirmedAt', 'observationWindowMs', 'successCountRequired', 'observed', 'durationMs'])
    || !nullableTime(recovery.removedAt) || !nullableTime(recovery.confirmedAt) || recovery.observationWindowMs !== 15000
    || recovery.successCountRequired !== 3 || !(recovery.durationMs === null || (Number.isFinite(recovery.durationMs) && recovery.durationMs >= 0 && recovery.durationMs <= 15000))
    || (settings.mode === 'baseline' ? recovery.observed !== null : typeof recovery.observed !== 'boolean')) corrupt();
  if (recovery.observed === true) {
    const tail = record.observations.filter(item => item.phase === 'recovery').slice(-3);
    if (!timestamp(recovery.removedAt) || !timestamp(recovery.confirmedAt) || recovery.durationMs === null
      || Date.parse(recovery.confirmedAt) < Date.parse(recovery.removedAt) || tail.length !== 3 || tail.some(item => !item.successful)) corrupt();
  } else if (recovery.confirmedAt !== null || recovery.durationMs !== null) corrupt();
  for (const value of [recovery.removedAt, recovery.confirmedAt]) {
    if (value !== null && (Date.parse(value) < Date.parse(record.startedAt)
      || (record.endedAt !== null && Date.parse(value) > Date.parse(record.endedAt)))) corrupt();
  }
  if (settings.mode === 'baseline' && recovery.removedAt !== null) corrupt();
  if (!objectKeys(record.persistence, ['state', 'error']) || !['saved', 'failed'].includes(record.persistence.state)
    || !errorShape(record.persistence.error) || !errorShape(record.error)) corrupt();
  if (!Array.isArray(record.evidenceReferences) || record.evidenceReferences.length > 20 || record.evidenceReferences.some(item =>
    !objectKeys(item, ['source', 'path', 'description']) || !['packet_tracer', 'wireshark'].includes(item.source)
    || typeof item.path !== 'string' || !/^labs\/[a-zA-Z0-9_./-]+$/.test(item.path) || item.path.split('/').includes('..')
    || typeof item.description !== 'string' || item.description.length > 500)) corrupt();
  return record;
}

export async function createStore(directory) {
  const root = resolve(directory);
  const storageError = () => problem('storage_unavailable', 503, 'Could not safely read or save local experiment evidence.');
  try { await mkdir(root, { recursive: true }); } catch { throw storageError(); }
  async function saveRecord(record) {
    const snapshot = structuredClone(record);
    snapshot.persistence = { state: 'saved', error: null };
    validateRecord(snapshot);
    const filename = join(root, validateId(snapshot.id) + '.json');
    const temporary = filename + '.' + randomUUID() + '.tmp';
    let handle;
    try {
      handle = await open(temporary, 'wx');
      await handle.writeFile(JSON.stringify(snapshot, null, 2));
      await handle.sync();
      await handle.close();
      handle = null;
      await rename(temporary, filename);
      record.persistence = snapshot.persistence;
    } catch { throw storageError(); }
    finally { await handle?.close().catch(() => {}); await unlink(temporary).catch(() => {}); }
  }
  async function readRecord(id) {
    const filename = join(root, validateId(id) + '.json');
    let text;
    try {
      const info = await lstat(filename);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024) corrupt();
      text = await readFile(filename, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') throw problem('not_found', 404, 'Experiment record not found.');
      if (error.status) throw error;
      throw storageError();
    }
    let record;
    try { record = JSON.parse(text); } catch { corrupt(); }
    validateRecord(record);
    if (record.id !== id) corrupt();
    return record;
  }
  async function listRecords() {
    let filenames;
    try { filenames = await readdir(root); } catch { throw storageError(); }
    const records = [], errors = [];
    for (const filename of filenames.filter(item => item.endsWith('.json'))) {
      const id = filename.slice(0, -5);
      try { records.push(await readRecord(id)); }
      catch (error) { errors.push({ id: idPattern.test(id) ? id : null, code: error.status ? error.code : 'record_corrupt', message: error.status ? error.message : 'Invalid record.' }); }
    }
    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { records, errors };
  }
  const store = { saveRecord, readRecord, listRecords, async checkReady() {
    const filename = join(root, randomUUID() + '.tmp');
    let handle;
    try { handle = await open(filename, 'wx'); await handle.close(); handle = null; await unlink(filename); return true; }
    catch { throw storageError(); } finally { await handle?.close().catch(() => {}); await unlink(filename).catch(() => {}); }
  } };
  await store.checkReady();
  const { records } = await listRecords();
  for (const record of records.filter(item => ['running', 'stopping'].includes(item.state))) {
    record.state = 'interrupted'; record.endedAt = new Date().toISOString();
    record.error = { code: 'process_interrupted', message: 'The previous process ended before completion. In-phase observations may be missing.' };
    await saveRecord(record);
  }
  return store;
}
