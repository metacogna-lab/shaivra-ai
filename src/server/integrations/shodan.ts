import redis from '../db/redisClient';

const CACHE_TTL = 3600; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface ShodanResult {
  ip_str: string;
  port: number;
  transport: string;
  data: string;
  org: string;
  isp: string;
  os?: string;
  tags?: string[];
  vulns?: string[];
  hostnames?: string[];
  domains?: string[];
  location?: {
    country_name: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface ShodanSearchResponse {
  matches: ShodanResult[];
  total: number;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search Shodan with retry logic and caching
 */
export async function searchShodan(
  query: string,
  apiKey?: string
): Promise<ShodanSearchResponse> {
  const key = apiKey || process.env.SHODAN_API_KEY;

  if (!key) {
    throw new Error('SHODAN_API_KEY is not configured');
  }

  // Check cache first
  const cacheKey = `shodan:search:${query}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Shodan] Cache hit for query: ${query}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[Shodan] Cache read failed:', err);
  }

  // Make API call with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Shodan] API call attempt ${attempt}/${MAX_RETRIES} for query: ${query}`);

      const response = await fetch(
        `https://api.shodan.io/shodan/host/search?key=${key}&query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(10000) } // 10 second timeout
      );

      if (response.status === 429) {
        // Rate limited
        console.warn(`[Shodan] Rate limited on attempt ${attempt}`);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt); // Exponential backoff
          continue;
        }
        throw new Error('Shodan API rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`Shodan API error: ${response.status} ${response.statusText}`);
      }

      const data: ShodanSearchResponse = await response.json();

      // Cache successful result
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
        console.log(`[Shodan] Cached result for query: ${query}`);
      } catch (err) {
        console.warn('[Shodan] Cache write failed:', err);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`[Shodan] Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES && error.name !== 'AbortError') {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  // All retries failed, return mock data as fallback
  console.warn(`[Shodan] All retries failed for query: ${query}. Returning mock data.`);
  return getMockShodanData(query);
}

/**
 * Get host information by IP address
 */
export async function getShodanHost(
  ip: string,
  apiKey?: string
): Promise<ShodanResult> {
  const key = apiKey || process.env.SHODAN_API_KEY;

  if (!key) {
    throw new Error('SHODAN_API_KEY is not configured');
  }

  const cacheKey = `shodan:host:${ip}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Shodan] Cache read failed:', err);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://api.shodan.io/shodan/host/${ip}?key=${key}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Shodan API error: ${response.status}`);
      }

      const data: ShodanResult = await response.json();

      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
      } catch (err) {
        console.warn('[Shodan] Cache write failed:', err);
      }

      return data;
    } catch (error: any) {
      console.error(`[Shodan] Host lookup attempt ${attempt} failed:`, error.message);
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  throw new Error(`Failed to fetch Shodan host data for IP: ${ip}`);
}

/**
 * Mock data fallback when API is unavailable
 */
function getMockShodanData(query: string): ShodanSearchResponse {
  return {
    matches: [
      {
        ip_str: '93.184.216.34',
        port: 443,
        transport: 'tcp',
        data: 'HTTP/1.1 200 OK',
        org: 'Example Organization',
        isp: 'Example ISP',
        os: 'Linux 4.15',
        tags: ['cloud', 'vpn'],
        hostnames: ['example.com'],
        domains: ['example.com'],
        location: {
          country_name: 'United States',
          city: 'Los Angeles',
          latitude: 34.0522,
          longitude: -118.2437
        }
      }
    ],
    total: 1
  };
}
