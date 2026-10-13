import { problem } from '../errors.js';
import { experimentBudgetMs, experimentLimitMs } from '../../public/protocol.js';
export { experimentLimitMs } from '../../public/protocol.js';

const invalid = () => { throw problem('invalid_input', 400, 'Settings must match the documented fields, types, ranges, and experiment budget.'); };
export const demoContract = 'faultnet-demo-v1';
export const payloadBytes = 65536;

export function objectKeys(value, allowed) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every(key => allowed.includes(key));
}

export function normalizeSettings(input) {
  if (!objectKeys(input, ['mode', 'probeCount', 'intervalMs', 'timeoutMs', 'fault'])) invalid();
  const settings = { mode: 'comparison', probeCount: 10, intervalMs: 250, timeoutMs: 3000, ...input };
  if (!['baseline', 'comparison'].includes(settings.mode)) invalid();
  for (const [key, low, high] of [['probeCount', 1, 20], ['intervalMs', 100, 2000], ['timeoutMs', 500, 5000]]) {
    if (!Number.isInteger(settings[key]) || settings[key] < low || settings[key] > high) invalid();
  }
  const fault = Object.hasOwn(input, 'fault') ? input.fault : (settings.mode === 'baseline' ? { type: 'none' } : { type: 'delay', delayMs: 500 });
  const fields = { none: ['type'], delay: ['type', 'delayMs'], bandwidth: ['type', 'rateKiBps'], interruption: ['type'] };
  if (!fault || !Object.hasOwn(fields, fault.type) || !objectKeys(fault, fields[fault.type])) invalid();
  settings.fault = { type: fault.type };
  if (fault.type === 'delay') {
    const delayMs = Object.hasOwn(fault, 'delayMs') ? fault.delayMs : 500;
    if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 2000) invalid();
    settings.fault.delayMs = delayMs;
  }
  if (fault.type === 'bandwidth') {
    const rateKiBps = Object.hasOwn(fault, 'rateKiBps') ? fault.rateKiBps : 32;
    if (!Number.isInteger(rateKiBps) || rateKiBps < 8 || rateKiBps > 1024) invalid();
    settings.fault.rateKiBps = rateKiBps;
  }
  if ((settings.mode === 'baseline') !== (fault.type === 'none')) invalid();
  if (experimentBudgetMs(settings) > experimentLimitMs) invalid();
  return { ...settings, recoverySuccessCount: 3, recoveryWindowMs: 15000, demoContract };
}
