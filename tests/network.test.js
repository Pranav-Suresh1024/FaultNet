import test from 'node:test';
import assert from 'node:assert/strict';
import { startDemo } from '../src/demo/server.js';
import { startProxy } from '../src/proxy/server.js';
import { probe } from '../src/experiments/probe.js';
import { summarize } from '../src/experiments/metrics.js';
import { createServer } from 'node:http';
import { channel } from 'node:diagnostics_channel';
import { listen, serverOptions } from '../src/http.js';

test('fixed demo and proxy preserve payload, apply delay, interrupt, and restore', async t => {
  const demo = await startDemo({ port: 0 });
  t.after(() => demo.close());
  const proxy = await startProxy({ port: 0, demoPort: demo.port });
  t.after(() => proxy.close());
  const read = () => probe({ port: proxy.port, timeoutMs: 3000 });
  assert.equal((await fetch(`http://127.0.0.1:${demo.port}/unknown`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${proxy.port}/http://example.com`)).status, 404);
  const baseline = await read();
  assert.equal(baseline.successful, true);
  assert.equal(baseline.bytesReceived, 65536);
  proxy.setFault({ type: 'delay', delayMs: 500 });
  const delayed = await read();
  assert.equal(delayed.successful, true);
  assert.ok(delayed.elapsedMs - baseline.elapsedMs >= 400);
  proxy.setFault({ type: 'interruption' });
  assert.equal((await read()).outcome, 'interrupted');
  await proxy.clearFault();
  assert.equal((await read()).successful, true);
});

test('throttling honors 32 KiB/s and cancellation releases delayed requests', async t => {
  const demo = await startDemo({ port: 0 });
  t.after(() => demo.close());
  const proxy = await startProxy({ port: 0, demoPort: demo.port });
  t.after(() => proxy.close());
  proxy.setFault({ type: 'bandwidth', rateKiBps: 32 });
  const result = await probe({ port: proxy.port, timeoutMs: 5000 });
  const goodput = result.bytesReceived / result.elapsedMs * 1000 / 1024;
  assert.equal(result.successful, true);
  assert.ok(goodput >= 24 && goodput <= 36, `goodput ${goodput}`);
  proxy.setFault({ type: 'delay', delayMs: 2000 });
  const controller = new AbortController();
  const pending = probe({ port: proxy.port, timeoutMs: 3000, signal: controller.signal });
  setTimeout(() => controller.abort(), 50);
  assert.equal((await pending).outcome, 'cancelled');
  await proxy.clearFault();
  assert.equal((await probe({ port: proxy.port, timeoutMs: 1000 })).successful, true);
});

test('cancelling an actual throttled body records partial bytes and restores the next request', async t => {
  const demo = await startDemo({ port: 0 }); t.after(() => demo.close());
  const proxy = await startProxy({ port: 0, demoPort: demo.port }); t.after(() => proxy.close());
  proxy.setFault({ type: 'bandwidth', rateKiBps: 8 });
  const controller = new AbortController();
  const requests = channel('http.client.request.start');
  let delivered = 0;
  const observe = ({ request }) => {
    if (request.getHeader('host') !== '127.0.0.1:' + proxy.port) return;
    request.once('response', response => response.once('data', chunk => {
      delivered += chunk.length; controller.abort();
    }));
  };
  requests.subscribe(observe); t.after(() => requests.unsubscribe(observe));
  const result = await probe({ port: proxy.port, timeoutMs: 5000, signal: controller.signal });
  requests.unsubscribe(observe);
  assert.ok(delivered > 0, 'abort follows actual body delivery, not a sleep');
  assert.equal(result.outcome, 'cancelled');
  assert.equal(result.successful, false);
  assert.ok(result.bytesReceived > 0 && result.bytesReceived < 65536);
  await proxy.clearFault();
  assert.deepEqual(proxy.getFault(), { type: 'none' });
  const next = await probe({ port: proxy.port, timeoutMs: 1000 });
  assert.equal(next.successful, true); assert.equal(next.bytesReceived, 65536);
});

test('probe distinguishes unavailable demo, timeout, and complete wrong response', async t => {
  const demo = await startDemo({ port: 0 });
  const port = demo.port;
  await demo.close();
  assert.equal((await probe({ port, timeoutMs: 1000 })).outcome, 'connection_error');
  const running = await startDemo({ port: 0 });
  t.after(() => running.close());
  const proxy = await startProxy({ port: 0, demoPort: running.port });
  t.after(() => proxy.close());
  proxy.setFault({ type: 'delay', delayMs: 2000 });
  assert.equal((await probe({ port: proxy.port, timeoutMs: 500 })).outcome, 'timeout');
  const wrong = await listen(createServer(serverOptions, (req, res) => res.end(Buffer.alloc(65536, 71))), 0);
  t.after(() => wrong.close());
  const wrongResponse = await probe({ port: wrong.port, timeoutMs: 1000 });
  assert.equal(wrongResponse.outcome, 'response_complete');
  assert.equal(wrongResponse.successful, false);
});

test('calibration uses five delay samples and three bandwidth samples at approved tolerances', async t => {
  const demo = await startDemo({ port: 0 }); t.after(() => demo.close());
  const proxy = await startProxy({ port: 0, demoPort: demo.port }); t.after(() => proxy.close());
  const baseline = [], delayed = [];
  for (let i = 0; i < 5; i++) baseline.push(await probe({ port: proxy.port, timeoutMs: 3000 }));
  proxy.setFault({ type: 'delay', delayMs: 500 });
  for (let i = 0; i < 5; i++) delayed.push(await probe({ port: proxy.port, timeoutMs: 3000 }));
  assert.ok([...baseline, ...delayed].every(item => item.successful));
  const difference = summarize(delayed).medianElapsedMs - summarize(baseline).medianElapsedMs;
  assert.ok(difference >= 400 && difference <= 800, `median difference ${difference} ms`);
  const rates = [];
  proxy.setFault({ type: 'bandwidth', rateKiBps: 32 });
  for (let i = 0; i < 3; i++) {
    const result = await probe({ port: proxy.port, timeoutMs: 5000 });
    assert.equal(result.successful, true); assert.equal(result.bytesReceived, 65536);
    const rate = 64 / (result.elapsedMs / 1000); rates.push(rate);
    assert.ok(rate >= 24 && rate <= 36, `goodput ${rate} KiB/s`);
  }
  t.diagnostic(`delay median difference ${difference.toFixed(1)} ms; goodputs ${rates.map(rate => rate.toFixed(2)).join(', ')} KiB/s`);
});
