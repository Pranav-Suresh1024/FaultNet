import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings } from '../src/control/validation.js';
import { summarize } from '../src/experiments/metrics.js';
import { compareRuns as compatible } from '../public/results.js';

test('settings normalize defaults and reject unapproved targets and unsafe budgets', () => {
  const defaults = normalizeSettings({});
  assert.equal(defaults.probeCount, 10);
  assert.deepEqual(defaults.fault, { type: 'delay', delayMs: 500 });
  assert.equal(defaults.demoContract, 'faultnet-demo-v1');
  assert.deepEqual(normalizeSettings({ mode: 'baseline' }).fault, { type: 'none' });
  for (const settings of [null, [], { mode: null }, { probeCount: null }, { fault: null }, { fault: { type: 'delay', delayMs: null } }, { target: 'https://example.com' }, { probeCount: 1.5 },
    { probeCount: 20, timeoutMs: 5000, intervalMs: 2000 }, { fault: { type: 'bandwidth', rateKiBps: 0 } },
    { mode: 'baseline', fault: { type: 'interruption' } }, { fault: { type: 'delay', rateKiBps: 32 } }]) {
    assert.throws(() => normalizeSettings(settings), { code: 'invalid_input' });
  }
});

test('metrics use successful eligible attempts, nearest-rank p95, and null for missing data', () => {
  const empty = summarize([]);
  assert.equal(empty.availability, null);
  const observations = [10, 20, 30, 40].map(elapsedMs => ({ elapsedMs, bytesReceived: 65536, successful: true, outcome: 'response_complete' }));
  observations.push({ elapsedMs: 100, bytesReceived: 0, successful: false, outcome: 'timeout' });
  observations.push({ elapsedMs: 1, bytesReceived: 0, successful: false, outcome: 'cancelled' });
  const summary = summarize(observations);
  assert.equal(summary.attemptCount, 6);
  assert.equal(summary.eligibleCount, 5);
  assert.equal(summary.availability, 0.8);
  assert.equal(summary.meanElapsedMs, 25);
  assert.equal(summary.medianElapsedMs, 25);
  assert.equal(summary.p95ElapsedMs, 40);
  assert.equal(summarize([{ elapsedMs: 0, bytesReceived: 65536, successful: true, outcome: 'response_complete' }]).meanThroughputKiBps, null);
  assert.equal(summarize([{ outcome: 'cancelled', successful: false }]).availability, null);
});

test('cross-run compatibility includes protocol while allowing differing faults', () => {
  const a = { schemaVersion: 1, settings: normalizeSettings({}) };
  const b = { schemaVersion: 1, settings: normalizeSettings({ fault: { type: 'interruption' } }) };
  assert.equal(compatible(a, b), true);
  b.settings.timeoutMs = 4000;
  assert.equal(compatible(a, b), false);
});
