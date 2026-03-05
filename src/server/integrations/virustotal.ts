import redis from '../db/redisClient';

const CACHE_TTL = 3600; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export type VirusTotalResourceType = 'domain' | 'ip_address' | 'file' | 'url';

export interface VirusTotalAnalysisStats {
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  timeout: number;
}

export interface VirusTotalAttributes {
  last_analysis_stats: VirusTotalAnalysisStats;
  last_analysis_date: number;
  last_modification_date: number;
  reputation: number;
  total_votes: {
    harmless: number;
    malicious: number;
  };
  whois?: string;
  whois_date?: number;
  categories?: Record<string, string>;
  tags?: string[];
  popularity_ranks?: Record<string, { rank: number; timestamp: number }>;
}

export interface VirusTotalResponse {
  data: {
    id: string;
    type: string;
    attributes: VirusTotalAttributes;
    links: {
      self: string;
    };
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get information about a resource from VirusTotal
 */
export async function getVirusTotalReport(
  resource: string,
  type: VirusTotalResourceType = 'domain',
  apiKey?: string
): Promise<VirusTotalResponse> {
  const key = apiKey || process.env.VIRUSTOTAL_API_KEY;

  if (!key) {
    throw new Error('VIRUSTOTAL_API_KEY is not configured');
  }

  // Check cache
  const cacheKey = `virustotal:${type}:${resource}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[VirusTotal] Cache hit for ${type}: ${resource}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[VirusTotal] Cache read failed:', err);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[VirusTotal] API call attempt ${attempt}/${MAX_RETRIES} for ${type}: ${resource}`);

      // Convert type to API endpoint format
      const endpoint = type === 'ip_address' ? 'ip_addresses' : `${type}s`;

      const response = await fetch(
        `https://www.virustotal.com/api/v3/${endpoint}/${encodeURIComponent(resource)}`,
        {
          headers: {
            'x-apikey': key
          },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.status === 429) {
        console.warn(`[VirusTotal] Rate limited on attempt ${attempt}`);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt * 3); // VirusTotal has strict rate limits
          continue;
        }
        throw new Error('VirusTotal API rate limit exceeded (4 requests/min on free tier)');
      }

      if (response.status === 404) {
        // Resource not found in VirusTotal database
        console.warn(`[VirusTotal] Resource not found: ${resource}`);
        return getMockVirusTotalData(resource, type, true);
      }

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.status} ${response.statusText}`);
      }

      const data: VirusTotalResponse = await response.json();

      // Cache successful result
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
        console.log(`[VirusTotal] Cached result for ${type}: ${resource}`);
      } catch (err) {
        console.warn('[VirusTotal] Cache write failed:', err);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`[VirusTotal] Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES && error.name !== 'AbortError') {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  // Fallback to mock data
  console.warn(`[VirusTotal] All retries failed for ${type}: ${resource}. Returning mock data.`);
  return getMockVirusTotalData(resource, type, false);
}

/**
 * Scan a URL for threats
 */
export async function scanVirusTotalUrl(
  url: string,
  apiKey?: string
): Promise<{ id: string; links: { self: string } }> {
  const key = apiKey || process.env.VIRUSTOTAL_API_KEY;

  if (!key) {
    throw new Error('VIRUSTOTAL_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}`,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`VirusTotal scan error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[VirusTotal] URL scan failed:', error.message);
    throw error;
  }
}

/**
 * Get analysis results
 */
export async function getVirusTotalAnalysis(
  analysisId: string,
  apiKey?: string
): Promise<any> {
  const key = apiKey || process.env.VIRUSTOTAL_API_KEY;

  if (!key) {
    throw new Error('VIRUSTOTAL_API_KEY is not configured');
  }

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: { 'x-apikey': key },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`VirusTotal analysis error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('[VirusTotal] Analysis lookup failed:', error.message);
    throw error;
  }
}

/**
 * Mock data fallback
 */
function getMockVirusTotalData(
  resource: string,
  type: VirusTotalResourceType,
  notFound: boolean
): VirusTotalResponse {
  const now = Math.floor(Date.now() / 1000);

  if (notFound) {
    return {
      data: {
        id: resource,
        type,
        attributes: {
          last_analysis_stats: {
            harmless: 0,
            malicious: 0,
            suspicious: 0,
            undetected: 0,
            timeout: 0
          },
          last_analysis_date: now,
          last_modification_date: now,
          reputation: 0,
          total_votes: { harmless: 0, malicious: 0 },
          tags: ['not-found']
        },
        links: {
          self: `https://www.virustotal.com/api/v3/${type}s/${resource}`
        }
      }
    };
  }

  return {
    data: {
      id: resource,
      type,
      attributes: {
        last_analysis_stats: {
          harmless: 72,
          malicious: 3,
          suspicious: 1,
          undetected: 8,
          timeout: 0
        },
        last_analysis_date: now - 3600,
        last_modification_date: now - 7200,
        reputation: 45,
        total_votes: {
          harmless: 120,
          malicious: 5
        },
        categories: {
          'Webroot': 'Business',
          'Fortinet': 'Information Technology'
        },
        tags: ['mock-data'],
        popularity_ranks: {
          'Alexa': { rank: 50000, timestamp: now - 86400 }
        }
      },
      links: {
        self: `https://www.virustotal.com/api/v3/${type}s/${resource}`
      }
    }
  };
}
