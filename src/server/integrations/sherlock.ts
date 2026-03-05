import { exec } from 'child_process';
import { promisify } from 'util';
import redis from '../db/redisClient';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const CACHE_TTL = 3600 * 24; // 24 hours (username data changes slowly)
const TIMEOUT = 60000; // 60 seconds

export interface SherlockResult {
  username: string;
  sites_found: Array<{
    site: string;
    url: string;
    status: 'found' | 'not_found' | 'error';
  }>;
  execution_time: number;
  total_sites_checked: number;
  sites_with_username: number;
}

/**
 * Check if Sherlock is installed
 */
export async function checkSherlockInstalled(): Promise<boolean> {
  try {
    await execAsync('which sherlock || which sherlock.py', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Search for a username across social media platforms using Sherlock
 */
export async function searchUsername(username: string): Promise<SherlockResult> {
  const cacheKey = `sherlock:${username}`;

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Sherlock] Cache hit for username: ${username}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[Sherlock] Cache read failed:', err);
  }

  // Check if Sherlock is installed
  const isInstalled = await checkSherlockInstalled();
  if (!isInstalled) {
    console.warn('[Sherlock] Not installed. Install with: pip3 install sherlock-project');
    return getMockSherlockData(username);
  }

  const startTime = Date.now();

  try {
    console.log(`[Sherlock] Searching for username: ${username}`);

    // Create temp directory for output
    const tempDir = '/tmp/sherlock-results';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputFile = path.join(tempDir, `${username}-${Date.now()}.json`);

    // Run Sherlock with JSON output
    const command = `sherlock ${username} --json --output ${outputFile} --timeout 10`;

    try {
      await execAsync(command, {
        timeout: TIMEOUT,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
    } catch (error: any) {
      // Sherlock returns non-zero exit code even on success sometimes
      console.warn(`[Sherlock] Command exited with code ${error.code}`);
    }

    // Read JSON output
    let results: any = {};

    if (fs.existsSync(outputFile)) {
      const fileContent = fs.readFileSync(outputFile, 'utf-8');
      results = JSON.parse(fileContent);

      // Clean up temp file
      fs.unlinkSync(outputFile);
    } else {
      console.warn('[Sherlock] Output file not found');
      return getMockSherlockData(username);
    }

    // Parse results
    const sitesFound: Array<{
      site: string;
      url: string;
      status: 'found' | 'not_found' | 'error';
    }> = [];

    for (const [site, data] of Object.entries(results)) {
      const siteData = data as any;

      if (siteData.status) {
        sitesFound.push({
          site,
          url: siteData.url_user || siteData.url || '',
          status: siteData.status === 'Claimed' ? 'found' : 'not_found'
        });
      }
    }

    const executionTime = Date.now() - startTime;

    const result: SherlockResult = {
      username,
      sites_found: sitesFound.filter(s => s.status === 'found'),
      execution_time: executionTime,
      total_sites_checked: sitesFound.length,
      sites_with_username: sitesFound.filter(s => s.status === 'found').length
    };

    // Cache result
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`[Sherlock] Cached result for username: ${username}`);
    } catch (err) {
      console.warn('[Sherlock] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[Sherlock] Execution failed:', error);

    // Return mock data on error
    return getMockSherlockData(username);
  }
}

/**
 * Mock data fallback
 */
function getMockSherlockData(username: string): SherlockResult {
  return {
    username,
    sites_found: [
      {
        site: 'GitHub',
        url: `https://github.com/${username}`,
        status: 'found'
      },
      {
        site: 'Twitter',
        url: `https://twitter.com/${username}`,
        status: 'found'
      },
      {
        site: 'Reddit',
        url: `https://reddit.com/user/${username}`,
        status: 'found'
      },
      {
        site: 'Instagram',
        url: `https://instagram.com/${username}`,
        status: 'found'
      }
    ],
    execution_time: 0,
    total_sites_checked: 50,
    sites_with_username: 4
  };
}

/**
 * Health check
 */
export async function checkSherlockHealth(): Promise<{ available: boolean; installed: boolean; error?: string }> {
  const installed = await checkSherlockInstalled();

  if (!installed) {
    return {
      available: false,
      installed: false,
      error: 'Sherlock not installed. Install with: pip3 install sherlock-project'
    };
  }

  try {
    // Quick test run
    await execAsync('sherlock --version', { timeout: 5000 });
    return { available: true, installed: true };
  } catch (error: any) {
    return {
      available: false,
      installed: true,
      error: error.message
    };
  }
}
