import test from 'node:test';
import assert from 'node:assert/strict';
import { metric, compareRuns } from '../public/results.js';
import { normalizeSettings } from '../src/control/validation.js';

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
