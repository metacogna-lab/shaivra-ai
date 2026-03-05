/**
 * Per-investigation tool-run and time budget. Prevents runaway scans.
 * Used by Investigation and Enrichment agents.
 */

/** Default max tool calls per investigation (e.g. 30). */
export const DEFAULT_MAX_TOOL_RUNS_PER_INVESTIGATION = 30;

/** Default max investigation time in ms (e.g. 5 minutes). */
export const DEFAULT_MAX_INVESTIGATION_TIME_MS = 5 * 60 * 1000;

/** In-memory: investigationId -> { consumed, startedAt }. Replace with Prisma when persisting. */
const budgetByInvestigation = new Map<string, { consumed: number; startedAt: number }>();

function getBudget(investigationId: string): { consumed: number; startedAt: number } {
  let b = budgetByInvestigation.get(investigationId);
  if (!b) {
    b = { consumed: 0, startedAt: Date.now() };
    budgetByInvestigation.set(investigationId, b);
  }
  return b;
}

/**
 * Check if budget allows consuming amount (tool runs and time). Consumes if allowed. Returns true if consumed.
 */
export function checkAndConsume(
  investigationId: string,
  amount: number,
  maxRuns: number = DEFAULT_MAX_TOOL_RUNS_PER_INVESTIGATION,
  maxTimeMs: number = DEFAULT_MAX_INVESTIGATION_TIME_MS
): boolean {
  const b = getBudget(investigationId);
  const elapsed = Date.now() - b.startedAt;
  if (elapsed >= maxTimeMs) return false;
  if (b.consumed + amount > maxRuns) return false;
  b.consumed += amount;
  return true;
}

/**
 * Get remaining tool runs for an investigation (capped by time budget).
 */
export function getRemaining(
  investigationId: string,
  maxRuns: number = DEFAULT_MAX_TOOL_RUNS_PER_INVESTIGATION,
  maxTimeMs: number = DEFAULT_MAX_INVESTIGATION_TIME_MS
): number {
  const b = getBudget(investigationId);
  const elapsed = Date.now() - b.startedAt;
  if (elapsed >= maxTimeMs) return 0;
  return Math.max(0, maxRuns - b.consumed);
}

/**
 * Get consumed count for an investigation (for reporting).
 */
export function getConsumed(investigationId: string): number {
  return budgetByInvestigation.get(investigationId)?.consumed ?? 0;
}

/**
 * Get elapsed time in ms for an investigation (for reporting).
 */
export function getElapsedMs(investigationId: string): number {
  const b = budgetByInvestigation.get(investigationId);
  return b ? Date.now() - b.startedAt : 0;
}

/**
 * Reset budget for an investigation (e.g. new investigation run).
 */
export function reset(investigationId: string): void {
  budgetByInvestigation.delete(investigationId);
}
