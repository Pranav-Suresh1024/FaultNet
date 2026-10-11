import { metric, compareRuns } from './results.js';

const el = id => document.getElementById(id);
let token, selected = null, activeId = null, timer = null, refreshing = false, selectionVersion = 0, refreshAgain = false, starting = false;
function message(text = '') { el('message').textContent = text; el('message').hidden = !text; }
async function api(path, options = {}) {
  const response = await fetch('/api/' + path, { ...options, headers: { 'X-FaultNet-Token': token,
    'Content-Type': 'application/json' } });
  if (!response.ok) { const body = await response.json(); throw new Error(body.error?.message || 'The request failed.'); }
  return response;
}
function rows(id, data) {
  el(id).replaceChildren(...data.map(values => {
    const row = document.createElement('tr');
    values.forEach((value, i) => { const cell = document.createElement(i ? 'td' : 'th'); if (!i) cell.scope = 'row'; cell.textContent = value; row.append(cell); });
    return row;
  }));
}
function render(record) {
  selected = record;
  el('run-info').textContent = `${record.createdAt} · ${record.state} · ${record.settings.mode} · fault: ${JSON.stringify(record.settings.fault)} · ${record.id}`;
  rows('phases', ['baseline', 'faulty', 'recovery'].map(phase => {
    const s = record.summary[phase];
    return [phase, `${s.attemptCount} / ${s.cancelledCount}`, `${s.successCount} / ${s.eligibleCount}`, metric(s.availability, true), metric(s.medianElapsedMs), metric(s.p95ElapsedMs), metric(s.meanThroughputKiBps)];
  }));
  const recovery = record.recovery;
  el('recovery').textContent = record.settings.mode === 'baseline' ? 'Recovery does not apply to a baseline-only run.'
    : recovery.observed ? `Recovery confirmed after ${metric(recovery.durationMs)} ms.`
    : ['running', 'stopping'].includes(record.state) ? 'Recovery has not been confirmed yet.'
    : record.state === 'completed' ? 'Recovery was not observed within the 15-second window.' : 'Incomplete experiment: recovery was not confirmed.';
  if (record.persistence.state === 'failed') message('Save failed. This evidence exists only in memory; download it before closing the application.');
  else if (record.error) message(record.error.message);
  el('json').disabled = el('csv').disabled = false;
}
function option(record) {
  const node = document.createElement('option'); node.value = record.id;
  node.textContent = `${record.createdAt} · ${record.state} · ${record.settings.fault.type} · ${record.id.slice(0, 8)}`; return node;
}
async function history() {
  const data = await (await api('experiments')).json();
  for (const id of ['history', 'compare']) {
    const previous = el(id).value;
    el(id).replaceChildren(new Option(id === 'history' ? 'Choose a saved experiment' : 'Choose another experiment', ''), ...data.experiments.map(option));
    el(id).value = previous;
  }
  el('record-errors').textContent = data.errors.map(error => `${error.id || 'Invalid record'}: ${error.message}`).join(' ');
}
async function comparison() {
  el('comparison-wrap').hidden = true;
  el('comparison-note').textContent = '';
  if (!selected || !el('compare').value) return;
  const current = selected, comparedId = el('compare').value;
  const other = (await (await api('experiments/' + comparedId)).json()).experiment;
  if (selected !== current || el('compare').value !== comparedId) return;
  if (!compareRuns(current, other)) { el('comparison-note').textContent = 'These runs have incompatible protocol settings. Compare runs with the same mode, count, interval, timeout, payload contract, and recovery rules.'; return; }
  el('comparison-note').textContent = `Selected fault: ${JSON.stringify(current.settings.fault)}. Compared fault: ${JSON.stringify(other.settings.fault)}. States: ${current.state} / ${other.state}.`;
  rows('comparison', ['baseline', 'faulty', 'recovery'].map(phase => {
    const a = current.summary[phase], b = other.summary[phase];
    return [phase, `${metric(a.availability, true)} / ${metric(b.availability, true)}`, `${metric(a.medianElapsedMs)} / ${metric(b.medianElapsedMs)}`, `${metric(a.meanThroughputKiBps)} / ${metric(b.meanThroughputKiBps)}`];
  }));
  el('comparison-wrap').hidden = false;
}
function faultFields() {
  const baseline = el('mode').value === 'baseline';
  el('fault').disabled = baseline;
  for (const [label, input, show] of [['delay-label', 'delay', !baseline && el('fault').value === 'delay'], ['rate-label', 'rate', !baseline && el('fault').value === 'bandwidth']]) {
    el(label).hidden = !show; el(input).disabled = !show;
  }
  el('fault-hint').textContent = baseline ? 'Baseline-only runs disable fault controls and skip recovery.'
    : el('fault').value === 'bandwidth' ? 'A 64 KiB response takes about 64 ÷ rate seconds. If that exceeds the request timeout, failed probes are expected.'
    : el('fault').value === 'interruption' ? 'Each faulty request is deliberately interrupted; recovery probes begin after the fault is cleared.'
    : 'The configured delay is added before the demo response. Delays longer than the request timeout cause failed probes.';
}
async function refresh() {
  if (refreshing) { refreshAgain = true; return; }
  refreshing = true;
  refreshAgain = false;
  const version = selectionVersion;
  clearTimeout(timer);
  try {
    const status = await (await api('status')).json();
    if (version !== selectionVersion) { refreshAgain = true; return; }
    activeId = status.activeExperimentId;
    el('status').textContent = `Demo: ${status.demoReady ? 'ready' : 'unavailable'} · Storage: ${status.storageReady ? 'ready' : 'unavailable'} · Phase: ${status.phase || 'idle'} · Fault: ${status.fault.type}`;
    el('start').disabled = starting || Boolean(activeId) || !status.demoReady || !status.storageReady;
    el('stop').disabled = !activeId; el('fields').disabled = Boolean(activeId);
    if (activeId || selected) {
      const record = (await (await api('experiments/' + (activeId || selected.id))).json()).experiment;
      if (version === selectionVersion) render(record);
      else refreshAgain = true;
      await comparison();
    }
    await history();
  } catch (error) { message(error.message); el('start').disabled = true; }
  finally {
    refreshing = false;
    if (refreshAgain && !starting) refresh();
    else if (activeId) timer = setTimeout(refresh, 1000);
  }
}
async function action(work) { message(); try { await work(); } catch (error) { message(error.message); } }
el('mode').addEventListener('change', faultFields);
el('fault').addEventListener('change', faultFields);
el('settings').addEventListener('submit', event => {
  event.preventDefault();
  action(async () => {
    if (starting) return;
    starting = true; selectionVersion++;
    el('start').disabled = true;
    const type = el('mode').value === 'baseline' ? 'none' : el('fault').value;
    const settings = { mode: el('mode').value, probeCount: el('count').valueAsNumber, intervalMs: el('interval').valueAsNumber,
      timeoutMs: el('timeout').valueAsNumber, fault: { type, ...(type === 'delay' ? { delayMs: el('delay').valueAsNumber } : type === 'bandwidth' ? { rateKiBps: el('rate').valueAsNumber } : {}) } };
    try {
      const record = (await (await api('experiments', { method: 'POST', body: JSON.stringify(settings) })).json()).experiment;
      activeId = record.id; render(record);
    } finally { starting = false; await refresh(); }
  });
});
el('stop').addEventListener('click', () => action(async () => { if (activeId) await api(`experiments/${activeId}/stop`, { method: 'POST', body: '{}' }); await refresh(); }));
el('refresh').addEventListener('click', () => action(refresh));
el('history').addEventListener('change', () => action(async () => {
  const version = ++selectionVersion, id = el('history').value;
  if (id) {
    const record = (await (await api('experiments/' + id)).json()).experiment;
    if (version !== selectionVersion) return;
    render(record); await comparison();
  }
}));
el('compare').addEventListener('change', () => action(comparison));
for (const format of ['json', 'csv']) el(format).addEventListener('click', () => action(async () => {
  const id = selected.id;
  const response = await api(`experiments/${id}/export?format=${format}`);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = url; link.download = `faultnet-${id}.${format}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}));
action(async () => { token = (await (await fetch('/api/session')).json()).token; faultFields(); await refresh(); });
