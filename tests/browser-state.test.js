import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { setImmediate as turn } from 'node:timers/promises';
import { metric, compareRuns, phaseView } from '../public/results.js';
import { createRecord } from '../src/storage/records.js';
import { normalizeSettings } from '../src/control/validation.js';

test('starting during an older refresh retains the new run and schedules its controls/polling', async () => {
  class Element {
    value = ''; disabled = false; hidden = false; textContent = ''; listeners = {};
    get valueAsNumber() { return Number(this.value); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    replaceChildren() {} append() {} click() {}
    setAttribute() {}
  }
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  Object.assign(elements.mode, { value: 'baseline' });
  for (const [id, value] of Object.entries({ count: '1', interval: '100', timeout: '3000', fault: 'delay', delay: '500', rate: '32' })) elements[id].value = value;
  const a = createRecord(normalizeSettings({ mode: 'baseline', probeCount: 1 })); a.state = 'completed'; a.endedAt = a.startedAt;
  const b = createRecord(a.settings);
  let active = null, hold = false, release, posted = false;
  const timers = new Map(); let nextTimer = 0;
  const response = value => ({ ok: true, json: async () => structuredClone(value) });
  const fetch = async (path, options = {}) => {
    if (path === '/api/session') return response({ token: 'synthetic' });
    if (path === '/api/status') return response({ demoReady: true, storageReady: true, activeExperimentId: active,
      phase: active ? 'baseline' : null, fault: { type: 'none' } });
    if (path === '/api/experiments' && options.method === 'POST') { posted = true; active = b.id; return response({ experiment: b }); }
    if (path === '/api/experiments') return response({ experiments: [a, ...(posted ? [b] : [])], errors: [] });
    if (path === '/api/experiments/' + a.id && hold) { hold = false; return new Promise(resolve => { release = () => resolve(response({ experiment: a })); }); }
    if (path === '/api/experiments/' + a.id) return response({ experiment: a });
    if (path === '/api/experiments/' + b.id) return response({ experiment: b });
    throw new Error('Unexpected request: ' + path);
  };
  const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/, '');
  runInNewContext(script, { metric, compareRuns, phaseView, fetch, document: { getElementById: id => elements[id],
    createElement: () => new Element(), createElementNS: () => new Element() },
    Option: Element, setTimeout: (callback, ms) => { const id = ++nextTimer; timers.set(id, { callback, ms }); return id; },
    clearTimeout: id => timers.delete(id) });
  async function settle() { for (let i = 0; i < 10; i++) await turn(); }
  await settle();
  elements.history.value = a.id; elements.history.listeners.change(); await settle();
  hold = true; elements.refresh.listeners.click(); await settle();
  assert.equal(typeof release, 'function');
  elements.settings.listeners.submit({ preventDefault() {} }); await settle();
  assert.equal(posted, true);
  release(); await settle();
  assert.match(elements['run-info'].textContent, new RegExp(b.id));
  assert.equal(elements.stop.disabled, false);
  assert.equal(elements.start.disabled, true);
  assert.equal(elements['run-badge'].textContent, 'running');
  assert.equal(elements['metric-availability'].textContent, '—');
  assert.ok([...timers.values()].some(timer => timer.ms === 1000));
});
