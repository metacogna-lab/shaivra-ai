import { evaluateRisk, RiskType } from './riskHeuristics';

describe('evaluateRisk', () => {
  it('flags cyber risks when vulnerabilities are present', () => {
    const type = evaluateRisk({ raw_data: { vulns: ['cve-123'], content: 'critical vulnerability' } });
    expect(type).toBe(RiskType.CYBER);
  });

  it('flags financial risks when ledger activity exists', () => {
    const type = evaluateRisk({ raw_data: { transaction: { amount: 1000 } } });
    expect(type).toBe(RiskType.FINANCIAL);
  });

  it('flags narrative risks for sentiment or disinformation topics', () => {
    const type = evaluateRisk({ raw_data: { sentiment: 'negative', topic: 'disinformation' } });
    expect(type).toBe(RiskType.NARRATIVE);
  });

  it('defaults to strategic risks when no heuristics trigger', () => {
    const type = evaluateRisk({ raw_data: { sentiment: 'positive' } });
    expect(type).toBe(RiskType.STRATEGIC);
  });
});
