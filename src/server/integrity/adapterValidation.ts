/**
 * OSINT adapter validation: reachability, entity types, canonical signals, rate/retry.
 * Validates each TOOL_REGISTRY entry against docs/osint/04-tool-contracts.md.
 */

import { hasAdapter } from '@shaivra/osint-sdk';
import { toolSelector } from '../services/toolSelector';
import { normalizerRegistry } from '../normalizers';
import { intelligenceEventSchema } from '../../contracts/intelligence';
import { v4 as uuidv4 } from 'uuid';

/** Contract entity types (04-tool-contracts.md). Registry may use infrastructure for domain/ip. */
const CONTRACT_ENTITY_TYPES = [
  'person',
  'organization',
  'domain',
  'email',
  'ip',
  'infrastructure',
  'event',
] as const;

/** Tools that have an HTTP/subprocess integration module in src/server/integrations. */
const TOOLS_WITH_INTEGRATION: ReadonlySet<string> = new Set([
  'shodan',
  'alienvault',
  'virustotal',
  'twitter',
  'reddit',
  'theharvester',
  'sherlock',
]);

/** Tools whose integration implements 429 handling and retry with backoff. */
const TOOLS_WITH_RATE_LIMIT_AND_RETRY: ReadonlySet<string> = new Set([
  'shodan',
  'alienvault',
  'virustotal',
]);

/** Tools whose integration implements at least rate-limit (429) handling. */
const TOOLS_WITH_RATE_LIMIT_HANDLING: ReadonlySet<string> = new Set([
  ...TOOLS_WITH_RATE_LIMIT_AND_RETRY,
  'twitter',
  'reddit',
]);

export interface AdapterCheck {
  tool: string;
  reachable: boolean;
  reachableVia: 'integration' | 'sdk_adapter' | 'none';
  entityTypesMatch: boolean;
  entityTypesContractDeviation?: string;
  emitsCanonicalSignals: boolean;
  canonicalSignalsError?: string;
  rateLimitAndRetryConfigured: boolean;
  rateLimitRetryNote?: string;
  errors: string[];
  ok: boolean;
}

export interface AdapterValidationResult {
  ok: boolean;
  checks: AdapterCheck[];
  deviations: string[];
}

/**
 * Minimal raw outputs used to verify normalizers produce valid IntelligenceEvent.
 * Tool-specific; empty or minimal valid structure.
 */
/** ISO timestamp for minimal fixtures. */
const MINIMAL_ISO = '2020-01-01T00:00:00.000Z';

const MINIMAL_RAW_FIXTURES: Record<string, unknown> = {
  shodan: { matches: [], total: 0 },
  virustotal: {
    data: {
      id: 'test',
      type: 'domain',
      attributes: {
        last_analysis_stats: { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0 },
        last_analysis_date: 0,
        last_modification_date: 0,
        reputation: 0,
        total_votes: { harmless: 0, malicious: 0 },
      },
      links: { self: '' },
    },
  },
  alienvault: {
    indicator: 'test.com',
    type: 'domain',
    title: '',
    description: '',
    created: MINIMAL_ISO,
    modified: MINIMAL_ISO,
    is_active: true,
    threat_score: 0,
  },
  twitter: {
    user: {
      id: 'min',
      username: 'min',
      name: 'Min',
      created_at: MINIMAL_ISO,
      verified: false,
      followers_count: 0,
      following_count: 0,
      tweet_count: 0,
    },
    tweets: [],
  },
  reddit: {
    user: {
      name: 'min',
      id: 'min',
      created_utc: 0,
      link_karma: 0,
      comment_karma: 0,
      is_verified: false,
      is_mod: false,
    },
    posts: [],
    comments: [],
  },
};

/**
 * Verify adapter service is reachable (integration module or SDK adapter).
 */
function checkReachable(toolName: string): { reachable: boolean; via: 'integration' | 'sdk_adapter' | 'none' } {
  const hasSdk = hasAdapter(toolName);
  const hasIntegration = TOOLS_WITH_INTEGRATION.has(toolName);
  if (hasSdk) return { reachable: true, via: 'sdk_adapter' };
  if (hasIntegration) return { reachable: true, via: 'integration' };
  return { reachable: false, via: 'none' };
}

/**
 * Verify supported entity types match contract (non-empty, values in allowed set).
 * Flags if registry uses only infrastructure/person instead of domain|ip|email.
 */
function checkEntityTypes(toolName: string): {
  match: boolean;
  deviation?: string;
} {
  const meta = toolSelector.getToolMetadata(toolName);
  if (!meta?.entityTypes?.length) {
    return { match: false, deviation: 'entityTypes empty or missing' };
  }
  const allowed = new Set<string>([
    ...CONTRACT_ENTITY_TYPES,
    'unknown', // registry-specific
  ]);
  const invalid = meta.entityTypes.filter((t) => !allowed.has(t));
  if (invalid.length > 0) {
    return { match: false, deviation: `entityTypes contain non-contract values: ${invalid.join(', ')}` };
  }
  // Contract recommends supportedEntities: person | organization | domain | email | ip
  if (
    meta.entityTypes.includes('infrastructure') &&
    !meta.entityTypes.some((t) => ['domain', 'ip', 'email'].includes(t))
  ) {
    return {
      match: true,
      deviation:
        'Registry uses infrastructure; contract 04 recommends domain|ip|email for routing. Consider extending.',
    };
  }
  return { match: true };
}

/**
 * Verify the adapter (via normalizer) emits canonical IntelligenceEvent.
 */
function checkCanonicalSignals(toolName: string): { ok: boolean; error?: string } {
  const getter = normalizerRegistry.get;
  const normalizer = typeof getter === 'function' ? getter.call(normalizerRegistry, toolName) : undefined;
  if (!normalizer) {
    return { ok: false, error: 'no normalizer' };
  }
  const fixture = MINIMAL_RAW_FIXTURES[toolName];
  if (fixture === undefined) {
    return { ok: false, error: 'no minimal fixture for normalizer test' };
  }
  try {
    const traceId = uuidv4();
    const event = normalizer.normalize(fixture, 'test-target', traceId);
    const parsed = intelligenceEventSchema.safeParse(event);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Verify rate limiting and retry policies are configured for the integration.
 */
function checkRateLimitAndRetry(toolName: string): {
  configured: boolean;
  note?: string;
} {
  if (!TOOLS_WITH_INTEGRATION.has(toolName)) {
    return { configured: true, note: 'no integration (SDK or future)' };
  }
  if (TOOLS_WITH_RATE_LIMIT_AND_RETRY.has(toolName)) {
    return { configured: true };
  }
  if (TOOLS_WITH_RATE_LIMIT_HANDLING.has(toolName)) {
    return {
      configured: false,
      note: '429 handling present but no retry/backoff',
    };
  }
  return {
    configured: false,
    note: 'no 429 or retry logic in integration (subprocess/cache only)',
  };
}

/**
 * Run full adapter validation for all registered tools.
 */
export function validateOsintAdapters(): AdapterValidationResult {
  const toolNames = toolSelector.getAllTools();
  const checks: AdapterCheck[] = [];
  const deviations: string[] = [];

  for (const toolName of toolNames) {
    const errors: string[] = [];
    const reach = checkReachable(toolName);
    const entity = checkEntityTypes(toolName);
    const signals = checkCanonicalSignals(toolName);
    const rateRetry = checkRateLimitAndRetry(toolName);

    if (!reach.reachable) errors.push('adapter not reachable (no integration or SDK adapter)');
    if (!entity.match) errors.push(entity.deviation ?? 'entityTypes invalid');
    if (!signals.ok) errors.push(`canonical signals: ${signals.error ?? 'invalid'}`);
    if (!rateRetry.configured) errors.push(`rate/retry: ${rateRetry.note ?? 'not configured'}`);

    if (entity.deviation && entity.match) deviations.push(`[${toolName}] ${entity.deviation}`);
    if (!signals.ok) deviations.push(`[${toolName}] Normalizer does not emit valid IntelligenceEvent: ${signals.error}`);
    if (!rateRetry.configured) deviations.push(`[${toolName}] ${rateRetry.note ?? 'rate/retry not configured'}`);

    checks.push({
      tool: toolName,
      reachable: reach.reachable,
      reachableVia: reach.via,
      entityTypesMatch: entity.match,
      entityTypesContractDeviation: entity.deviation,
      emitsCanonicalSignals: signals.ok,
      canonicalSignalsError: signals.error,
      rateLimitAndRetryConfigured: rateRetry.configured,
      rateLimitRetryNote: rateRetry.note,
      errors,
      ok: errors.length === 0,
    });
  }

  return {
    ok: checks.every((c) => c.ok),
    checks,
    deviations,
  };
}
