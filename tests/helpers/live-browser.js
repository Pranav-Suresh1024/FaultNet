import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { setImmediate as turn } from 'node:timers/promises';
import * as model from '../../public/live-model.js';
import { defaultConfig, validateConfig } from '../../src/live/config.js';

export async function liveBrowserFixture() {
  class Element {
    children = []; dataset = {}; listeners = {}; value = ''; checked = false; disabled = false; hidden = false; textContent = ''; attributes = {};
    constructor(tag = 'div') { this.tagName = tag; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    setAttribute(key, value) { this.attributes[key] = value; }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    querySelectorAll(selector) {
      const matches = element => selector === '.rule' || selector === '.empty' ? element.className === selector.slice(1)
        : selector === '[data-key]' ? Boolean(element.dataset.key) : selector.split(', ').includes(element.tagName);
      return this.children.flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
    closest() { return ['sample-path', 'traffic-filter'].includes(this.id) ? this : null; }
    checkValidity() { return true; }
    reportValidity() { return true; }
  }
  const html = await readFile(new URL('../../public/live.html', import.meta.url), 'utf8');
  const elements = {};
  for (const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"/g)) {
    elements[match[2]] = new Element(match[1]); elements[match[2]].id = match[2];
  }
  const form = elements['live-form'];
  for (const element of Object.values(elements)) if (element !== form) form.append(element);
  elements['traffic-filter'].value = 'all'; elements['sample-path'].value = '/payload';
  const state = { config: defaultConfig('http://127.0.0.1:3001'), activity: { entries: [], activeCount: 0 },
    calls: [], offline: false, holdSample: false, releaseSample: null };
  const response = (value, ok = true) => ({ ok, json: async () => structuredClone(value) });
  async function fetch(path, options = {}) {
    const body = options.body === undefined ? undefined : JSON.parse(options.body);
    state.calls.push({ path, body });
    if (state.offline) throw new Error('Synthetic offline');
    if (path === '/api/session') return response({ token: 'synthetic' });
    if (path === '/api/live/config') {
      if (body !== undefined) {
        try { state.config = validateConfig(body, [3000, 3002, 8080]); }
        catch (error) { return response({ error: { message: error.message } }, false); }
      }
      return response({ config: state.config, proxyUrl: 'http://127.0.0.1:8080' });
    }
    if (path === '/api/live/activity') return response(state.activity);
    if (path === '/api/live/activity/clear') { state.activity = { entries: [], activeCount: 0 }; return response(state.activity); }
    if (path === '/api/live/reset') { state.config = defaultConfig(state.config.target); return response({ config: state.config }); }
    if (path === '/api/live/probe') {
      if (state.holdSample) await new Promise(resolve => { state.releaseSample = resolve; });
      return response({ status: 200, bytes: 65536, elapsedMs: 10, outcome: 'completed' });
    }
    throw new Error('Unexpected API route ' + path);
  }
  const timers = [];
  const script = (await readFile(new URL('../../public/live.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '')
    .replace('await load(); poll();', 'load().then(poll);');
  const createElement = tag => {
    const element = new Element(tag);
    Object.defineProperty(element, 'id', { get() { return this.identifier; }, set(value) { this.identifier = value; elements[value] = this; } });
    return element;
  };
  runInNewContext(script, { ...model, fetch, setTimeout: callback => { timers.push(callback); },
    document: { getElementById: id => elements[id], createElement, createElementNS: (_ns, tag) => createElement(tag) } });
  async function settle() { for (let i = 0; i < 10; i++) await turn(); }
  await settle();
  async function click(element) { if (!element.disabled) await element.listeners.click?.({ preventDefault() {} }); await settle(); }
  async function edit(id, value) {
    elements[id].value = value; form.listeners.input({ target: elements[id] }); elements[id].listeners.change?.(); await settle();
  }
  async function apply() { await form.listeners.submit({ preventDefault() {} }); await settle(); }
  return { elements, state, timers, settle, click, edit, apply };
}
