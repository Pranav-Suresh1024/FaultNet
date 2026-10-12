import test from 'node:test';
import assert from 'node:assert/strict';
import { metric, compareRuns, phaseView } from '../public/results.js';
import { normalizeSettings } from '../src/control/validation.js';
import { createRecord } from '../src/storage/records.js';

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
