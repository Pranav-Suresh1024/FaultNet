export function summarize(observations) {
  const successes = observations.filter(item => item.successful);
  const times = successes.map(item => item.elapsedMs).filter(Number.isFinite).sort((a, b) => a - b);
  const rates = successes.filter(item => item.elapsedMs > 0).map(item => item.bytesReceived / item.elapsedMs * 1000 / 1024);
  const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const cancelledCount = observations.filter(item => item.outcome === 'cancelled').length;
  const eligibleCount = observations.length - cancelledCount;
  return { attemptCount: observations.length, cancelledCount, eligibleCount, successCount: successes.length,
    failureCount: eligibleCount - successes.length, availability: eligibleCount ? successes.length / eligibleCount : null,
    meanElapsedMs: mean(times), medianElapsedMs: times.length ? (times[Math.floor((times.length - 1) / 2)] + times[Math.floor(times.length / 2)]) / 2 : null,
    p95ElapsedMs: times.length ? times[Math.ceil(times.length * 0.95) - 1] : null, meanThroughputKiBps: mean(rates) };
}
