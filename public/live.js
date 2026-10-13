import { networkControls, networkProfiles, networkConfig, activityStats } from './live-model.js';

const $ = id => document.getElementById(id);
let token, ready = false, dirty = false, busy = false, sampling = false, lastActivity = { entries: [], activeCount: 0 }, fieldId = 0;
const form = $('live-form');
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
function errorAt(id, error) { $(id).textContent = error?.message || ''; $(id).hidden = !error; }
async function api(path, body) {
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'X-FaultNet-Token': token || '', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error?.message || 'Request failed.');
  return value;
}
function syncMode() {
  const split = $('mode').value === 'split';
  $('unified-target').hidden = split; $('split-targets').hidden = !split;
  $('target').disabled = busy || !ready || split;
  for (const id of ['frontendTarget', 'backendTarget', 'backendRoutes']) $(id).disabled = busy || !ready || !split;
}
function state() {
  $('apply').disabled = !ready || !dirty || busy;
  $('apply').textContent = dirty ? 'Apply changes' : 'System synced';
  $('sync-state').textContent = busy ? 'Working…' : !ready ? 'Offline / reload' : dirty ? 'Draft · not applied' : 'Ready · applied';
}
function setBusy(value) {
  busy = value;
  for (const control of form.querySelectorAll('input, select, textarea, button')) control.disabled = value || !ready;
  $('reload').disabled = value; $('reset').disabled = value || !ready;
  $('sample').disabled = value || !ready || sampling;
  syncMode(); state();
}
function changed() { dirty = true; state(); }
function setNetwork(values) {
  for (const { key } of networkControls) { $(key).value = values[key]; $(key + '-range').value = values[key]; }
  for (const button of $('presets').children) {
    const profile = networkProfiles[Number(button.dataset.profile)];
    button.setAttribute('aria-pressed', String(networkControls.every(({ key }) => Number($(key).value) === profile.values[key])));
  }
}
for (const field of networkControls) {
  const row = node('div', undefined, 'network-row'), label = node('label', field.label), numeric = node('div', undefined, 'numeric');
  label.htmlFor = field.key;
  const input = node('input'); Object.assign(input, { id: field.key, type: 'number', min: '0', max: String(field.max), step: '1', required: true });
  const range = node('input'); Object.assign(range, { id: field.key + '-range', type: 'range', min: '0', max: String(field.max), step: '1' });
  range.setAttribute('aria-label', field.label + ' slider, ' + field.unit);
  numeric.append(input, node('small', field.unit)); row.append(label, numeric, range); $('network-controls').append(row);
}
networkProfiles.forEach((profile, index) => {
  const button = node('button'); button.type = 'button'; button.dataset.profile = index;
  button.append(node('span', profile.name), node('small', profile.values.downloadKiBps ? `${profile.values.downloadKiBps} KiB/s ↓` : 'No network limits'));
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { setNetwork(profile.values); changed(); });
  $('presets').append(button);
});

function ruleField(container, label, key, value, type = 'text', bounds = {}) {
  const wrapper = node('label', label), input = node(type === 'textarea' ? 'textarea' : 'input');
  if (type !== 'textarea') input.type = type;
  input.id = 'rule-field-' + ++fieldId; wrapper.htmlFor = input.id; input.dataset.key = key;
  if (type === 'checkbox') { input.checked = value; wrapper.className = 'check'; }
  else { input.value = value; input.required = true; }
  Object.assign(input, bounds); wrapper.append(input); container.append(wrapper);
}
function addRule(kind, rule, markDirty = true) {
  const list = $(kind + '-rules');
  if (list.querySelectorAll('.rule').length >= 8) { errorAt('live-error', new Error('Eight rules maximum per group.')); return; }
  list.querySelector('.empty')?.remove();
  const card = node('div', undefined, 'rule'), heading = node('div', undefined, 'rule-top');
  const remove = node('button', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${kind} rule`);
  remove.addEventListener('click', () => { card.remove(); if (!list.children.length) list.append(node('p', 'No rules configured.', 'empty')); changed(); });
  heading.append(node('strong', kind === 'status' ? 'HTTP STATUS RULE' : 'JSON MOCK RULE'), remove); card.append(heading);
  const fields = node('div', undefined, kind === 'status' ? 'rule-fields' : undefined);
  ruleField(fields, 'Path prefix', 'path', rule.path, 'text', { maxLength: 128, pattern: '/[^?#\\s\\\\]*' });
  if (kind === 'status') {
    ruleField(fields, 'HTTP status', 'status', rule.status, 'number', { min: '400', max: '599', step: '1' });
    ruleField(fields, 'Probability %', 'probability', rule.probability, 'number', { min: '0', max: '100', step: '1' });
  } else {
    ruleField(fields, 'JSON body · max 1024 bytes', 'body', rule.body, 'textarea', { maxLength: 1024 });
    ruleField(fields, 'Active mock', 'active', rule.active, 'checkbox');
  }
  card.append(fields); list.append(card); if (markDirty) changed();
}
function populate(config) {
  for (const key of ['mode', 'target', 'frontendTarget', 'backendTarget', 'failureMode']) $(key).value = config[key];
  $('backendRoutes').value = config.backendRoutes.join(', '); setNetwork(config);
  for (const key of ['stripCORS', 'stripCache', 'corruptContentType']) $(key).checked = config.headerRules[key];
  for (const kind of ['status', 'mock']) {
    $(kind + '-rules').replaceChildren();
    for (const rule of config[kind + 'Rules']) addRule(kind, rule, false);
    if (!config[kind + 'Rules'].length) $(kind + '-rules').append(node('p', 'No rules configured.', 'empty'));
  }
  dirty = false; syncMode(); state();
}
function draft() {
  const readRules = kind => [...$(kind + '-rules').querySelectorAll('.rule')].map(card => {
    const result = {};
    for (const input of card.querySelectorAll('[data-key]')) result[input.dataset.key] = input.type === 'checkbox'
      ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
    return result;
  });
  const headerRules = Object.fromEntries(['stripCORS', 'stripCache', 'corruptContentType'].map(key => [key, $(key).checked]));
  return { mode: $('mode').value, target: $('target').value, frontendTarget: $('frontendTarget').value,
    backendTarget: $('backendTarget').value, backendRoutes: $('backendRoutes').value.split(',').map(value => value.trim()).filter(Boolean),
    ...networkConfig(Object.fromEntries(networkControls.map(({ key }) => [key, $(key).value]))),
    failureMode: $('failureMode').value, headerRules, statusRules: readRules('status'), mockRules: readRules('mock') };
}
form.addEventListener('input', event => {
  if (event.target.closest('.monitor-column')) return;
  const field = networkControls.find(({ key }) => [key, key + '-range'].includes(event.target.id));
  if (field) {
    if (event.target.type === 'range') $(field.key).value = event.target.value;
    else if (event.target.value !== '' && event.target.checkValidity()) $(field.key + '-range').value = event.target.value;
    for (const button of $('presets').children) button.setAttribute('aria-pressed', 'false');
  }
  syncMode(); changed();
});
$('mode').addEventListener('change', syncMode);
$('add-status').addEventListener('click', () => addRule('status', { path: '/api', status: 503, probability: 100 }));
$('add-mock').addEventListener('click', () => addRule('mock', { path: '/api', body: '{"status":"ok","data":[]}', active: true }));
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy || !ready || !dirty || !form.reportValidity()) return;
  let config;
  try { config = draft(); } catch (error) { errorAt('live-error', error); return; }
  setBusy(true); errorAt('live-error');
  try { populate((await api('/api/live/config', config)).config); }
  catch (error) { errorAt('live-error', error); }
  finally { setBusy(false); }
});
async function load() {
  setBusy(true); errorAt('live-error');
  try {
    token = (await api('/api/session')).token;
    const response = await api('/api/live/config'); ready = true; populate(response.config);
    $('proxy-url').textContent = response.proxyUrl; $('proxy-url').href = response.proxyUrl + '/';
  } catch (error) { ready = false; errorAt('live-error', error); }
  finally { setBusy(false); }
}
$('reload').addEventListener('click', load);
$('reset').addEventListener('click', async () => {
  setBusy(true); errorAt('live-error');
  try { populate((await api('/api/live/reset', {})).config); }
  catch (error) { errorAt('live-error', error); }
  finally { setBusy(false); }
});

function renderActivity(activity) {
  lastActivity = activity;
  const stats = activityStats(activity.entries);
  for (const [id, value] of Object.entries({ 'traffic-count': stats.count, 'traffic-altered': stats.altered,
    'traffic-errors': stats.errors, 'traffic-median': stats.medianMs === null ? '—' : stats.medianMs.toFixed(1) })) $(id).textContent = value;
  $('active-count').textContent = `${activity.activeCount} in flight`;
  $('traffic-note').textContent = `Latest ${stats.count}/50 finished requests · ${(stats.bytes / 1024).toFixed(1)} KiB delivered · bodies, queries and credentials excluded`;
  $('traffic-chart').replaceChildren();
  if (activity.entries.length) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 400 80'); svg.setAttribute('role', 'img');
    const max = Math.max(1, ...activity.entries.map(entry => entry.elapsedMs));
    svg.setAttribute('aria-label', `Durations of ${stats.count} finished requests, oldest to newest. Maximum ${max.toFixed(1)} milliseconds. Exact values below.`);
    [...activity.entries].reverse().forEach((entry, index) => {
      const rect = document.createElementNS(ns, 'rect'), width = 400 / stats.count;
      const height = Math.max(1, entry.elapsedMs / max * 74);
      for (const [key, value] of Object.entries({ x: index * width, y: 78 - height, width: Math.max(1, width - 2), height })) rect.setAttribute(key, value);
      if (entry.outcome !== 'completed' || entry.status >= 400) rect.setAttribute('class', 'failed');
      svg.append(rect);
    }); $('traffic-chart').append(svg);
  }
  $('traffic-list').replaceChildren();
  const filter = $('traffic-filter').value;
  const entries = activity.entries.filter(entry => filter === 'all' || (filter === 'altered' && entry.faults.length)
    || (filter === 'errors' && (entry.status >= 400 || entry.outcome !== 'completed')) || (filter === 'clean' && !entry.faults.length));
  if (!entries.length) $('traffic-list').append(node('p', 'No finished requests match. Send a sample or use the application entry.', 'empty'));
  for (const entry of entries) {
    const card = node('article', undefined, 'traffic-entry' + (entry.faults.length ? ' altered' : '')
      + (entry.outcome !== 'completed' || entry.status >= 400 ? ' failed' : ''));
    const top = node('div', undefined, 'entry-top'); top.append(node('strong', entry.method), node('span', new Date(entry.timestamp).toLocaleTimeString()));
    const meta = node('div', undefined, 'entry-meta');
    meta.append(node('span', `HTTP ${entry.status ?? '—'}`), node('span', `${entry.elapsedMs.toFixed(1)} ms`),
      node('span', `${(entry.bytes / 1024).toFixed(1)} KiB`), node('span', entry.outcome));
    card.append(top, node('code', entry.path, 'entry-path'), meta, node('div', entry.faults.length ? entry.faults.join(' · ') : 'Clean forwarding', 'entry-faults'));
    $('traffic-list').append(card);
  }
}
$('traffic-filter').addEventListener('change', () => renderActivity(lastActivity));
$('clear-monitor').addEventListener('click', async () => {
  $('clear-monitor').disabled = true;
  try { renderActivity(await api('/api/live/activity/clear', {})); errorAt('monitor-error'); }
  catch (error) { errorAt('monitor-error', error); }
  finally { $('clear-monitor').disabled = false; }
});
$('sample').addEventListener('click', async () => {
  if (sampling) return;
  sampling = true; $('sample').disabled = true; $('sample-result').textContent = 'Requesting through the applied live proxy…';
  try {
    const result = await api('/api/live/probe', { path: $('sample-path').value });
    $('sample-result').textContent = `${result.outcome} · HTTP ${result.status ?? '—'} · ${result.bytes} bytes · ${result.elapsedMs.toFixed(1)} ms (5-second ceiling)`;
  } catch (error) { $('sample-result').textContent = error.message; }
  finally { sampling = false; $('sample').disabled = busy || !ready; }
});
async function poll() {
  if (ready) {
    try { renderActivity(await api('/api/live/activity')); errorAt('monitor-error'); }
    catch (error) { errorAt('monitor-error', error); }
  }
  setTimeout(poll, 1000);
}
await load(); poll();
