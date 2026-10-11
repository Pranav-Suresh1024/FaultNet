import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecord, createStore, refreshRecord, validateRecord } from '../src/storage/records.js';
import { normalizeSettings } from '../src/control/validation.js';
import { exportRecord } from '../src/storage/export.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'faultnet-records-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, store: await createStore(root) };
}

test('records reopen, reject corrupt/unsupported input and preserve valid prior files', async t => {
  const { root, store } = await fixture(t);
  const record = createRecord(normalizeSettings({ mode: 'baseline' }));
  await store.saveRecord(record);
  assert.deepEqual(await store.readRecord(record.id), record);
  assert.equal((await store.listRecords()).records.length, 1);
  await assert.rejects(store.readRecord('../README'), { code: 'invalid_input' });
  record.observations.push({ phase: 'baseline', startedAt: record.startedAt, elapsedMs: 10, outcome: 'response_complete', httpStatus: 200, bytesReceived: 65536, successful: true });
  refreshRecord(record);
  record.summary.baseline.availability = 0;
  await assert.rejects(store.saveRecord(record), { code: 'record_corrupt' });
  assert.equal((await store.readRecord(record.id)).observations.length, 0);
  await writeFile(join(root, record.id + '.json'), '{bad');
  await assert.rejects(store.readRecord(record.id), { code: 'record_corrupt' });
  assert.equal((await store.listRecords()).errors.length, 1);
  record.schemaVersion = 99;
  await writeFile(join(root, record.id + '.json'), JSON.stringify(record));
  await assert.rejects(store.readRecord(record.id), { code: 'record_unsupported' });
});

test('restart labels active records interrupted and storage failures are explicit', async t => {
  const { root, store } = await fixture(t);
  const record = createRecord(normalizeSettings({}));
  await store.saveRecord(record);
  const reopened = await createStore(root);
  assert.equal((await reopened.readRecord(record.id)).state, 'interrupted');
  const blocked = join(root, 'not-a-directory');
  await writeFile(blocked, 'occupied');
  await assert.rejects(createStore(blocked), { code: 'storage_unavailable' });
  await rm(root, { recursive: true, force: true });
  await writeFile(root, 'occupied');
  await assert.rejects(store.saveRecord(createRecord(normalizeSettings({}))), { code: 'storage_unavailable' });
});

test('JSON and CSV preserve metadata, safe text and null values, including empty runs', async t => {
  const { store } = await fixture(t);
  const record = createRecord(normalizeSettings({ mode: 'baseline' }));
  record.evidenceReferences = [{ source: 'packet_tracer', path: 'labs/synthetic-note.md', description: '=SUM(1,2)' }];
  await store.saveRecord(record);
  const json = exportRecord(record, 'json');
  assert.deepEqual(JSON.parse(json.content), record);
  const csv = exportRecord(record, 'csv');
  assert.equal(csv.content.split('\r\n').filter(Boolean).length, 2);
  assert.match(csv.content, /recoveryDurationMs/);
  record.error = { code: 'synthetic', message: '=SUM(1,2)' };
  const protectedCsv = exportRecord(record, 'csv').content;
  assert.match(protectedCsv, /'=SUM/);
  assert.throws(() => exportRecord(record, 'html'), { code: 'invalid_input' });
});

test('record validation rejects observations and recovery outside the experiment chronology', () => {
  const record = createRecord(normalizeSettings({ mode: 'baseline' }));
  record.state = 'completed'; record.endedAt = record.startedAt;
  record.observations.push({ phase: 'baseline', startedAt: '2099-01-01T00:00:00.000Z', elapsedMs: 10,
    outcome: 'response_complete', httpStatus: 200, bytesReceived: 65536, successful: true });
  refreshRecord(record);
  assert.throws(() => validateRecord(record), { code: 'record_corrupt' });
  const comparison = createRecord(normalizeSettings({}));
  comparison.recovery.removedAt = '2000-01-01T00:00:00.000Z';
  assert.throws(() => validateRecord(comparison), { code: 'record_corrupt' });
});
