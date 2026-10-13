export const experimentLimitMs = 120000;

export function experimentBudgetMs(settings) {
  return settings.probeCount * (settings.timeoutMs + settings.intervalMs)
    * (settings.mode === 'comparison' ? 2 : 1) + (settings.mode === 'comparison' ? 15000 : 0);
}
