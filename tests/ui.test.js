import test from 'node:test';
import assert from 'node:assert/strict';
import { metric, compareRuns, phaseView } from '../public/results.js';
import { normalizeSettings } from '../src/control/validation.js';
import { createRecord, refreshRecord } from '../src/storage/records.js';

test('presentation preserves missing values and rejects incompatible run comparisons', () => {
  assert.equal(metric(null), '—');
  assert.equal(metric(0), '0.0');
  assert.equal(metric(0.8, true), '80.0%');
  const a = { schemaVersion: 1, settings: normalizeSettings({}) };
  const b = { ...a, settings: normalizeSettings({ fault: { type: 'interruption' } }) };
  assert.equal(compareRuns(a, b), true);
  assert.equal(compareRuns(a, { ...b, settings: { ...b.settings, timeoutMs: 2000 } }), false);
  assert.equal(compareRuns(a, null), false);
});

test('workbench phase selection derives statistics, outcome counts and a distribution from actual observations', () => {
  const record = createRecord(normalizeSettings({}));
  const add = (phase, elapsedMs, successful = true, outcome = 'response_complete') => record.observations.push({
    phase, elapsedMs, successful, outcome, startedAt: record.startedAt, httpStatus: successful ? 200 : null, bytesReceived: successful ? 65536 : 0 });
  add('baseline', 10); add('baseline', 20);
  for (const time of [0, 10, 20, 30]) add('recovery', time);
  add('recovery', 500, false, 'timeout'); add('recovery', 100, false, 'cancelled');
  refreshRecord(record);
  const view = phaseView(record, 'recovery');
  assert.equal(view.phase, 'recovery');
  assert.deepEqual(view.statistics, { meanMs: 15, medianMs: 15, p95Ms: 30, minMs: 0, maxMs: 30, sampleCount: 4 });
  assert.deepEqual(view.outcomes, { successful: 4, failed: 1, cancelled: 1 });
  assert.equal(view.probes.length, 6);
  assert.equal(view.histogram.reduce((sum, bin) => sum + bin.count, 0), 4);
  assert.equal(view.baselineDelta.medianMs, 0);
  assert.equal(view.baselineDelta.availabilityPoints, -20);
  const failed = phaseView(record, 'faulty');
  assert.equal(failed.statistics.sampleCount, 0);
  assert.equal(failed.statistics.minMs, null);
  assert.deepEqual(failed.histogram, []);
});

test('constant and zero samples preserve zero and do not invent a relative change', () => {
  const record = createRecord(normalizeSettings({}));
  record.observations = ['baseline', 'faulty', 'faulty'].map(phase => ({ phase, elapsedMs: 0, successful: true,
    outcome: 'response_complete', startedAt: record.startedAt, httpStatus: 200, bytesReceived: 65536 }));
  refreshRecord(record);
  const view = phaseView(record, 'faulty');
  assert.deepEqual(view.histogram, [{ lowMs: 0, highMs: 0, count: 2 }]);
  assert.equal(view.statistics.meanMs, 0);
  assert.equal(view.baselineDelta.medianPercent, null);
  assert.equal(view.baselineDelta.throughputKiBps, null);
});

test('six editable presets validate and saved-run reuse produces an independent settings copy', async () => {
  let scenarios;
  await assert.doesNotReject(async () => { scenarios = await import('../public/scenarios.js'); });
  assert.equal(scenarios.scenarioProfiles.length, 6);
  for (const profile of scenarios.scenarioProfiles) normalizeSettings(profile.settings);
  const stress = scenarios.scenarioProfiles.find(profile => profile.id === 'timeout');
  assert.ok(stress.settings.fault.delayMs > stress.settings.timeoutMs);
  const saved = createRecord(normalizeSettings(stress.settings));
  const copy = scenarios.settingsFromRecord(saved);
  assert.deepEqual(copy, stress.settings);
  copy.fault.delayMs = 0;
  assert.equal(saved.settings.fault.delayMs, 2000);
});

test('dashboard cards and chart use measured phases and preserve unavailable values', () => {
  const record = createRecord(normalizeSettings({}));
  let view = phaseView(record);
  assert.equal(view.phase, 'baseline');
  assert.deepEqual(view.chart.map(item => item.medianMs), [null, null, null]);
  record.summary.faulty = { ...record.summary.faulty, attemptCount: 2, eligibleCount: 2, successCount: 0, availability: 0 };
  view = phaseView(record);
  assert.equal(view.phase, 'faulty');
  assert.equal(view.summary.availability, 0);
  assert.equal(view.chart[1].medianMs, null);
  record.summary.faulty.medianElapsedMs = 0;
  assert.equal(phaseView(record).chart[1].medianMs, 0);
  record.settings.mode = 'baseline';
  assert.equal(phaseView(record).phase, 'baseline');
});
