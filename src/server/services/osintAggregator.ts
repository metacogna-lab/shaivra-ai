import { searchShodan, getShodanHost } from '../integrations/shodan';
import { getAlienVaultGeneral, getAlienVaultMalware, type IndicatorType } from '../integrations/alienvault';
import { getVirusTotalReport, type VirusTotalResourceType } from '../integrations/virustotal';
import { normalizerRegistry } from '../normalizers';
import type { IntelligenceEvent } from '../../contracts';
import { v4 as uuidv4 } from 'uuid';

export interface OSINTResult {
  source: 'shodan' | 'alienvault' | 'virustotal';
  success: boolean;
  data?: any;
  event?: IntelligenceEvent; // NEW: Normalized intelligence event
  error?: string;
  cached: boolean;
  timestamp: string;
}

export interface AggregatedOSINTReport {
  target: string;
  type: 'domain' | 'ip' | 'url' | 'hostname';
  results: OSINTResult[];
  summary: {
    total_sources: number;
    successful_sources: number;
    failed_sources: number;
    threat_level: 'low' | 'medium' | 'high' | 'critical';
    confidence_score: number;
  };
  generated_at: string;
}

/**
 * Aggregate OSINT data from multiple sources for a target
 */
export async function aggregateOSINTData(
  target: string,
  type: 'domain' | 'ip' | 'url' | 'hostname' = 'domain'
): Promise<AggregatedOSINTReport> {
  const results: OSINTResult[] = [];
  const startTime = Date.now();

  // Run all OSINT queries in parallel for speed
  const [shodanResult, alienVaultResult, virusTotalResult] = await Promise.allSettled([
    queryShoda(target, type),
    queryAlienVault(target, type),
    queryVirusTotal(target, type)
  ]);

  // Process Shodan result
  if (shodanResult.status === 'fulfilled') {
    results.push(shodanResult.value);
  } else {
    results.push({
      source: 'shodan',
      success: false,
      error: shodanResult.reason?.message || 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    });
  }

  // Process AlienVault result
  if (alienVaultResult.status === 'fulfilled') {
    results.push(alienVaultResult.value);
  } else {
    results.push({
      source: 'alienvault',
      success: false,
      error: alienVaultResult.reason?.message || 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    });
  }

  // Process VirusTotal result
  if (virusTotalResult.status === 'fulfilled') {
    results.push(virusTotalResult.value);
  } else {
    results.push({
      source: 'virustotal',
      success: false,
      error: virusTotalResult.reason?.message || 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    });
  }

  const successfulSources = results.filter(r => r.success).length;
  const failedSources = results.filter(r => !r.success).length;

  // Calculate threat level based on results
  const threatLevel = calculateThreatLevel(results);
  const confidenceScore = calculateConfidenceScore(results, successfulSources);

  const report: AggregatedOSINTReport = {
    target,
    type,
    results,
    summary: {
      total_sources: results.length,
      successful_sources: successfulSources,
      failed_sources: failedSources,
      threat_level: threatLevel,
      confidence_score: confidenceScore
    },
    generated_at: new Date().toISOString()
  };

  const elapsed = Date.now() - startTime;
  console.log(`[OSINT Aggregator] Generated report for ${target} in ${elapsed}ms`);

  return report;
}

/**
 * Query Shodan and normalize to IntelligenceEvent
 */
async function queryShoda(target: string, type: string): Promise<OSINTResult> {
  const startTime = Date.now();
  const traceId = uuidv4();

  try {
    let data;
    if (type === 'ip') {
      // For single host lookup, wrap in search response format
      const hostData = await getShodanHost(target);
      data = { matches: [hostData], total: 1 };
    } else {
      data = await searchShodan(target);
    }

    // Normalize to canonical schema
    const normalizer = normalizerRegistry.get('shodan');
    const event = normalizer
      ? normalizer.normalize(data, target, traceId)
      : undefined;

    return {
      source: 'shodan',
      success: true,
      data,
      event, // NEW: Normalized intelligence event
      cached: false,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`Shodan query failed: ${error.message}`);
  }
}

/**
 * Query AlienVault OTX and normalize to IntelligenceEvent
 */
async function queryAlienVault(target: string, type: string): Promise<OSINTResult> {
  const traceId = uuidv4();

  try {
    const indicatorType: IndicatorType = type === 'ip' ? 'ip' : type as IndicatorType;
    const general = await getAlienVaultGeneral(target, indicatorType);
    const malware = await getAlienVaultMalware(target, indicatorType);

    const data = { general, malware };

    // Normalize to canonical schema (use general data for primary normalization)
    const normalizer = normalizerRegistry.get('alienvault');
    const event = normalizer
      ? normalizer.normalize(general, target, traceId)
      : undefined;

    return {
      source: 'alienvault',
      success: true,
      data,
      event,
      cached: false,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`AlienVault query failed: ${error.message}`);
  }
}

/**
 * Query VirusTotal and normalize to IntelligenceEvent
 */
async function queryVirusTotal(target: string, type: string): Promise<OSINTResult> {
  const traceId = uuidv4();

  try {
    const resourceType: VirusTotalResourceType = type === 'ip' ? 'ip_address' : type as VirusTotalResourceType;
    const data = await getVirusTotalReport(target, resourceType);

    // Normalize to canonical schema
    const normalizer = normalizerRegistry.get('virustotal');
    const event = normalizer
      ? normalizer.normalize(data, target, traceId)
      : undefined;

    return {
      source: 'virustotal',
      success: true,
      data,
      event,
      cached: false,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`VirusTotal query failed: ${error.message}`);
  }
}

/**
 * Calculate threat level based on OSINT results
 */
function calculateThreatLevel(results: OSINTResult[]): 'low' | 'medium' | 'high' | 'critical' {
  let threatScore = 0;

  for (const result of results) {
    if (!result.success || !result.data) continue;

    // Shodan scoring
    if (result.source === 'shodan' && result.data.matches) {
      const matches = result.data.matches || [];
      if (matches.some((m: any) => m.vulns && m.vulns.length > 0)) {
        threatScore += 30; // Has known vulnerabilities
      }
      if (matches.length > 10) {
        threatScore += 10; // Many exposed services
      }
    }

    // AlienVault scoring
    if (result.source === 'alienvault' && result.data.general) {
      const general = result.data.general;
      if (general.pulse_info && general.pulse_info.count > 0) {
        threatScore += general.pulse_info.count * 5; // Each pulse adds 5 points
      }
      if (general.threat_score) {
        threatScore += general.threat_score / 2; // Add half of OTX threat score
      }
    }

    // VirusTotal scoring
    if (result.source === 'virustotal' && result.data.data) {
      const stats = result.data.data.attributes?.last_analysis_stats;
      if (stats) {
        threatScore += stats.malicious * 10; // Each malicious detection adds 10 points
        threatScore += stats.suspicious * 5; // Each suspicious detection adds 5 points
      }
    }
  }

  if (threatScore >= 70) return 'critical';
  if (threatScore >= 40) return 'high';
  if (threatScore >= 20) return 'medium';
  return 'low';
}

/**
 * Calculate confidence score (0-100) based on data quality
 */
function calculateConfidenceScore(results: OSINTResult[], successfulSources: number): number {
  if (successfulSources === 0) return 0;

  let score = (successfulSources / results.length) * 100;

  // Bonus for multiple successful sources
  if (successfulSources >= 2) score = Math.min(score + 10, 100);
  if (successfulSources === 3) score = Math.min(score + 10, 100);

  return Math.round(score);
}

/**
 * Quick OSINT lookup for a single source
 */
export async function quickOSINTLookup(
  target: string,
  source: 'shodan' | 'alienvault' | 'virustotal',
  type: 'domain' | 'ip' | 'url' | 'hostname' = 'domain'
): Promise<OSINTResult> {
  try {
    switch (source) {
      case 'shodan':
        return await queryShoda(target, type);
      case 'alienvault':
        return await queryAlienVault(target, type);
      case 'virustotal':
        return await queryVirusTotal(target, type);
      default:
        throw new Error(`Unknown OSINT source: ${source}`);
    }
  } catch (error: any) {
    return {
      source,
      success: false,
      error: error.message,
      cached: false,
      timestamp: new Date().toISOString()
    };
  }
}
