import { randomBytes, timingSafeEqual } from 'node:crypto';
import { problem } from '../errors.js';

export function createSecurity(origin) {
  const token = randomBytes(32).toString('hex');
  const host = new URL(origin).host;
  let windowStarted = Date.now();
  let count = 0;
  return { token, check(req, path) {
    if (req.headers.host !== host || (req.headers.origin && req.headers.origin !== origin)
      || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site']))) {
      throw problem('prohibited_request', 403, 'This request is outside the local dashboard boundary.');
    }
    if (!path.startsWith('/api/')) return;
    if (Date.now() - windowStarted >= 1000) { windowStarted = Date.now(); count = 0; }
    if (++count > 20) throw problem('rate_limited', 429, 'Too many control requests. Wait one second and retry.');
    if (path !== '/api/session') {
      const supplied = req.headers['x-faultnet-token'];
      if (typeof supplied !== 'string' || !/^[0-9a-f]{64}$/.test(supplied)
        || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) {
        throw problem('prohibited_request', 403, 'Reload the dashboard to obtain a valid session capability.');
      }
    }
    if (req.method !== 'GET' && req.headers.origin !== origin) throw problem('prohibited_request', 403, 'Mutation requires the dashboard origin.');
  } };
}

export function readBody(req, emptyAllowed = false) {
  if (req.headers['content-length'] !== '0' && req.headers['content-length'] !== undefined
    && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
    throw problem('invalid_input', 400, 'The request body must use application/json.');
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    let done = false;
    const chunks = [];
    const finish = (error, value) => { if (!done) { done = true; clearTimeout(timer); error ? reject(error) : resolve(value); } };
    const timer = setTimeout(() => finish(problem('invalid_input', 400, 'Request body timed out.')), 5000);
    req.on('data', chunk => {
      if (done) return;
      size += chunk.length;
      if (size > 8192) finish(problem('request_too_large', 413, 'JSON request bodies are limited to 8192 bytes.'));
      else chunks.push(chunk);
    });
    req.once('end', () => {
      if (done) return;
      if (size && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
        finish(problem('invalid_input', 400, 'The request body must use application/json.')); return;
      }
      try { finish(null, size ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : (emptyAllowed ? {} : null)); }
      catch { finish(problem('invalid_input', 400, 'Malformed JSON body.')); }
    });
    req.once('aborted', () => finish(problem('invalid_input', 400, 'Request was interrupted.')));
    req.once('error', () => finish(problem('invalid_input', 400, 'Request was interrupted.')));
  });
}
