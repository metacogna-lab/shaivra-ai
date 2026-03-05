/**
 * Unit tests for portal Zod schemas. Valid payloads pass; invalid fail with clear paths.
 */

import { describe, it, expect } from 'vitest';
import {
  portalMetaSchema,
  dashboardDataSchema,
  ingestionJobSchema,
  lensSourceSchema,
  pipelineMetricSchema,
  lensIngestionResultSchema,
  lensNormalizationResultSchema,
  strategicReportSchema,
  forgeSimulationSchema,
  forgeReportSchema,
  proprietaryAssetSchema,
  shieldComparisonSchema,
} from '../../src/contracts/portal';
import {
  portalMeta,
  dashboardData,
  ingestionJob,
  lensSource,
  pipelineMetric,
  lensIngestionResult,
  lensNormalizationResult,
  strategicReport,
  forgeSimulation,
  forgeReport,
  proprietaryAsset,
  shieldComparison,
} from '../fixtures/portalDummyData';

describe('portalMetaSchema', () => {
  it('accepts valid portal meta', () => {
    const result = portalMetaSchema.safeParse(portalMeta);
    expect(result.success).toBe(true);
  });
  it('rejects invalid validation_status', () => {
    const result = portalMetaSchema.safeParse({
      ...portalMeta,
      validation_status: 'invalid_enum',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toContain('validation_status');
  });
});

describe('dashboardDataSchema', () => {
  it('accepts valid dashboard data', () => {
    const result = dashboardDataSchema.safeParse(dashboardData);
    expect(result.success).toBe(true);
  });
  it('rejects negative active_jobs', () => {
    const result = dashboardDataSchema.safeParse({
      ...dashboardData,
      active_jobs: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('ingestionJobSchema', () => {
  it('accepts valid ingestion job', () => {
    const result = ingestionJobSchema.safeParse(ingestionJob);
    expect(result.success).toBe(true);
  });
  it('rejects invalid status', () => {
    const result = ingestionJobSchema.safeParse({
      ...ingestionJob,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('lensSourceSchema', () => {
  it('accepts valid lens source', () => {
    const result = lensSourceSchema.safeParse(lensSource);
    expect(result.success).toBe(true);
  });
  it('rejects non-URL endpoint', () => {
    const result = lensSourceSchema.safeParse({
      ...lensSource,
      endpoint: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('pipelineMetricSchema', () => {
  it('accepts valid pipeline metric', () => {
    const result = pipelineMetricSchema.safeParse(pipelineMetric);
    expect(result.success).toBe(true);
  });
  it('accepts string value', () => {
    const result = pipelineMetricSchema.safeParse({
      ...pipelineMetric,
      value: 'HIGH',
    });
    expect(result.success).toBe(true);
  });
});

describe('lensIngestionResultSchema', () => {
  it('accepts valid ingestion result', () => {
    const result = lensIngestionResultSchema.safeParse(lensIngestionResult);
    expect(result.success).toBe(true);
  });
  it('rejects invalid timestamp', () => {
    const result = lensIngestionResultSchema.safeParse({
      ...lensIngestionResult,
      topic_published: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('lensNormalizationResultSchema', () => {
  it('accepts valid normalization result', () => {
    const result = lensNormalizationResultSchema.safeParse(lensNormalizationResult);
    expect(result.success).toBe(true);
  });
  it('rejects invalid validation_status', () => {
    const result = lensNormalizationResultSchema.safeParse({
      ...lensNormalizationResult,
      meta: { ...lensNormalizationResult.meta, validation_status: 'maybe' },
    });
    expect(result.success).toBe(false);
  });
});

describe('strategicReportSchema', () => {
  it('accepts valid strategic report', () => {
    const result = strategicReportSchema.safeParse(strategicReport);
    expect(result.success).toBe(true);
  });
  it('rejects missing graph_context', () => {
    const { graph_context: _, ...rest } = strategicReport;
    const result = strategicReportSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('forgeSimulationSchema', () => {
  it('accepts valid forge simulation', () => {
    const result = forgeSimulationSchema.safeParse(forgeSimulation);
    expect(result.success).toBe(true);
  });
  it('rejects progress > 1', () => {
    const result = forgeSimulationSchema.safeParse({
      ...forgeSimulation,
      progress: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('forgeReportSchema', () => {
  it('accepts valid forge report', () => {
    const result = forgeReportSchema.safeParse(forgeReport);
    expect(result.success).toBe(true);
  });
  it('rejects probability > 1 in timeline', () => {
    const result = forgeReportSchema.safeParse({
      ...forgeReport,
      predicted_timeline: [{ day: 1, event: 'X', probability: 2 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('proprietaryAssetSchema', () => {
  it('accepts valid proprietary asset', () => {
    const result = proprietaryAssetSchema.safeParse(proprietaryAsset);
    expect(result.success).toBe(true);
  });
  it('rejects invalid type', () => {
    const result = proprietaryAssetSchema.safeParse({
      ...proprietaryAsset,
      type: 'other',
    });
    expect(result.success).toBe(false);
  });
});

describe('shieldComparisonSchema', () => {
  it('accepts valid shield comparison', () => {
    const result = shieldComparisonSchema.safeParse(shieldComparison);
    expect(result.success).toBe(true);
  });
  it('rejects match_score > 100', () => {
    const result = shieldComparisonSchema.safeParse({
      ...shieldComparison,
      match_score: 101,
    });
    expect(result.success).toBe(false);
  });
});
