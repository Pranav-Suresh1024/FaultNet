import { resolve } from 'node:path';
import { startDemo } from './demo/server.js';
import { startProxy } from './proxy/server.js';
import { createStore } from './storage/records.js';
import { createRunner } from './experiments/runner.js';
import { startControl } from './control/server.js';
import { startLiveProxy } from './live/server.js';

export async function startApp({ controlPort = 3000, demoPort = 3001, proxyPort = 3002, livePort = 8080, resultsRoot = resolve('results') } = {}) {
  let demo, proxy, live, runner, control;
  let closing;
  async function close() {
    closing ??= (async () => {
      let failure;
      try { await runner?.close(); } catch (error) { failure = error; }
      const cleanup = await Promise.allSettled([control?.close(), live?.close(), proxy?.close(), demo?.close()]);
      failure ??= cleanup.find(result => result.status === 'rejected')?.reason;
      if (failure) throw failure;
    })();
    return closing;
  }
  try {
    demo = await startDemo({ port: demoPort });
    proxy = await startProxy({ port: proxyPort, demoPort: demo.port });
    const blockedPorts = [proxy.port, ...(controlPort ? [controlPort] : [])];
    live = await startLiveProxy({ port: livePort, target: `http://127.0.0.1:${demo.port}`, blockedPorts });
    const store = await createStore(resultsRoot);
    runner = createRunner({ demoPort: demo.port, proxy, store });
    control = await startControl({ port: controlPort, runner, store, live });
    blockedPorts.push(control.port);
    return { port: control.port, livePort: live.port, close };
  } catch (error) { await close().catch(() => {}); throw error; }
}
