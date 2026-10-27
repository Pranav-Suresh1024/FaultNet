import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import assert from 'node:assert/strict';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { probe } from '../src/experiments/probe.js';
import { normalizeSettings } from '../src/control/validation.js';
import { validateRecord } from '../src/storage/records.js';

// Synthetic loopback evaluation only. Raw observations stay outside version control.
const root = resolve(process.argv[2] || '.codex/final-report');
const rounds = Number(process.argv[3] || 10);
assert(Number.isInteger(rounds) && rounds >= 1 && rounds <= 10);
const origin = 'http://127.0.0.1:3000';
execFileSync('git', ['diff', '--quiet', '313822e', '--', 'src', 'public', 'package.json', 'package-lock.json']);
await mkdir(root, { recursive: true });
const token = (await (await fetch(origin + '/api/session')).json()).token;
async function api(path, body) {
  const response = await fetch(origin + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'X-FaultNet-Token': token, ...(body === undefined ? {} : { Origin: origin, 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${value.error?.message}`);
  return value;
}
assert.equal((await api('/api/status')).activeExperimentId, null, 'Do not interfere with an active run');
const settings = fault => ({ mode: 'comparison', probeCount: 5, intervalMs: 250, timeoutMs: 5000, fault });
const scenarios = [
  ['delay-0', settings({ type: 'delay', delayMs: 0 })],
  ['delay-150', settings({ type: 'delay', delayMs: 150 })],
  ['delay-500', settings({ type: 'delay', delayMs: 500 })],
  ['delay-1500', settings({ type: 'delay', delayMs: 1500 })],
  ['bandwidth-16', settings({ type: 'bandwidth', rateKiBps: 16 })],
  ['bandwidth-32', settings({ type: 'bandwidth', rateKiBps: 32 })],
  ['bandwidth-128', settings({ type: 'bandwidth', rateKiBps: 128 })],
  ['interruption', settings({ type: 'interruption' })],
  ['timeout-500', { ...settings({ type: 'delay', delayMs: 1000 }), timeoutMs: 500 }],
  ['timeout-2000', { ...settings({ type: 'delay', delayMs: 1000 }), timeoutMs: 2000 }],
];
for (const [, s] of scenarios) normalizeSettings(s);
const evidence = existsSync(resolve(root, 'evaluation.json')) ? JSON.parse(await readFile(resolve(root, 'evaluation.json'), 'utf8')) : { sourceCommit: '313822e', runtime: process.version,
  environment: { os: os.type(), release: os.release(), cpu: os.cpus()[0].model, memoryGiB: os.totalmem() / 2 ** 30 },
  protocol: { rounds, probesPerPhase: 5, intervalMs: 250, rotation: 'cyclic scenario order across rounds', payloadBytes: 65536 },
  overhead: [], runs: [], live: [], rejectedRuns: [] };
assert(evidence.sourceCommit === '313822e' && evidence.protocol.rounds === rounds && evidence.runtime === process.version);
for (const trial of evidence.runs) validateRecord(trial.record);
evidence.rejectedRuns ||= [];
const checkpoint = () => writeFile(resolve(root, 'evaluation.json'), JSON.stringify(evidence, null, 2));
if (!evidence.overhead.length) for (let i = 0; i < 3; i++) { await probe({ port: 3001, timeoutMs: 5000 }); await probe({ port: 3002, timeoutMs: 5000 }); }
for (let block = evidence.overhead.length; block < rounds; block++) {
  const direct = [], proxied = [];
  for (let i = 0; i < 5; i++) {
    for (const [port, output] of (block % 2 ? [[3002, proxied], [3001, direct]] : [[3001, direct], [3002, proxied]])) {
      const result = await probe({ port, timeoutMs: 5000 }); assert(result.successful); output.push(result); await wait(30);
    }
  }
  evidence.overhead.push({ block, direct, proxied });
}
await checkpoint();
for (let block = 0; block < rounds; block++) {
  for (let j = 0; j < scenarios.length; j++) {
    const [scenario, config] = scenarios[(block + j) % scenarios.length];
    if (evidence.runs.some(r => r.block === block && r.scenario === scenario)) continue;
    let { experiment } = await api('/api/experiments', config);
    while (['running', 'stopping'].includes(experiment.state)) {
      await wait(500); ({ experiment } = await api('/api/experiments/' + experiment.id));
    }
    try { validateRecord(experiment); }
    catch (error) {
      evidence.rejectedRuns.push({ block, scenario, record: experiment, reason: error.code });
      await checkpoint();
      throw error;
    }
    evidence.runs.push({ block, scenario, record: experiment }); await checkpoint();
    console.log(`RUN ${evidence.runs.length}/${rounds * scenarios.length}: ${scenario} ${experiment.id} ${experiment.state} median=${experiment.summary.faulty.medianElapsedMs} success=${experiment.summary.faulty.successCount}/5`);
  }
}
const original = (await api('/api/live/config')).config;
assert.equal(original.target, 'http://127.0.0.1:3001', 'Live benchmark must use the synthetic demo');
try {
  const base = (await api('/api/live/reset', {})).config;
  const cases = [
    ['normal', {}], ['delay-500', { responseDelayMs: 500 }],
    ['jitter-100', { responseDelayMs: 500, jitterMs: 100 }],
    ['download-32', { downloadKiBps: 32 }],
    ['http-503', { statusRules: [{ path: '/payload', status: 503, probability: 100 }] }],
    ['disconnect', { failureMode: 'close_body' }], ['stalled-body', { failureMode: 'hang_body' }],
    ['mock', { mockRules: [{ path: '/payload', active: true, body: '{"service":"faultnet","ok":true}' }] }],
  ];
  for (const [scenario, changes] of cases) {
    if (evidence.live.some(r => r.scenario === scenario)) continue;
    await api('/api/live/reset', {}); await api('/api/live/config', { ...base, ...changes });
    const observations = [];
    for (let i = 0; i < 10; i++) { observations.push(await api('/api/live/probe', { path: '/payload' })); await wait(120); }
    evidence.live.push({ scenario, config: changes, observations }); await checkpoint();
    console.log(`LIVE ${scenario}: ${observations.length} requests`);
  }
  await api('/api/live/reset', {});
  const restored = await api('/api/live/probe', { path: '/payload' });
  assert(restored.status === 200 && restored.bytes === 65536);
  evidence.restored = restored;
} finally { await api('/api/live/reset', {}); await api('/api/live/config', original); }
await checkpoint();
console.log('EVALUATION COMPLETE; all raw observations saved locally.');
