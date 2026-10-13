import test from 'node:test';
import assert from 'node:assert/strict';
import { connect } from 'node:net';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startDemo } from '../src/demo/server.js';
import { startApp } from '../src/app.js';

test('incomplete headers are closed near the five-second deadline', async t => {
  const demo = await startDemo({ port: 0 });
  t.after(() => demo.close());
  const start = performance.now();
  const elapsed = await new Promise((resolve, reject) => {
    const socket = connect(demo.port, '127.0.0.1', () => socket.write('GET /payload HTTP/1.1\r\nHost: 127.0.0.1\r\n'));
    const deadline = setTimeout(() => { socket.destroy(); reject(new Error('Header deadline was not enforced within 6.5 seconds')); }, 6500);
    socket.on('data', () => {});
    socket.once('error', reject);
    socket.once('close', () => { clearTimeout(deadline); resolve(performance.now() - start); });
  });
  assert.ok(elapsed >= 4500 && elapsed < 6500);
});

test('startup port conflicts release already opened listeners', async t => {
  const occupied = await startDemo({ port: 0 });
  t.after(() => occupied.close());
  const temporary = await startDemo({ port: 0 }); const demoPort = temporary.port; await temporary.close();
  await assert.rejects(startApp({ demoPort, proxyPort: occupied.port, controlPort: 0, livePort: 0 }), { code: 'EADDRINUSE' });
  const reused = await startDemo({ port: demoPort }); await reused.close();
});

test('failed shutdown persistence still closes every application listener', async t => {
  const root = await mkdtemp(join(tmpdir(), 'faultnet-close-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = await startApp({ controlPort: 0, proxyPort: 0, demoPort: 0, livePort: 0, resultsRoot: root });
  const origin = `http://127.0.0.1:${app.port}`;
  const token = (await (await fetch(origin + '/api/session')).json()).token;
  await fetch(origin + '/api/experiments', { method: 'POST', headers: { Origin: origin, 'X-FaultNet-Token': token,
    'Content-Type': 'application/json' }, body: '{"mode":"baseline","probeCount":3,"intervalMs":500}' });
  await rm(root, { recursive: true, force: true }); await writeFile(root, 'occupied');
  await assert.rejects(app.close(), { code: 'storage_unavailable' });
  const reused = await startDemo({ port: app.port }); await reused.close();
  const liveReused = await startDemo({ port: app.livePort }); await liveReused.close();
});

test('fourth-listener collision releases the demo and experiment proxy ports', async t => {
  const occupied = await startDemo({ port: 0 }); t.after(() => occupied.close());
  const first = await startDemo({ port: 0 }), second = await startDemo({ port: 0 });
  const demoPort = first.port, proxyPort = second.port; await first.close(); await second.close();
  await assert.rejects(startApp({ demoPort, proxyPort, controlPort: 0, livePort: occupied.port }), { code: 'EADDRINUSE' });
  const demo = await startDemo({ port: demoPort }), proxy = await startDemo({ port: proxyPort });
  await demo.close(); await proxy.close();
});
