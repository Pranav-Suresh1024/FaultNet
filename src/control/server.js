import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createSecurity, readBody } from './security.js';
import { listen, serverOptions } from '../http.js';
import { validateId } from '../storage/records.js';
import { exportRecord } from '../storage/export.js';
import { objectKeys } from './validation.js';
import { problem, safeError } from '../errors.js';

const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/results.js': ['results.js', 'text/javascript; charset=utf-8'], '/scenarios.js': ['scenarios.js', 'text/javascript; charset=utf-8'],
  '/charts.js': ['charts.js', 'text/javascript; charset=utf-8'], '/protocol.js': ['protocol.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'] };

export async function startControl({ port = 3000, runner, store }) {
  let security;
  const server = createServer(serverOptions, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const path = url.pathname;
      security.check(req, path);
      const expectMethod = method => { if (req.method !== method) { res.setHeader('Allow', method); throw problem('method_not_allowed', 405, 'Unsupported request method.'); } };
      if (Object.hasOwn(assets, path)) {
        expectMethod('GET');
        const [filename, type] = assets[path];
        const body = await readFile(new URL('../../public/' + filename, import.meta.url));
        res.writeHead(200, { 'Content-Type': type }).end(body); return;
      }
      if (path === '/api/session') { expectMethod('GET'); json(200, { token: security.token }); return; }
      if (path === '/api/status') {
        expectMethod('GET');
        let storageReady = false;
        try { await store.checkReady(); storageReady = true; } catch {}
        json(200, { demoReady: await runner.demoReady(), storageReady, ...runner.status() }); return;
      }
      if (path === '/api/experiments') {
        if (req.method === 'GET') json(200, await runner.listExperiments());
        else { expectMethod('POST'); json(202, { experiment: await runner.startExperiment(await readBody(req)) }); }
        return;
      }
      const match = /^\/api\/experiments\/([^/]+)(?:\/(stop|export))?$/.exec(path);
      if (match) {
        const id = validateId(match[1]);
        if (match[2] === 'stop') {
          expectMethod('POST');
          const body = await readBody(req, true);
          if (!objectKeys(body, []) || Object.keys(body).length) throw problem('invalid_input', 400, 'Stop expects an empty JSON object.');
          const experiment = await runner.stopExperiment(id);
          json(experiment.state === 'stopping' ? 202 : 200, { experiment }); return;
        }
        expectMethod('GET');
        const experiment = await runner.getExperiment(id);
        if (match[2] === 'export') {
          const exported = exportRecord(experiment, url.searchParams.get('format'));
          res.writeHead(200, { 'Content-Type': exported.contentType, 'Content-Disposition': `attachment; filename="${exported.filename}"` }).end(exported.content);
        } else json(200, { experiment });
        return;
      }
      throw problem('not_found', 404, 'Route not found.');
    } catch (error) {
      if (!res.headersSent && !res.destroyed) json(error.status || 500, { error: safeError(error) });
      else res.destroy();
    }
  });
  const listener = await listen(server, port);
  security = createSecurity(`http://127.0.0.1:${listener.port}`);
  return listener;
}
