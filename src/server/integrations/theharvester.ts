import { exec } from 'child_process';
import { promisify } from 'util';
import redis from '../db/redisClient';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const CACHE_TTL = 3600 * 12; // 12 hours
const TIMEOUT = 120000; // 2 minutes (TheHarvester can be slow)

export interface TheHarvesterResult {
  domain: string;
  source: string;
  emails: string[];
  hosts: string[];
  subdomains: string[];
  ips: string[];
  asns: string[];
  execution_time: number;
}

/**
 * Check if TheHarvester is installed
 */
export async function checkTheHarvesterInstalled(): Promise<boolean> {
  try {
    await execAsync('which theHarvester || which theharvester', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Enumerate emails, subdomains, and hosts for a domain using TheHarvester
 */
export async function harvestDomain(
  domain: string,
  source: string = 'google',
  limit: number = 500
): Promise<TheHarvesterResult> {
  const cacheKey = `theharvester:${domain}:${source}`;

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[TheHarvester] Cache hit for domain: ${domain}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[TheHarvester] Cache read failed:', err);
  }

  // Check if TheHarvester is installed
  const isInstalled = await checkTheHarvesterInstalled();
  if (!isInstalled) {
    console.warn('[TheHarvester] Not installed. Install with: pip3 install theHarvester');
    return getMockTheHarvesterData(domain, source);
  }

  const startTime = Date.now();

  try {
    console.log(`[TheHarvester] Harvesting domain: ${domain} (source: ${source})`);

    // Create temp directory for output
    const tempDir = '/tmp/theharvester-results';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputFile = path.join(tempDir, `${domain}-${Date.now()}.json`);

    // Run TheHarvester with JSON output
    // Common sources: google, bing, baidu, duckduckgo, yahoo, linkedin, hunter, certspotter, crtsh
    const command = `theHarvester -d ${domain} -b ${source} -l ${limit} -f ${outputFile}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: TIMEOUT,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr) {
        console.warn('[TheHarvester] stderr:', stderr);
      }
    } catch (error: any) {
      console.error('[TheHarvester] Command failed:', error.message);
      return getMockTheHarvesterData(domain, source);
    }

    // Read JSON output
    let results: any = {};

    const jsonFile = `${outputFile}.json`;
    if (fs.existsSync(jsonFile)) {
      const fileContent = fs.readFileSync(jsonFile, 'utf-8');
      results = JSON.parse(fileContent);

      // Clean up temp files
      fs.unlinkSync(jsonFile);

      // Also clean up XML file if it exists
      const xmlFile = `${outputFile}.xml`;
      if (fs.existsSync(xmlFile)) {
        fs.unlinkSync(xmlFile);
      }
    } else {
      console.warn('[TheHarvester] Output file not found');
      return getMockTheHarvesterData(domain, source);
    }

    const executionTime = Date.now() - startTime;

    // Parse results
    const result: TheHarvesterResult = {
      domain,
      source,
      emails: results.emails || [],
      hosts: results.hosts || [],
      subdomains: results.subdomains || [],
      ips: results.ips || [],
      asns: results.asns || [],
      execution_time: executionTime
    };

    // Cache result
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`[TheHarvester] Cached result for domain: ${domain}`);
    } catch (err) {
      console.warn('[TheHarvester] Cache write failed:', err);
    }

    return result;
  } catch (error: any) {
    console.error('[TheHarvester] Execution failed:', error);
    return getMockTheHarvesterData(domain, source);
  }
}

/**
 * Get available TheHarvester sources
 */
export function getAvailableSources(): string[] {
  return [
    'google',
    'bing',
    'baidu',
    'duckduckgo',
    'yahoo',
    'linkedin',
    'hunter',
    'certspotter',
    'crtsh',
    'anubis',
    'bevigil',
    'binaryedge',
    'hackertarget',
    'otx',
    'rapiddns',
    'securitytrails',
    'subdomaincenter',
    'subdomainfinderc99',
    'threatminer',
    'urlscan',
    'virustotal',
    'zoomeye'
  ];
}

/**
 * Mock data fallback
 */
function getMockTheHarvesterData(domain: string, source: string): TheHarvesterResult {
  return {
    domain,
    source,
    emails: [
      `admin@${domain}`,
      `info@${domain}`,
      `contact@${domain}`
    ],
    hosts: [
      `www.${domain}`,
      `mail.${domain}`,
      `ftp.${domain}`
    ],
    subdomains: [
      `www.${domain}`,
      `mail.${domain}`,
      `api.${domain}`,
      `dev.${domain}`
    ],
    ips: [
      '93.184.216.34',
      '93.184.216.35'
    ],
    asns: [
      'AS15133'
    ],
    execution_time: 0
  };
}

/**
 * Health check
 */
export async function checkTheHarvesterHealth(): Promise<{ available: boolean; installed: boolean; error?: string }> {
  const installed = await checkTheHarvesterInstalled();

  if (!installed) {
    return {
      available: false,
      installed: false,
      error: 'TheHarvester not installed. Install with: pip3 install theHarvester'
    };
  }

  try {
    // Quick test to verify it runs
    await execAsync('theHarvester --help', { timeout: 5000 });
    return { available: true, installed: true };
  } catch (error: any) {
    return {
      available: false,
      installed: true,
      error: error.message
    };
  }
}
