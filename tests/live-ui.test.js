import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { networkProfiles, networkControls, networkConfig, activityStats } from '../public/live-model.js';
import { liveBrowserFixture } from './helpers/live-browser.js';

test('live network presets and editable fields serialize strictly with honest units', () => {
  assert.equal(networkProfiles.length, 5);
  for (const profile of networkProfiles) assert.deepEqual(networkConfig(profile.values), profile.values);
  assert.deepEqual(networkConfig(Object.fromEntries(networkControls.map(field => [field.key, '0']))), networkProfiles[0].values);
  for (const field of networkControls) {
    for (const bad of ['', '-1', '0.5', String(field.max + 1), 'abc']) {
      assert.throws(() => networkConfig({ ...networkProfiles[0].values, [field.key]: bad }));
    }
  }
  assert.ok(networkControls.filter(field => field.key.includes('KiBps')).every(field => field.unit === 'KiB/s'));
});

test('traffic statistics describe the displayed window without fabricated empty values', () => {
  assert.deepEqual(activityStats([]), { count: 0, altered: 0, errors: 0, medianMs: null, bytes: 0 });
  assert.deepEqual(activityStats([
    { elapsedMs: 0, bytes: 10, status: 200, outcome: 'completed', faults: [] },
    { elapsedMs: 100, bytes: 20, status: 503, outcome: 'completed', faults: ['status injection'] },
    { elapsedMs: 200, bytes: 0, status: null, outcome: 'cancelled', faults: ['timeout'] }
  ]), { count: 3, altered: 2, errors: 2, medianMs: 100, bytes: 30 });
});

test('cockpit assets have semantic controls and preserve workbench access', async () => {
  const html = await readFile(new URL('../public/live.html', import.meta.url), 'utf8');
  for (const id of ['live-form', 'apply', 'reset', 'mode', 'target', 'frontendTarget', 'backendTarget',
    'backendRoutes', 'failureMode', 'status-rules', 'mock-rules', 'sample-path', 'sample', 'clear-monitor']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  assert.match(html, /href="\/workbench"/); assert.match(html, /role="alert"/); assert.match(html, /href="#cockpit"/);
  const script = await readFile(new URL('../public/live.js', import.meta.url), 'utf8');
  assert.ok(!/innerHTML|localStorage/.test(script));
});

test('live controls keep edits as drafts, apply complete rules and polling does not overwrite them', async () => {
  const { elements: e, state, timers, click, edit, apply } = await liveBrowserFixture();
  assert.equal(e['proxy-url'].href, 'http://127.0.0.1:8080/');
  assert.equal(e.apply.disabled, true);
  await click(e.presets.children[1]); assert.equal(e.requestDelayMs.value, 50);
  assert.equal(state.calls.filter(call => call.body).length, 0);
  await edit('mode', 'split'); assert.equal(e['split-targets'].hidden, false);
  await edit('backendRoutes', '/api, /graphql'); await edit('requestDelayMs-range', '75');
  assert.equal(e.requestDelayMs.value, '75');
  e.stripCORS.checked = true; e['live-form'].listeners.input({ target: e.stripCORS });
  await click(e['add-status']); await click(e['add-mock']);
  const mockBody = e['mock-rules'].querySelectorAll('[data-key]').find(input => input.dataset.key === 'body');
  mockBody.value = '{"message":"<script>example</script>"}';
  await apply();
  assert.equal(state.config.requestDelayMs, 75); assert.equal(state.config.mode, 'split');
  assert.equal(state.config.headerRules.stripCORS, true); assert.equal(state.config.statusRules[0].status, 503);
  assert.equal(state.config.mockRules.length, 1); assert.equal(e.apply.disabled, true);
  await edit('responseDelayMs', '555'); await timers.shift()();
  assert.equal(e.responseDelayMs.value, '555'); assert.equal(e.apply.disabled, false);
  await click(e.reload); assert.equal(e.responseDelayMs.value, state.config.responseDelayMs);
  await click(e.reset); assert.equal(e.requestDelayMs.value, 0); assert.equal(state.config.statusRules.length, 0);
});

test('invalid JSON remains an unapplied draft and rule removal/filter/sample controls work', async () => {
  const { elements: e, state, click, edit, apply } = await liveBrowserFixture();
  await click(e['add-mock']);
  const body = e['mock-rules'].querySelectorAll('[data-key]').find(input => input.dataset.key === 'body'); body.value = '{bad';
  await apply(); assert.match(e['live-error'].textContent, /valid JSON/);
  assert.equal(state.config.mockRules.length, 0); assert.equal(e.apply.disabled, false);
  await click(e['mock-rules'].querySelectorAll('button')[0]); assert.equal(e['mock-rules'].querySelectorAll('.rule').length, 0);
  await edit('traffic-filter', 'errors'); assert.equal(e['sync-state'].textContent, 'Draft · not applied');
  await click(e.sample); assert.match(e['sample-result'].textContent, /HTTP 200.*65536 bytes/);
  await click(e['clear-monitor']); assert.ok(state.calls.some(call => call.path.endsWith('/clear')));
});

test('an in-flight sample stays disabled across configuration updates', async () => {
  const { elements: e, state, settle, click, apply } = await liveBrowserFixture();
  state.holdSample = true;
  const pending = click(e.sample); await settle(); assert.equal(e.sample.disabled, true);
  await click(e.presets.children[1]); await apply();
  const disabled = e.sample.disabled;
  state.releaseSample(); await pending;
  assert.equal(disabled, true); assert.equal(e.sample.disabled, false);
});
