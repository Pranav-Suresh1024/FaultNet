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

test('corrupt comparison and history/selection errors do not disable healthy new experiments', async () => {
  const { elements: e, a, state, settle } = await browserFixture();
  e.history.value = a.id; e.history.listeners.change(); await settle();
  e.compare.value = 'broken'; e.compare.listeners.change(); await settle();
  e.refresh.listeners.click(); await settle();
  assert.equal(e.start.disabled, false);
  assert.match(e['comparison-note'].textContent, /corrupt/i);
  e.compare.value = ''; e.compare.listeners.change(); await settle();
  assert.equal(e.start.disabled, false);
  state.selectedError = true; state.historyError = true;
  e.refresh.listeners.click(); await settle();
  assert.equal(e.start.disabled, false);
  assert.match(e['record-errors'].textContent, /corrupt/i);
  assert.match(e['selection-error'].textContent, /corrupt/i);
  state.statusError = true;
  e.refresh.listeners.click(); await settle();
  assert.equal(e.start.disabled, true);
});

test('excessive combined budget disables Start and correcting settings/preset restores it', async () => {
  const { elements: e, settle } = await browserFixture();
  e.mode.value = 'comparison'; e.count.value = '20'; e.interval.value = '250'; e.timeout.value = '3000';
  e.fields.listeners.input({ target: { id: 'count' } });
  assert.equal(e.start.disabled, true);
  assert.match(e['budget-note'].textContent, /145.0.*120/);
  assert.match(e['budget-note'].textContent, /reduce/i);
  e.count.value = '10'; e.fields.listeners.input({ target: { id: 'count' } });
  assert.equal(e.start.disabled, false);
  e.count.value = ''; e.fields.listeners.input({ target: { id: 'count' } });
  assert.equal(e.start.disabled, true);
  e.scenario.value = 'healthy'; e.scenario.listeners.change(); await settle();
  assert.equal(e.start.disabled, false);
  assert.match(e['budget-note'].textContent, /16.3/);
});

test('late comparison failure cannot overwrite a cleared selection', async () => {
  const { elements: e, a, state, settle } = await browserFixture();
  e.history.value = a.id; e.history.listeners.change(); await settle();
  state.holdBroken = true;
  e.compare.value = 'broken'; e.compare.listeners.change(); await settle();
  assert.equal(typeof state.releaseBroken, 'function');
  e.compare.value = ''; e.compare.listeners.change(); await settle();
  state.releaseBroken(); await settle();
  assert.match(e['comparison-note'].textContent, /Select a run/);
  assert.equal(e.start.disabled, false);
});
