import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { gzipSync } from 'node:zlib';
import { setTimeout as wait } from 'node:timers/promises';
import { listen } from '../src/http.js';
import { defaultConfig, validateConfig, validateAddress } from '../src/live/config.js';
import { startLiveProxy } from '../src/live/server.js';

async function fixture(t) {
  const received = [];
  const target = await listen(createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    received.push({ method: req.method, url: req.url, body: Buffer.concat(chunks).toString() });
    res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 'max-age=60');
    res.setHeader('ETag', 'example'); res.setHeader('Content-Type', 'application/json');
    if (req.url === '/payload') res.end(Buffer.alloc(32768, 'F'));
    else if (req.url === '/compressed') { res.setHeader('Content-Encoding', 'gzip'); res.end(gzipSync('compressed')); }
    else if (req.url === '/empty') res.writeHead(204).end();
    else res.end(JSON.stringify(received.at(-1)));
  }), 0);
  const live = await startLiveProxy({ port: 0, target: `http://127.0.0.1:${target.port}`, blockedPorts: [] });
  t.after(async () => { await live.close(); await target.close(); });
  const origin = `http://127.0.0.1:${live.port}`;
  const configure = changes => live.setConfig({ ...live.getConfig(), ...changes });
  return { live, origin, configure, received, target };
}

test('live configuration rejects malformed rules, unsafe targets and DNS addresses', () => {
  const config = defaultConfig('http://127.0.0.1:3001');
  assert.deepEqual(validateConfig(config, [3000, 3002, 8080]), config);
  for (const change of [{ requestDelayMs: -1 }, { jitterMs: 1.5 }, { uploadKiBps: '2' }, { extra: true },
    { mode: 'other' }, { target: 'file:///etc/passwd' }, { target: 'http://user:pass@example.com' },
    { target: 'http://127.0.0.1:3000' }, { target: 'http://169.254.169.254' }, { target: 'http://[::1]:8080' },
    { target: 'http://100.100.100.200' }, { target: 'http://[::ffff:6464:64c8]' },
    { target: 'http://example.com/path' }, { target: 'http://example.com/?token=secret' },
    { backendRoutes: [''] }, { failureMode: 'invalid' }, { headerRules: { stripCORS: 'yes' } },
    { statusRules: [{ path: '/', status: 200, probability: 100 }] },
    { statusRules: [{ path: '/', status: 503, probability: 101 }] },
    { mockRules: [{ path: '/', body: '{bad', active: true }] },
    { mockRules: Array.from({ length: 9 }, () => ({ path: '/', body: '{}', active: true })) }]) {
    assert.throws(() => validateConfig({ ...config, ...change }, [3000, 3002, 8080]), { code: 'invalid_input' });
  }
  for (const address of ['127.1.2.3', '::1', '::ffff:127.0.0.1', '::ffff:7f00:1']) {
    assert.throws(() => validateAddress(address, 3000, [3000]), { code: 'invalid_input' });
  }
  for (const address of ['0.0.0.0', '169.254.169.254', '224.0.0.1', '::', 'fe80::1', 'ff02::1', 'fd00:ec2::254',
    '100.100.100.200', '::ffff:100.100.100.200', '::ffff:6464:64c8']) {
    assert.throws(() => validateAddress(address, 80, []), { code: 'invalid_input' });
  }
});

test('unified and split forwarding preserve methods, query strings and bodies', async t => {
  const { live, origin, configure, target } = await fixture(t);
  const result = await (await fetch(origin + '/api/echo?token=private', { method: 'POST', body: 'hello' })).json();
  assert.deepEqual(result, { method: 'POST', url: '/api/echo?token=private', body: 'hello' });
  const frontend = await listen(createServer((req, res) => res.end('frontend')), 0);
  t.after(() => frontend.close());
  configure({ mode: 'split', frontendTarget: `http://127.0.0.1:${frontend.port}`,
    backendTarget: `http://127.0.0.1:${target.port}`, backendRoutes: ['/api', '/graphql'] });
  assert.equal(await (await fetch(origin + '/page')).text(), 'frontend');
  assert.equal((await (await fetch(origin + '/api/items')).json()).url, '/api/items');
  assert.equal(live.activity().entries[0].path, '/api/items');
  assert.ok(!JSON.stringify(live.activity()).includes('private'));
});

test('status probability extremes, mock precedence and header tampering affect real responses', async t => {
  const { origin, configure, received } = await fixture(t);
  configure({ statusRules: [{ path: '/api', status: 503, probability: 0 }] });
  assert.equal((await fetch(origin + '/api')).status, 200);
  configure({ statusRules: [{ path: '/api', status: 503, probability: 100 }],
    mockRules: [{ path: '/api', body: '{"fake":true}', active: true }] });
  const injected = await fetch(origin + '/api'); assert.equal(injected.status, 503); await injected.text();
  configure({ statusRules: [], headerRules: { stripCORS: true, stripCache: true, corruptContentType: true } });
  const mock = await fetch(origin + '/api'); assert.deepEqual(await mock.json(), { fake: true });
  assert.equal(mock.headers.get('content-type'), 'application/x-faultnet-mismatch');
  assert.equal(received.length, 1);
  configure({ mockRules: [] });
  const headers = await fetch(origin + '/api'); await headers.text();
  assert.equal(headers.headers.get('access-control-allow-origin'), null);
  assert.equal(headers.headers.get('cache-control'), null); assert.equal(headers.headers.get('etag'), null);
});

test('request and response delay, jitter, upload and download limits use measured time', async t => {
  const { origin, configure, live } = await fixture(t);
  configure({ requestDelayMs: 80, responseDelayMs: 80, jitterMs: 10 });
  let start = performance.now(); await (await fetch(origin + '/echo')).text();
  assert.ok(performance.now() - start >= 140);
  configure({ requestDelayMs: 0, responseDelayMs: 0, jitterMs: 0, downloadKiBps: 32 });
  start = performance.now(); assert.equal((await (await fetch(origin + '/payload')).arrayBuffer()).byteLength, 32768);
  let elapsed = performance.now() - start; assert.ok(elapsed >= 900 && elapsed < 2000, elapsed);
  configure({ downloadKiBps: 0, uploadKiBps: 32 });
  start = performance.now(); await (await fetch(origin + '/upload', { method: 'POST', body: 'F'.repeat(32768) })).text();
  elapsed = performance.now() - start; assert.ok(elapsed >= 900 && elapsed < 2000, elapsed);
  assert.ok(live.activity().entries[0].faults.includes('upload limit'));
});

test('timeout and stalled body cancel; reset restores forwarding without leaking active work', async t => {
  const { origin, configure, live } = await fixture(t);
  configure({ failureMode: 'timeout' });
  await assert.rejects(fetch(origin + '/payload', { signal: AbortSignal.timeout(100) }));
  configure({ failureMode: 'hang_body' });
  const pending = fetch(origin + '/payload').then(response => response.text());
  const settled = pending.then(() => false, () => true);
  await wait(60); await live.reset();
  assert.equal(await settled, true);
  const healthy = await fetch(origin + '/payload'); assert.equal((await healthy.arrayBuffer()).byteLength, 32768);
  assert.equal(live.activity().activeCount, 0);
  assert.equal(live.getConfig().failureMode, 'normal');
});

test('disconnect sends an incomplete body and HEAD/no-body/gzip preserve HTTP framing', async t => {
  const { origin, configure } = await fixture(t);
  configure({ failureMode: 'close_body' });
  await assert.rejects(fetch(origin + '/payload').then(response => response.arrayBuffer()));
  configure({ failureMode: 'normal' });
  assert.equal((await fetch(origin + '/payload', { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(origin + '/empty')).status, 204);
  assert.equal(await (await fetch(origin + '/compressed')).text(), 'compressed');
});

test('live listener rejects hostile Host, Origin, CONNECT and absolute URLs', async t => {
  const { origin, live } = await fixture(t);
  assert.equal((await fetch(origin + '/payload', { headers: { Origin: 'https://evil.example' } })).status, 403);
  for (const options of [{ headers: { Host: 'evil.example' } }, { path: 'http://example.com/payload' }, { method: 'CONNECT', path: 'example.com:443' }]) {
    const status = await new Promise((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port: live.port, path: '/payload', ...options }, res => { res.resume(); resolve(res.statusCode); });
      req.on('connect', res => { req.destroy(); resolve(res.statusCode); }); req.on('error', reject); req.end();
    });
    assert.ok([400, 403, 405].includes(status), status);
  }
});

test('user-initiated same-site application navigation works while foreign fetch and image requests remain denied', async t => {
  const { origin } = await fixture(t);
  const navigationStatus = headers => new Promise((resolve, reject) => {
    const req = request(origin + '/payload', { headers }, res => {
      res.resume(); res.once('end', () => resolve(res.statusCode));
    }); req.once('error', reject); req.end();
  });
  const navigation = { 'Sec-Fetch-Site': 'same-site', 'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document', 'Sec-Fetch-User': '?1' };
  assert.equal(await navigationStatus(navigation), 200);
  for (const headers of [
    { ...navigation, Origin: 'https://evil.example' },
    { ...navigation, 'Sec-Fetch-Site': 'cross-site' },
    { ...navigation, 'Sec-Fetch-Mode': 'no-cors', 'Sec-Fetch-Dest': 'image' },
    { ...navigation, 'Sec-Fetch-Mode': 'cors' },
    { ...navigation, 'Sec-Fetch-User': '?0' }
  ]) assert.equal(await navigationStatus(headers), 403);
});

test('monitor is a bounded private memory window; clearing it leaves configuration intact', async t => {
  const { live, origin } = await fixture(t);
  for (let i = 0; i < 53; i++) await (await fetch(origin + '/echo?secret=value', {
    headers: { Authorization: 'secret-bearer', Cookie: 'private-cookie' } })).text();
  const activity = live.activity(); assert.equal(activity.entries.length, 50);
  assert.ok(!/secret|value|bearer|cookie|body/.test(JSON.stringify(activity)));
  const config = live.getConfig(); live.clearActivity();
  assert.equal(live.activity().entries.length, 0); assert.deepEqual(live.getConfig(), config);
});

test('configured DNS alias into protected listeners is refused before forwarding', async t => {
  const { live, origin, target } = await fixture(t);
  const protectedLive = await startLiveProxy({ port: 0, target: `http://127.0.0.1:${live.port}`, blockedPorts: [target.port] });
  t.after(() => protectedLive.close());
  protectedLive.setConfig({ ...protectedLive.getConfig(), target: `http://localhost:${target.port}` });
  const result = await fetch(`http://127.0.0.1:${protectedLive.port}/echo`);
  assert.equal(result.status, 502); assert.equal(await result.text(), 'Upstream unavailable');
  assert.equal((await fetch(origin + '/echo')).status, 200);
});

test('early upstream response settles even while a client upload has not ended', async t => {
  const early = await listen(createServer((req, res) => res.writeHead(413).end('too large')), 0);
  const live = await startLiveProxy({ port: 0, target: `http://localhost:${early.port}`, blockedPorts: [] });
  let client;
  t.after(async () => { client?.destroy(); await live.close(); await early.close(); });
  const result = new Promise((resolve, reject) => {
    client = request({ hostname: '127.0.0.1', port: live.port, method: 'POST', path: '/', signal: AbortSignal.timeout(1500),
      headers: { 'Content-Length': 65536 } }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body })); res.on('error', reject);
    });
    client.on('error', reject); client.write(Buffer.alloc(1024));
  });
  assert.deepEqual(await result, { status: 413, body: 'too large' });
  await wait(40);
  const active = live.activity().activeCount;
  client.destroy();
  assert.equal(active, 0);
});

test('invalid initial live configuration does not leave its port occupied', async t => {
  const temporary = await listen(createServer(), 0); const port = temporary.port; await temporary.close();
  await assert.rejects(startLiveProxy({ port, target: 'file:///invalid' }), { code: 'invalid_input' });
  const reused = await listen(createServer(), port); t.after(() => reused.close());
});
