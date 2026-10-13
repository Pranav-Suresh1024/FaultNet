export const networkControls = [
  { key: 'requestDelayMs', label: 'Request delay', max: 5000, unit: 'ms' },
  { key: 'responseDelayMs', label: 'Response delay', max: 5000, unit: 'ms' },
  { key: 'uploadKiBps', label: 'Upload limit', max: 500000, unit: 'KiB/s' },
  { key: 'downloadKiBps', label: 'Download limit', max: 500000, unit: 'KiB/s' },
  { key: 'jitterMs', label: 'Delay jitter', max: 1000, unit: 'ms' }
];
const values = (requestDelayMs, responseDelayMs, uploadKiBps, downloadKiBps, jitterMs) =>
  ({ requestDelayMs, responseDelayMs, uploadKiBps, downloadKiBps, jitterMs });
export const networkProfiles = [
  { name: 'Unlimited / clear', values: values(0, 0, 0, 0, 0) },
  { name: 'Fast 4G', values: values(50, 80, 750, 2000, 30) },
  { name: 'Slow 4G', values: values(150, 200, 250, 750, 120) },
  { name: '3G', values: values(300, 400, 40, 100, 200) },
  { name: 'EDGE', values: values(600, 800, 10, 30, 500) }
];

export function networkConfig(raw) {
  return Object.fromEntries(networkControls.map(field => {
    const number = Number(raw[field.key]);
    if (raw[field.key] === '' || !Number.isInteger(number) || number < 0 || number > field.max) {
      throw new Error(`${field.label}: enter a whole number from 0 to ${field.max} ${field.unit}.`);
    }
    return [field.key, number];
  }));
}

export function activityStats(entries) {
  const durations = entries.map(entry => entry.elapsedMs).sort((a, b) => a - b);
  const n = durations.length;
  return { count: n, altered: entries.filter(entry => entry.faults.length).length,
    errors: entries.filter(entry => entry.outcome !== 'completed' || entry.status >= 400).length,
    medianMs: n ? (durations[Math.floor((n - 1) / 2)] + durations[Math.floor(n / 2)]) / 2 : null,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0) };
}
