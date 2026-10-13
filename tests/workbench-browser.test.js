import test from 'node:test';
import assert from 'node:assert/strict';
import { browserFixture } from './helpers/browser.js';

test('scenario editing and saved-run reuse only change settings, never start or mutate evidence', async () => {
  const { elements: e, a, state, settle } = await browserFixture();
  e.scenario.value = 'timeout';
  assert.equal(typeof e.scenario.listeners.change, 'function');
  e.fields.listeners.input({ target: { id: 'scenario' } });
  assert.equal(e.scenario.value, 'timeout');
  e.scenario.listeners.change();
  assert.equal(Number(e.delay.value), 2000);
  assert.equal(Number(e.timeout.value), 500);
  assert.equal(state.posted, false);
  e.delay.value = '150';
  e.fields.listeners.input({ target: { id: 'delay' } });
  assert.equal(e.scenario.value, '');
  e.history.value = a.id; e.history.listeners.change(); await settle();
  e.reuse.listeners.click();
  assert.equal(e.mode.value, 'baseline');
  assert.equal(Number(e.count.value), 1);
  assert.equal(a.settings.mode, 'baseline');
  assert.equal(state.posted, false);
  e['summary-phase'].value = 'recovery'; e['summary-phase'].listeners.change();
  assert.match(e['availability-note'].textContent, /Recovery/);
  assert.equal(e['metric-latency'].textContent, '—');
});

test('new scenario/reuse controls disable while a run is active', async () => {
  const { elements: e, settle } = await browserFixture();
  e.settings.listeners.submit({ preventDefault() {} }); await settle();
  assert.equal(e.fields.disabled, true);
  assert.equal(e.reuse.disabled, true);
  assert.equal(e.start.disabled, true);
  assert.equal(e.stop.disabled, false);
});
