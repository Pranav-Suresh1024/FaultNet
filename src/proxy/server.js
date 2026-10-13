import { createServer, get } from 'node:http';
import { once } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { listen, serverOptions } from '../http.js';
import { normalizeSettings, payloadBytes } from '../control/validation.js';

export async function startProxy({ port = 3002, demoPort = 3001 } = {}) {
  let fault = { type: 'none' };
  const active = new Set();
  const server = createServer(serverOptions, async (req, res) => {
    if (req.url !== '/payload') { res.writeHead(404).end(); return; }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    const applied = fault;
    if (applied.type === 'interruption') { req.socket.destroy(); return; }
    const controller = new AbortController();
    const { signal } = controller;
    let settle;
    const operation = { controller, done: new Promise(resolve => { settle = resolve; }) };
    active.add(operation);
    res.once('close', () => controller.abort());
    try {
      if (applied.type === 'delay') await wait(applied.delayMs, undefined, { signal });
      const upstream = get({ hostname: '127.0.0.1', port: demoPort, path: '/payload', signal, agent: false });
      const response = await new Promise((resolve, reject) => {
        upstream.once('response', resolve);
        upstream.once('error', reject);
      });
      const chunks = [];
      let size = 0;
      for await (const chunk of response) {
        size += chunk.length;
        if (size > payloadBytes) throw new Error('Unexpected demo payload');
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      res.writeHead(response.statusCode, { 'Content-Type': 'application/octet-stream', 'Content-Length': body.length });
      if (applied.type === 'bandwidth') {
        const started = performance.now();
        for (let offset = 0; offset < body.length; offset += 1024) {
          const chunk = body.subarray(offset, offset + 1024);
          const deadline = started + (offset + chunk.length) / (applied.rateKiBps * 1024) * 1000;
          await wait(Math.max(0, deadline - performance.now()), undefined, { signal });
          if (!res.write(chunk)) await once(res, 'drain', { signal });
        }
        res.end();
      } else res.end(body);
    } catch {
      if (signal.aborted || res.headersSent) res.destroy();
      else res.writeHead(502, { 'Content-Type': 'text/plain' }).end('Demo unavailable');
    } finally {
      controller.abort();
      active.delete(operation);
      settle();
    }
  });
  const listener = await listen(server, port);
  async function clearFault() {
    fault = { type: 'none' };
    const operations = [...active];
    for (const item of operations) item.controller.abort();
    await Promise.all(operations.map(item => item.done));
  }
  return { port: listener.port, setFault(value) {
    fault = normalizeSettings({ mode: value?.type === 'none' ? 'baseline' : 'comparison', fault: value }).fault;
  }, getFault: () => ({ ...fault }), clearFault, async close() { await clearFault(); await listener.close(); } };
}
