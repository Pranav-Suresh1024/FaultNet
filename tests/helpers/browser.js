import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { setImmediate as turn } from 'node:timers/promises';
import * as results from '../../public/results.js';
import * as scenarios from '../../public/scenarios.js';
import { createRecord } from '../../src/storage/records.js';
import { normalizeSettings } from '../../src/control/validation.js';

export async function browserFixture() {
  class Element {
    value = ''; disabled = false; hidden = false; textContent = ''; listeners = {}; children = [];
    get valueAsNumber() { return Number(this.value); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    replaceChildren(...children) { this.children = children; }
    append(...children) { this.children.push(...children); }
    setAttribute() {} click() {} setCustomValidity() {} reportValidity() {}
  }
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  // Prospective controls let behavior tests fail before the HTML is implemented.
  for (const id of ['scenario', 'scenario-note', 'reuse', 'summary-phase', 'statistics', 'probes', 'probe-note', 'distribution-chart', 'outcome-chart', 'budget-note', 'selection-error']) elements[id] ??= new Element();
  for (const [id, value] of Object.entries({ mode: 'baseline', count: '1', interval: '100', timeout: '3000', fault: 'delay', delay: '500', rate: '32', 'summary-phase': 'auto' })) elements[id].value = value;
  const a = createRecord(normalizeSettings({ mode: 'baseline', probeCount: 1 }));
  a.state = 'completed'; a.endedAt = a.startedAt;
  const b = createRecord(a.settings);
  const state = { active: null, hold: false, release: null, posted: false, comparisonError: false, selectedError: false, historyError: false, statusError: false };
  const timers = new Map(); let nextTimer = 0;
  const response = value => ({ ok: true, json: async () => structuredClone(value) });
  const failure = () => ({ ok: false, json: async () => ({ error: { message: 'Synthetic corrupt record' } }) });
  const fetch = async (path, options = {}) => {
    if (path === '/api/session') return response({ token: 'synthetic' });
    if (path === '/api/status') return state.statusError ? failure() : response({ demoReady: true, storageReady: true,
      activeExperimentId: state.active, phase: state.active ? 'baseline' : null, fault: { type: 'none' } });
    if (path === '/api/experiments' && options.method === 'POST') { state.posted = true; state.active = b.id; return response({ experiment: b }); }
    if (path === '/api/experiments') return state.historyError ? failure() : response({ experiments: [a, ...(state.posted ? [b] : [])], errors: [] });
    if (path === '/api/experiments/broken') return failure();
    if (path === '/api/experiments/' + a.id && state.hold) {
      state.hold = false; return new Promise(resolve => { state.release = () => resolve(response({ experiment: a })); });
    }
    if (path === '/api/experiments/' + a.id) return state.selectedError ? failure() : response({ experiment: a });
    if (path === '/api/experiments/' + b.id) return response({ experiment: b });
    throw new Error('Unexpected request: ' + path);
  };
  const script = (await readFile(new URL('../../public/app.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
  runInNewContext(script, { ...results, ...scenarios, renderCharts() {}, fetch, document: { getElementById: id => elements[id],
    createElement: () => new Element(), createElementNS: () => new Element() }, Option: Element,
    setTimeout: (callback, ms) => { const id = ++nextTimer; timers.set(id, { callback, ms }); return id; }, clearTimeout: id => timers.delete(id) });
  async function settle() { for (let i = 0; i < 10; i++) await turn(); }
  await settle();
  return { elements, a, b, state, timers, settle };
}
