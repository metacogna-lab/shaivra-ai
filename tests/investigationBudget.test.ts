/**
 * Investigation budget: max tool runs and max time per investigation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAndConsume,
  getRemaining,
  getConsumed,
  getElapsedMs,
  reset,
  DEFAULT_MAX_TOOL_RUNS_PER_INVESTIGATION,
  DEFAULT_MAX_INVESTIGATION_TIME_MS,
} from '../src/server/services/investigationBudget';

describe('investigationBudget', () => {
  const id = 'inv-1';

  beforeEach(() => {
    reset(id);
  });

  it('exports default max tool runs 30 and max time 5 minutes', () => {
    expect(DEFAULT_MAX_TOOL_RUNS_PER_INVESTIGATION).toBe(30);
    expect(DEFAULT_MAX_INVESTIGATION_TIME_MS).toBe(5 * 60 * 1000);
  });

  it('consumes and reports remaining correctly', () => {
    expect(getRemaining(id)).toBe(30);
    expect(checkAndConsume(id, 5)).toBe(true);
    expect(getConsumed(id)).toBe(5);
    expect(getRemaining(id)).toBe(25);
    checkAndConsume(id, 25);
    expect(getRemaining(id)).toBe(0);
    expect(checkAndConsume(id, 1)).toBe(false);
  });

  it('reset clears budget for investigation', () => {
    checkAndConsume(id, 10);
    reset(id);
    expect(getConsumed(id)).toBe(0);
    expect(getRemaining(id)).toBe(30);
  });

  it('getElapsedMs returns elapsed time since first use', async () => {
    checkAndConsume(id, 1);
    const t0 = getElapsedMs(id);
    expect(t0).toBeGreaterThanOrEqual(0);
    await new Promise((r) => setTimeout(r, 10));
    const t1 = getElapsedMs(id);
    expect(t1).toBeGreaterThanOrEqual(t0);
  });
});
