import { createServer } from 'node:http';
import { listen, serverOptions } from '../http.js';
import { payloadBytes } from '../control/validation.js';

export function startDemo({ port = 3001 } = {}) {
  const payload = Buffer.alloc(payloadBytes, 'F');
  return listen(createServer(serverOptions, (req, res) => {
    if (req.url !== '/payload') { res.writeHead(404).end(); return; }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': payload.length });
    res.end(payload);
  }), port);
}
