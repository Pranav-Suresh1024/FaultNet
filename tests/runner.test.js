import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as wait } from 'node:timers/promises';
import { startDemo } from '../src/demo/server.js';
import { startProxy } from '../src/proxy/server.js';
import { createStore } from '../src/storage/records.js';
import { createRunner } from '../src/experiments/runner.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'faultnet-runner-'));
  const demo = await startDemo({ port: 0 });
  const proxy = await startProxy({ port: 0, demoPort: demo.port });
  const store = await createStore(root);
  const runner = createRunner({ demoPort: demo.port, proxy, store });
  t.after(async () => {
    await runner.close().catch(error => { if (error.code !== 'storage_unavailable') throw error; });
    await proxy.close(); await demo.close(); await rm(root, { recursive: true, force: true });
  });
  return { root, demo, proxy, store, runner };
}

async function terminal(runner, id, limit = 6000) {
  const deadline = Date.now() + limit;
  while (Date.now() < deadline) {
    const record = await runner.getExperiment(id);
    if (!['running', 'stopping'].includes(record.state)) return record;
    await wait(20);
  }
  assert.fail('experiment did not terminate');
}

test('runner compares interruption and confirms recovery with three successes', async t => {
  const { runner, proxy, store } = await fixture(t);
  const started = await runner.startExperiment({ probeCount: 2, intervalMs: 100, fault: { type: 'interruption' } });
  await assert.rejects(runner.startExperiment({ mode: 'baseline' }), { code: 'experiment_busy' });
  const record = await terminal(runner, started.id);
  assert.equal(record.state, 'completed');
  assert.equal(record.summary.baseline.successCount, 2);
  assert.equal(record.summary.faulty.successCount, 0);
  assert.equal(record.summary.recovery.successCount, 3);
  assert.equal(record.recovery.observed, true);
  assert.ok(record.recovery.durationMs >= 200 && record.recovery.durationMs < 15000);
  assert.deepEqual(proxy.getFault(), { type: 'none' });
  assert.deepEqual(await store.readRecord(record.id), record);
  assert.equal((await runner.stopExperiment(record.id)).state, 'completed');
});

test('stopping a delayed experiment cancels probes and saves incomplete evidence', async t => {
  const { runner, proxy } = await fixture(t);
  const started = await runner.startExperiment({ probeCount: 10, intervalMs: 100, fault: { type: 'delay', delayMs: 2000 } });
  const deadline = Date.now() + 4000;
  while (runner.status().phase !== 'faulty' && Date.now() < deadline) await wait(20);
  assert.equal(runner.status().phase, 'faulty');
  assert.equal((await runner.stopExperiment(started.id)).state, 'stopping');
  const record = await terminal(runner, started.id);
  assert.equal(record.state, 'stopped');
  assert.equal(record.recovery.observed, false);
  assert.equal(record.recovery.durationMs, null);
  assert.deepEqual(proxy.getFault(), { type: 'none' });
  assert.equal((await runner.startExperiment({ mode: 'baseline', probeCount: 1 })).state, 'running');
});

test('failed readiness and failed runtime persistence never claim saved success', async t => {
  const { root, runner, proxy } = await fixture(t);
  const started = await runner.startExperiment({ mode: 'baseline', probeCount: 3, intervalMs: 500 });
  await rm(root, { recursive: true, force: true });
  await writeFile(root, 'occupied');
  const record = await terminal(runner, started.id);
  assert.equal(record.state, 'failed');
  assert.equal(record.persistence.state, 'failed');
  assert.deepEqual(proxy.getFault(), { type: 'none' });
  await assert.rejects(runner.startExperiment({}), { code: 'storage_unavailable' });
});

test('shutdown reports unsaved evidence after resetting active faults', async t => {
  const { runner, store, proxy } = await fixture(t);
  const started = await runner.startExperiment({ mode: 'baseline', probeCount: 3, intervalMs: 500 });
  store.saveRecord = async () => { throw Object.assign(new Error('Synthetic save failure'), { code: 'storage_unavailable', status: 503 }); };
  await assert.rejects(runner.close(), { code: 'storage_unavailable' });
  assert.equal((await runner.getExperiment(started.id)).persistence.state, 'failed');
  assert.deepEqual(proxy.getFault(), { type: 'none' });
  store.saveRecord = async () => {};
});

test('recovery exhaustion reports no observed recovery or invented duration', async t => {
  const { runner, proxy, demo } = await fixture(t);
  const clear = proxy.clearFault;
  proxy.clearFault = async () => { await clear(); await demo.close(); };
  const started = await runner.startExperiment({ probeCount: 1, intervalMs: 100, timeoutMs: 500, fault: { type: 'interruption' } });
  const record = await terminal(runner, started.id, 17000);
  proxy.clearFault = clear;
  assert.equal(record.state, 'completed');
  assert.equal(record.recovery.observed, false); assert.equal(record.recovery.durationMs, null);
  assert.equal(record.summary.recovery.successCount, 0);
  assert.ok(record.summary.recovery.failureCount > 0);
  assert.deepEqual(proxy.getFault(), { type: 'none' });
});
