export function metric(value, percent = false) {
  return value === null || value === undefined ? '—' : (value * (percent ? 100 : 1)).toFixed(1) + (percent ? '%' : '');
}

export function compareRuns(a, b) {
  return Boolean(a && b && a.schemaVersion === b.schemaVersion && ['demoContract', 'mode', 'probeCount', 'intervalMs',
    'timeoutMs', 'recoverySuccessCount', 'recoveryWindowMs'].every(key => a.settings[key] === b.settings[key]));
}

export function phaseView(record) {
  const phase = record.settings.mode === 'baseline' || record.summary.faulty.attemptCount === 0 ? 'baseline' : 'faulty';
  return { phase, summary: record.summary[phase], chart: ['baseline', 'faulty', 'recovery'].map(name => ({
    phase: name, medianMs: record.summary[name].medianElapsedMs, successes: record.summary[name].successCount,
    eligible: record.summary[name].eligibleCount })) };
}
