/**
 * Unit tests for playbook service. Asserts return shape matches Playbook and PlaybookStrategy.
 */

import { describe, it, expect } from 'vitest';
import { generatePlaybook } from '../../src/services/playbookService';
import { playbookSchema } from '../../src/contracts/knowledgeGraph';

describe('generatePlaybook', () => {
  it('returns object matching Playbook schema', async () => {
    const result = await generatePlaybook(['Driver1'], 'user-1', 'session-1');
    const parsed = playbookSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.id).toMatch(/^pb-/);
    expect(parsed.data.userId).toBe('user-1');
    expect(parsed.data.sessionId).toBe('session-1');
    expect(parsed.data.scenarioDrivers).toEqual(['Driver1']);
    expect(Array.isArray(parsed.data.strategies)).toBe(true);
  });

  it('returns strategies matching PlaybookStrategy shape', async () => {
    const result = await generatePlaybook([], 'u', 's');
    const parsed = playbookSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.strategies.length).toBeGreaterThan(0);
    const strat = parsed.data.strategies[0];
    expect(strat).toHaveProperty('id');
    expect(strat).toHaveProperty('name');
    expect(strat).toHaveProperty('type');
    expect(strat).toHaveProperty('description');
    expect(strat).toHaveProperty('rationale');
    expect(strat.rationale).toHaveProperty('signalProvenance');
    expect(strat.rationale).toHaveProperty('strategyLogic');
    expect(strat.rationale).toHaveProperty('impactEstimate');
    expect(Array.isArray(strat.metrics)).toBe(true);
    expect(Array.isArray(strat.nextSteps)).toBe(true);
    expect(Array.isArray(strat.risks)).toBe(true);
    expect(Array.isArray(strat.triggers)).toBe(true);
  });

  it('includes scenarioDrivers in response', async () => {
    const drivers = ['A', 'B', 'C'];
    const result = await generatePlaybook(drivers, 'u', 's');
    expect(result.scenarioDrivers).toEqual(drivers);
  });
});
