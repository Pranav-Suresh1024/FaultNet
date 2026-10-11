export function metric(value, percent = false) {
  return value === null || value === undefined ? '—' : (value * (percent ? 100 : 1)).toFixed(1) + (percent ? '%' : '');
}

export function compareRuns(a, b) {
  return Boolean(a && b && a.schemaVersion === b.schemaVersion && ['demoContract', 'mode', 'probeCount', 'intervalMs',
    'timeoutMs', 'recoverySuccessCount', 'recoveryWindowMs'].every(key => a.settings[key] === b.settings[key]));
}
