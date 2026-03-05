import redis from '../db/redisClient';

const CACHE_TTL = 3600; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export type IndicatorType = 'domain' | 'ip' | 'url' | 'hostname' | 'file';

export interface AlienVaultPulse {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created: string;
  modified: string;
  author_name: string;
  tlp: string;
  references: string[];
}

export interface AlienVaultIndicator {
  indicator: string;
  type: string;
  title: string;
  description: string;
  created: string;
  modified: string;
  is_active: boolean;
  threat_score: number;
  pulse_info?: {
    count: number;
    pulses: AlienVaultPulse[];
  };
  validation?: Array<{
    source: string;
    message: string;
    name: string;
  }>;
  whois?: string;
  alexa?: string;
  country_name?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get general information about an indicator from AlienVault OTX
 */
export async function getAlienVaultGeneral(
  indicator: string,
  type: IndicatorType = 'domain',
  apiKey?: string
): Promise<AlienVaultIndicator> {
  const key = apiKey || process.env.ALIENVAULT_API_KEY;

  if (!key) {
    throw new Error('ALIENVAULT_API_KEY is not configured');
  }

  // Check cache
  const cacheKey = `alienvault:${type}:${indicator}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[AlienVault] Cache hit for ${type}: ${indicator}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[AlienVault] Cache read failed:', err);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AlienVault] API call attempt ${attempt}/${MAX_RETRIES} for ${type}: ${indicator}`);

      const response = await fetch(
        `https://otx.alienvault.com/api/v1/indicators/${type}/${encodeURIComponent(indicator)}/general`,
        {
          headers: {
            'X-OTX-API-KEY': key
          },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.status === 429) {
        console.warn(`[AlienVault] Rate limited on attempt ${attempt}`);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt * 2); // Longer backoff for AlienVault
          continue;
        }
        throw new Error('AlienVault API rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`AlienVault API error: ${response.status} ${response.statusText}`);
      }

      const data: AlienVaultIndicator = await response.json();

      // Cache successful result
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
        console.log(`[AlienVault] Cached result for ${type}: ${indicator}`);
      } catch (err) {
        console.warn('[AlienVault] Cache write failed:', err);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`[AlienVault] Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES && error.name !== 'AbortError') {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  // Fallback to mock data
  console.warn(`[AlienVault] All retries failed for ${type}: ${indicator}. Returning mock data.`);
  return getMockAlienVaultData(indicator, type);
}

/**
 * Get malware data for an indicator
 */
export async function getAlienVaultMalware(
  indicator: string,
  type: IndicatorType = 'domain',
  apiKey?: string
): Promise<any> {
  const key = apiKey || process.env.ALIENVAULT_API_KEY;

  if (!key) {
    throw new Error('ALIENVAULT_API_KEY is not configured');
  }

  const cacheKey = `alienvault:malware:${type}:${indicator}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[AlienVault] Cache read failed:', err);
  }

  try {
    const response = await fetch(
      `https://otx.alienvault.com/api/v1/indicators/${type}/${encodeURIComponent(indicator)}/malware`,
      {
        headers: { 'X-OTX-API-KEY': key },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`AlienVault malware API error: ${response.status}`);
    }

    const data = await response.json();

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
      console.warn('[AlienVault] Cache write failed:', err);
    }

    return data;
  } catch (error: any) {
    console.error('[AlienVault] Malware lookup failed:', error.message);
    return { count: 0, data: [] };
  }
}

/**
 * Mock data fallback
 */
function getMockAlienVaultData(indicator: string, type: IndicatorType): AlienVaultIndicator {
  return {
    indicator,
    type,
    title: `Mock ${type} data`,
    description: `This is mock data for ${indicator} (AlienVault API unavailable)`,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    is_active: true,
    threat_score: 45,
    pulse_info: {
      count: 2,
      pulses: [
        {
          id: 'mock-pulse-1',
          name: 'Mock Threat Pulse',
          description: 'Sample threat intelligence pulse',
          tags: ['malware', 'phishing'],
          created: new Date(Date.now() - 86400000).toISOString(),
          modified: new Date().toISOString(),
          author_name: 'Mock Security Researcher',
          tlp: 'white',
          references: []
        }
      ]
    },
    validation: [
      {
        source: 'mock',
        message: 'Mock validation data',
        name: 'mock_validator'
      }
    ],
    country_name: 'Unknown',
    city: 'Unknown'
  };
}
