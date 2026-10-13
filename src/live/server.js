import { createServer, request as httpRequest, get } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import { listen, serverOptions } from '../http.js';
import { defaultConfig, validateConfig, validateAddress } from './config.js';
import { problem } from '../errors.js';

function forwardHeaders(headers) {
  const omitted = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', ...(headers.connection || '').toLowerCase().split(',').map(s => s.trim())]);
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !omitted.has(key.toLowerCase())));
}

async function transfer(source, destination, rate, signal, onChunk) {
  const start = performance.now();
  let bytes = 0;
  const cancel = () => source.destroy?.();
  signal.addEventListener('abort', cancel, { once: true });
  try { for await (const buffer of source) {
    for (let offset = 0; offset < buffer.length; offset += rate ? 1024 : 16384) {
      const chunk = buffer.subarray(offset, offset + (rate ? 1024 : 16384));
      bytes += chunk.length;
      if (rate) await wait(Math.max(0, start + bytes / (rate * 1024) * 1000 - performance.now()), undefined, { signal });
      signal.throwIfAborted();
      if (!destination.write(chunk)) await once(destination, 'drain', { signal });
      if (onChunk) await onChunk(chunk);
    }
  } } finally { signal.removeEventListener('abort', cancel); }
}

export async function startLiveProxy({ port = 8080, target = 'http://127.0.0.1:3001', blockedPorts = [] } = {}) {
  let config = validateConfig(defaultConfig(target), [...blockedPorts, ...(port ? [port] : [])]);
  let entries = [];
  const active = new Set();
  let listener;
  const server = createServer(serverOptions, async (req, res) => {
    const origin = `http://127.0.0.1:${listener.port}`;
    const navigation = req.method === 'GET' && req.headers['sec-fetch-site'] === 'same-site'
      && req.headers['sec-fetch-mode'] === 'navigate' && req.headers['sec-fetch-dest'] === 'document'
      && req.headers['sec-fetch-user'] === '?1';
    if (req.headers.host !== new URL(origin).host || (req.headers.origin && req.headers.origin !== origin)
      || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site']) && !navigation)) {
      res.writeHead(403).end('Use the local proxy origin'); return;
    }
    if (!req.url.startsWith('/') || req.url.startsWith('//') || req.url.includes('\\')) { res.writeHead(400).end(); return; }
    const applied = config;
    const path = new URL(req.url, origin).pathname;
    const controller = new AbortController(), { signal } = controller;
    let settle, uploaded;
    const operation = { controller, done: new Promise(resolve => { settle = resolve; }) };
    active.add(operation);
    const deadline = setTimeout(() => controller.abort(), 120000);
    const started = performance.now();
    const entry = { id: randomUUID(), timestamp: new Date().toISOString(), method: req.method, path: path.slice(0, 512),
      status: null, elapsedMs: 0, bytes: 0, outcome: 'completed', faults: [] };
    req.once('aborted', () => controller.abort());
    res.once('close', () => controller.abort());
    const delay = async (base, label) => {
      const duration = Math.max(0, base + (Math.random() * 2 - 1) * applied.jitterMs);
      if (base) entry.faults.push(label);
      if (applied.jitterMs && !entry.faults.includes('jitter')) entry.faults.push('jitter');
      if (duration) await wait(duration, undefined, { signal });
    };
    try {
      await delay(applied.requestDelayMs, 'request delay');
      const statusRule = applied.statusRules.find(rule => path.startsWith(rule.path) && Math.random() * 100 < rule.probability);
      const mock = !statusRule && applied.mockRules.find(rule => rule.active && path.startsWith(rule.path));
      let status, headers, body, upstream;
      if (statusRule || mock) {
        req.resume();
        status = statusRule ? statusRule.status : 200;
        const buffer = Buffer.from(statusRule ? JSON.stringify({ error: 'Injected HTTP failure', status }) : mock.body);
        body = [buffer]; headers = { 'content-type': 'application/json', 'content-length': String(buffer.length) };
        entry.faults.push(statusRule ? 'status injection' : 'JSON mock');
      } else {
        const destination = new URL(applied.mode === 'unified' ? applied.target
          : applied.backendRoutes.some(prefix => path.startsWith(prefix)) ? applied.backendTarget : applied.frontendTarget);
        const hostname = destination.hostname.replace(/^\[|\]$/g, '');
        const destinationPort = Number(destination.port || (destination.protocol === 'https:' ? 443 : 80));
        const resolved = isIP(hostname) ? Promise.resolve([{ address: hostname, family: isIP(hostname) }]) : lookup(hostname, { all: true });
        const addresses = await new Promise((resolve, reject) => {
          const cancel = () => reject(signal.reason);
          signal.addEventListener('abort', cancel, { once: true });
          resolved.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
        });
        signal.throwIfAborted();
        if (!addresses.length) throw new Error('No upstream address');
        for (const answer of addresses) validateAddress(answer.address, destinationPort, [...blockedPorts, listener.port]);
        const address = addresses.find(answer => answer.family === 4) || addresses[0];
        const request = (destination.protocol === 'https:' ? httpsRequest : httpRequest)({
          hostname, port: destinationPort, family: address.family, method: req.method, path: req.url, signal, agent: false,
          headers: { ...forwardHeaders(req.headers), host: destination.host },
          lookup: (_host, _options, callback) => callback(null, address.address, address.family)
        });
        const response = new Promise((resolve, reject) => { request.once('response', resolve); request.once('error', reject); });
        uploaded = transfer(req, request, applied.uploadKiBps, signal).then(() => request.end());
        uploaded.catch(() => controller.abort());
        if (applied.uploadKiBps && (req.headers['content-length'] !== undefined || req.headers['transfer-encoding'])) entry.faults.push('upload limit');
        upstream = await response;
        status = upstream.statusCode; headers = forwardHeaders(upstream.headers); body = upstream;
      }
      if (applied.failureMode === 'timeout') { entry.faults.push('timeout'); await wait(60000, undefined, { signal }); }
      await delay(applied.responseDelayMs, 'response delay');
      if (applied.headerRules.stripCORS) {
        for (const key of Object.keys(headers)) if (key.startsWith('access-control-')) delete headers[key];
        entry.faults.push('CORS stripped');
      }
      if (applied.headerRules.stripCache) {
        for (const key of ['cache-control', 'expires', 'etag', 'last-modified', 'age']) delete headers[key];
        entry.faults.push('cache stripped');
      }
      if (applied.headerRules.corruptContentType) { headers['content-type'] = 'application/x-faultnet-mismatch'; entry.faults.push('content type changed'); }
      entry.status = status;
      const noBody = req.method === 'HEAD' || [204, 304].includes(status);
      if (noBody) { upstream?.resume(); res.writeHead(status, headers).end(); }
      else {
        if (applied.failureMode === 'close_body') delete headers['content-length'];
        res.writeHead(status, headers); res.flushHeaders();
        if (applied.failureMode === 'hang_body') {
          entry.faults.push('stalled body'); await wait(120000, undefined, { signal });
        } else {
          if (applied.downloadKiBps) entry.faults.push('download limit');
          if (applied.failureMode === 'close_body') entry.faults.push('disconnect');
          await transfer(body, res, applied.downloadKiBps, signal, async chunk => {
            entry.bytes += chunk.length;
            if (applied.failureMode === 'close_body') {
              await wait(25, undefined, { signal });
              throw new Error('Injected disconnect');
            }
          });
          res.end();
        }
      }
      if (!res.writableFinished) await once(res, 'finish', { signal });
    } catch {
      entry.outcome = signal.aborted ? 'cancelled' : 'error';
      if (res.headersSent || signal.aborted) res.destroy();
      else { entry.status = 502; res.writeHead(502, { 'Content-Type': 'text/plain' }).end('Upstream unavailable'); }
    } finally {
      clearTimeout(deadline);
      controller.abort();
      await uploaded?.catch(() => {});
      entry.elapsedMs = Math.round((performance.now() - started) * 10) / 10;
      entries.unshift(entry); entries.length = Math.min(entries.length, 50);
      active.delete(operation); settle();
    }
  });
  server.on('connect', (_req, socket) => socket.end('HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  server.on('upgrade', (_req, socket) => socket.end('HTTP/1.1 501 Not Implemented\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  listener = await listen(server, port);
  server.requestTimeout = 120000;
  try { config = validateConfig(config, [...blockedPorts, listener.port]); }
  catch (error) { await listener.close(); throw error; }
  async function cancelActive() {
    const pending = [...active];
    pending.forEach(item => item.controller.abort());
    await Promise.all(pending.map(item => item.done));
  }
  return { port: listener.port, getConfig: () => structuredClone(config),
    setConfig(value) { config = validateConfig(value, [...blockedPorts, listener.port]); return structuredClone(config); },
    activity: () => ({ entries: structuredClone(entries), activeCount: active.size }),
    clearActivity() { entries = []; },
    async reset() {
      config = { ...defaultConfig(config.target), mode: config.mode, frontendTarget: config.frontendTarget,
        backendTarget: config.backendTarget, backendRoutes: config.backendRoutes };
      await cancelActive(); return structuredClone(config);
    },
    async probe(path, signal) {
      if (typeof path !== 'string' || path.length > 512 || !/^\/(?!\/)[^\s\\]*$/.test(path)) throw problem('invalid_input', 400, 'Sample path must begin with / and have at most 512 characters.');
      const start = performance.now();
      let status = null, bytes = 0, outcome = 'completed';
      const combined = AbortSignal.any([AbortSignal.timeout(5000), ...(signal ? [signal] : [])]);
      try {
        const request = get(`http://127.0.0.1:${listener.port}${path}`, { signal: combined, agent: false });
        const response = await new Promise((resolve, reject) => { request.once('response', resolve); request.once('error', reject); });
        status = response.statusCode;
        for await (const chunk of response) bytes += chunk.length;
      } catch { outcome = combined.aborted ? 'timed out or cancelled' : 'error'; }
      return { status, bytes, elapsedMs: Math.round((performance.now() - start) * 10) / 10, outcome };
    },
    async close() { await cancelActive(); await listener.close(); }
  };
}
