import { startApp } from './app.js';

try {
  const app = await startApp();
  console.log(`FaultNet ready at http://127.0.0.1:${app.port}`);
  console.log(`Live application proxy at http://127.0.0.1:${app.livePort}`);
  let stopping = false;
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    try { await app.close(); }
    catch { console.error('Shutdown or evidence save failed. Review local results.'); process.exitCode = 1; }
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(error.code === 'EADDRINUSE' ? 'A FaultNet port (3000, 3001, 3002, or 8080) is occupied. Stop that listener or retry later.'
    : error.status ? error.message : 'FaultNet could not start. Check the Node runtime and local port/storage access.');
  process.exitCode = 1;
}
