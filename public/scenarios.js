const settings = (mode, fault, timeoutMs = 3000) => ({ mode, probeCount: 5, intervalMs: 250, timeoutMs, fault });
export const scenarioProfiles = [
  { id: 'healthy', name: 'Healthy connection', description: 'Baseline only; no fault is injected.', settings: settings('baseline', { type: 'none' }) },
  { id: 'mild', name: 'Mild delay', description: 'Add 150 ms before each faulty response.', settings: settings('comparison', { type: 'delay', delayMs: 150 }) },
  { id: 'severe', name: 'Severe delay', description: 'Add 1500 ms before each faulty response.', settings: settings('comparison', { type: 'delay', delayMs: 1500 }) },
  { id: 'bandwidth', name: 'Constrained bandwidth', description: 'Deliver 64 KiB at 16 KiB/s; roughly four seconds per faulty response.', settings: settings('comparison', { type: 'bandwidth', rateKiBps: 16 }, 5000) },
  { id: 'timeout', name: 'Timeout stress', description: 'A 2000 ms delay exceeds the 500 ms timeout; faulty failures are expected.', settings: settings('comparison', { type: 'delay', delayMs: 2000 }, 500) },
  { id: 'outage', name: 'Complete HTTP outage', description: 'Interrupt every faulty HTTP request, then clear the fault and observe recovery.', settings: settings('comparison', { type: 'interruption' }) },
];

export function settingsFromRecord(record) {
  const { mode, probeCount, intervalMs, timeoutMs, fault } = record.settings;
  return { mode, probeCount, intervalMs, timeoutMs, fault: { ...fault } };
}
