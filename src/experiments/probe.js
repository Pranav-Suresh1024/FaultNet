import { get } from 'node:http';
import { performance } from 'node:perf_hooks';
import { payloadBytes } from '../control/validation.js';

export function probe({ port = 3002, timeoutMs, signal }) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  return new Promise(resolve => {
    let bytesReceived = 0;
    let httpStatus = null;
    let matching = true;
    let finished = false;
    let request;
    let timer;
    const finish = outcome => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      request?.destroy();
      resolve({ startedAt, elapsedMs: performance.now() - started, outcome, httpStatus, bytesReceived,
        successful: outcome === 'response_complete' && httpStatus === 200 && bytesReceived === payloadBytes && matching });
    };
    const cancel = () => finish('cancelled');
    if (signal?.aborted) { cancel(); return; }
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => finish('timeout'), timeoutMs);
    request = get({ hostname: '127.0.0.1', port, path: '/payload', agent: false }, response => {
      httpStatus = response.statusCode;
      response.on('data', chunk => {
        bytesReceived += chunk.length;
        if (bytesReceived > payloadBytes) { matching = false; finish('interrupted'); return; }
        for (const byte of chunk) if (byte !== 70) matching = false;
      });
      response.once('end', () => finish('response_complete'));
      response.once('error', () => finish('interrupted'));
      response.once('aborted', () => finish('interrupted'));
    });
    request.once('error', error => finish(error.code === 'ECONNRESET' ? 'interrupted' : 'connection_error'));
  });
}
