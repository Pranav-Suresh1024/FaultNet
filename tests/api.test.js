import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as wait } from 'node:timers/promises';
import { get, request as httpRequest } from 'node:http';
import { startApp } from '../src/app.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'faultnet-api-'));
  const app = await startApp({ controlPort: 0, demoPort: 0, proxyPort: 0, livePort: 0, resultsRoot: root });
  t.after(async () => { await app.close(); await rm(root, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${app.port}`;
  const token = (await (await fetch(origin + '/api/session')).json()).token;
  const request = (path, options = {}) => fetch(origin + path, { ...options,
    headers: { 'X-FaultNet-Token': token, Origin: origin, 'Content-Type': 'application/json', ...options.headers } });
  return { root, app, origin, token, request };
}

test('live configuration and sample APIs retain control protections and reset semantics', async t => {
  const { origin, request, app } = await fixture(t);
  assert.ok(app.livePort > 0);
  assert.equal((await fetch(origin + '/api/live/config')).status, 403);
  const initial = await (await request('/api/live/config')).json();
  assert.equal(initial.config.failureMode, 'normal');
  assert.equal(initial.proxyUrl, `http://127.0.0.1:${app.livePort}`);
  let response = await request('/api/live/config', { method: 'POST', body: JSON.stringify({ ...initial.config, responseDelayMs: 30 }) });
  assert.equal(response.status, 200);
  assert.equal((await request('/api/live/config', { method: 'POST', body: '{}' })).status, 400);
  assert.equal((await request('/api/live/config', { method: 'PUT' })).status, 405);
  assert.equal((await request('/api/live/reset', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' })).status, 403);
  assert.equal((await request('/api/live/reset', { method: 'POST', body: '{"extra":true}' })).status, 400);
  assert.equal((await request('/api/live/probe', { method: 'POST', body: '{"path":"http://example.com"}' })).status, 400);
  response = await request('/api/live/probe', { method: 'POST', body: '{"path":"/payload"}' });
  const sample = await response.json();
  assert.equal(sample.status, 200); assert.equal(sample.bytes, 65536);
  assert.equal(sample.outcome, 'completed'); assert.ok(sample.elapsedMs >= 25);
  assert.equal((await (await request('/api/live/activity')).json()).entries.length, 1);
  assert.equal((await request('/api/live/activity/clear', { method: 'POST', body: '{}' })).status, 200);
  assert.equal((await (await request('/api/live/activity')).json()).entries.length, 0);
  response = await request('/api/live/reset', { method: 'POST', body: '{}' });
  assert.equal((await response.json()).config.responseDelayMs, 0);
  const blocked = { ...initial.config, target: origin };
  assert.equal((await request('/api/live/config', { method: 'POST', body: JSON.stringify(blocked) })).status, 400);
});

test('API rejects untrusted origins, hosts, malformed input and unauthorized results', async t => {
  const { origin, request } = await fixture(t);
  assert.equal((await fetch(origin + '/api/status')).status, 403);
  assert.equal((await request('/api/session', { headers: { Origin: 'https://evil.example' } })).status, 403);
  const hostileHostStatus = await new Promise((resolve, reject) => {
    const req = get(origin + '/api/status', { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject);
  });
  assert.equal(hostileHostStatus, 403);
  assert.equal((await request('/api/status', { headers: { 'X-FaultNet-Token': 'é'.repeat(64) } })).status, 403);
  assert.equal((await request('/api/status', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await request('/api/experiments', { method: 'POST', body: '{bad' })).status, 400);
  assert.equal((await request('/api/experiments', { method: 'POST', body: JSON.stringify({ target: 'http://example.com' }) })).status, 400);
  assert.equal((await request('/api/experiments', { method: 'POST', body: 'x'.repeat(8193) })).status, 413);
  assert.equal((await request('/api/experiments', { method: 'PUT' })).status, 405);
  assert.equal((await request('/api/experiments/not-an-id')).status, 400);
  assert.equal((await request('/src/main.js')).status, 404);
  assert.equal((await request('/results/foo.json')).status, 404);
  assert.equal((await request('/api/status')).headers.get('access-control-allow-origin'), null);
});

test('API runs, reopens and exports a real baseline with settings and observations', async t => {
  const { request, root } = await fixture(t);
  const response = await request('/api/experiments', { method: 'POST', body: JSON.stringify({ mode: 'baseline', probeCount: 1 }) });
  assert.equal(response.status, 202);
  const { experiment: started } = await response.json();
  let experiment;
  for (let i = 0; i < 20; i++) {
    await wait(100);
    const recordResponse = await request('/api/experiments/' + started.id);
    assert.equal(recordResponse.status, 200);
    ({ experiment } = await recordResponse.json());
    if (experiment.state === 'completed') break;
  }
  assert.equal(experiment.state, 'completed');
  assert.equal(experiment.summary.baseline.availability, 1);
  assert.equal(experiment.recovery.observed, null);
  const exported = await request(`/api/experiments/${started.id}/export?format=json`);
  assert.deepEqual(await exported.json(), experiment);
  const csv = await request(`/api/experiments/${started.id}/export?format=csv`);
  assert.match(await csv.text(), /65536/);
  assert.match(csv.headers.get('content-disposition'), /^attachment/);
  const stopped = await request(`/api/experiments/${started.id}/stop`, { method: 'POST', body: '{}' });
  assert.equal(stopped.status, 200);
  await writeFile(join(root, 'invalid.json'), '{bad');
  const listed = await (await request('/api/experiments')).json();
  assert.equal(listed.experiments.length, 1);
  assert.equal(listed.errors.length, 1);
});

test('API bounds request rate without changing experiments', async t => {
  const { request } = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 25 }, () => request('/api/status')));
  assert.ok(responses.some(response => response.status === 429));
});

test('canonicalized and absolute-form API paths retain capability and Origin checks', async t => {
  const { app, origin, token } = await fixture(t);
  for (const path of ['/other/../api/status', origin + '/api/status', '/other/../api/experiments']) {
    const status = await new Promise((resolve, reject) => {
      const mutation = path.endsWith('/experiments');
      const req = httpRequest({ hostname: '127.0.0.1', port: app.port, path, method: mutation ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' } }, res => { res.resume(); resolve(res.statusCode); });
      req.on('error', reject); req.end(mutation ? '{"mode":"baseline","probeCount":1}' : undefined);
    });
    assert.equal(status, 403, path);
  }
  assert.equal((await fetch(origin + '/api/experiments', { method: 'POST', headers: { 'X-FaultNet-Token': token,
    'Content-Type': 'application/json' }, body: '{"mode":"baseline"}' })).status, 403);
});

test('dashboard serves only allowlisted assets with protective browser headers', async t => {
  const { origin } = await fixture(t);
  for (const path of ['/', '/workbench', '/live.js', '/live-model.js', '/live.css', '/app.js', '/results.js', '/styles.css']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok((await response.text()).length > 20);
  }
  assert.equal((await fetch(origin + '/package.json')).status, 404);
});
