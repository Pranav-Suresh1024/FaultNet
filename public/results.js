export function metric(value, percent = false) {
  return value === null || value === undefined ? '—' : (value * (percent ? 100 : 1)).toFixed(1) + (percent ? '%' : '');
}

export function compareRuns(a, b) {
  return Boolean(a && b && a.schemaVersion === b.schemaVersion && ['demoContract', 'mode', 'probeCount', 'intervalMs',
    'timeoutMs', 'recoverySuccessCount', 'recoveryWindowMs'].every(key => a.settings[key] === b.settings[key]));
}

export function phaseView(record, preference = 'auto') {
  const phase = ['baseline', 'faulty', 'recovery'].includes(preference) ? preference
    : record.settings.mode === 'baseline' || record.summary.faulty.attemptCount === 0 ? 'baseline' : 'faulty';
  const summary = record.summary[phase], baseline = record.summary.baseline;
  const probes = record.observations.filter(item => item.phase === phase);
  const times = probes.filter(item => item.successful).map(item => item.elapsedMs).filter(Number.isFinite).sort((a, b) => a - b);
  const minMs = times.length ? times[0] : null, maxMs = times.length ? times[times.length - 1] : null;
  const histogram = [];
  if (times.length) {
    const count = minMs === maxMs ? 1 : Math.min(8, times.length);
    const width = (maxMs - minMs) / count;
    for (let i = 0; i < count; i++) histogram.push({ lowMs: minMs + i * width, highMs: i === count - 1 ? maxMs : minMs + (i + 1) * width, count: 0 });
    for (const time of times) histogram[width === 0 ? 0 : Math.min(count - 1, Math.floor((time - minMs) / width))].count++;
  }
  const difference = (a, b) => a === null || b === null ? null : a - b;
  return { phase, summary, probes, histogram,
    statistics: { meanMs: summary.meanElapsedMs, medianMs: summary.medianElapsedMs, p95Ms: summary.p95ElapsedMs, minMs, maxMs, sampleCount: times.length },
    outcomes: { successful: summary.successCount, failed: summary.failureCount, cancelled: summary.cancelledCount },
    baselineDelta: { medianMs: difference(summary.medianElapsedMs, baseline.medianElapsedMs),
      medianPercent: baseline.medianElapsedMs > 0 && summary.medianElapsedMs !== null ? (summary.medianElapsedMs / baseline.medianElapsedMs - 1) * 100 : null,
      availabilityPoints: difference(summary.availability === null ? null : summary.availability * 100, baseline.availability === null ? null : baseline.availability * 100),
      throughputKiBps: difference(summary.meanThroughputKiBps, baseline.meanThroughputKiBps) },
    chart: ['baseline', 'faulty', 'recovery'].map(name => ({
    phase: name, medianMs: record.summary[name].medianElapsedMs, successes: record.summary[name].successCount,
    eligible: record.summary[name].eligibleCount })) };
}
