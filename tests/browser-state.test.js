import test from 'node:test';
import assert from 'node:assert/strict';
import { browserFixture } from './helpers/browser.js';

test('starting during an older refresh retains the new run and schedules its controls/polling', async () => {
  const { elements, a, b, state, timers, settle } = await browserFixture();
  elements.history.value = a.id; elements.history.listeners.change(); await settle();
  state.hold = true; elements.refresh.listeners.click(); await settle();
  assert.equal(typeof state.release, 'function');
  elements.settings.listeners.submit({ preventDefault() {} }); await settle();
  assert.equal(state.posted, true);
  state.release(); await settle();
  assert.match(elements['run-info'].textContent, new RegExp(b.id));
  assert.equal(elements.stop.disabled, false);
  assert.equal(elements.start.disabled, true);
  assert.equal(elements['run-badge'].textContent, 'running');
  assert.equal(elements['metric-availability'].textContent, '—');
  assert.ok([...timers.values()].some(timer => timer.ms === 1000));
});
