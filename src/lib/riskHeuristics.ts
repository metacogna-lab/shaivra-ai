export enum RiskType {
  CYBER = 'CYBER',
  FINANCIAL = 'FINANCIAL',
  NARRATIVE = 'NARRATIVE',
  STRATEGIC = 'STRATEGIC'
}

export const evaluateRisk = (data: any): RiskType => {
  // Heuristics logic based on raw data properties
  if (data.raw_data?.vulns || (data.raw_data?.content && data.raw_data.content.includes('vulnerability'))) {
    return RiskType.CYBER;
  }
  if (data.raw_data?.financial || data.raw_data?.transaction) {
    return RiskType.FINANCIAL;
  }
  if (data.raw_data?.sentiment === 'negative' || data.raw_data?.topic === 'disinformation') {
    return RiskType.NARRATIVE;
  }
  return RiskType.STRATEGIC;
};
