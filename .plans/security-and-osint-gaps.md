# Security Hardening & OSINT Capability Gaps Analysis
**Date:** 2026-03-05
**Project:** Shaivra Intelligence Suite
**Version:** Alpha 0.1

---

## Executive Summary

This document identifies critical security vulnerabilities, disconnected API endpoints, and OSINT capability gaps in the Shaivra Intelligence Suite. The application is **NOT production-ready** and requires immediate security hardening and integration of real OSINT tools.

---

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. Hardcoded Admin Credentials

**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.8 (Critical)

**Location:**
- `src/services/portalApi.ts` (lines 33-40)
- `server.ts` (lines 1118-1119)

**Vulnerable Code:**
```javascript
const ADMIN_USER = 'shaivra-ai';
const ADMIN_PASS = 'ShaivraAdmin345%';

if (username === 'shaivra-ai' && password === 'ShaivraAdmin345%') {
  res.json({ token: 'mock-admin-token', user: { id: 'admin-1', username, role: 'admin' } });
}
```

**Risk:**
- Anyone with access to source code can authenticate as admin
- No password rotation possible
- No audit trail of who authenticated

**Fix:**
```typescript
// Remove hardcoded credentials entirely
// Replace with Supabase Auth or Auth0

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: data.session.access_token, user: data.user });
});
```

**Priority:** P0 - Fix immediately before any deployment

---

### 2. No Input Validation

**Severity:** 🔴 CRITICAL
**CVSS Score:** 8.6 (High)

**Problem:** All 24+ API endpoints accept raw `req.body` without validation

**Affected Endpoints:**
```javascript
POST /api/search              - No query length limit
POST /api/summarize           - No data size limit
POST /api/report              - No validation of pipelineData
POST /api/analytics/summary   - No sector/target validation
POST /api/search/filtered     - No array length validation
POST /api/ingestion/advanced  - No source array validation
POST /api/org/profile         - No orgName/objective validation
// ... 17 more endpoints
```

**Attack Vectors:**
1. **DoS:** Submit gigabytes of data in `pipelineData`
2. **XSS:** Inject `<script>alert(1)</script>` in org names
3. **SQL Injection:** Once DB is added, unvalidated inputs are dangerous
4. **Token Exhaustion:** Send massive strings to Gemini API, burn through quota

**Fix:**
```typescript
import { z } from 'zod';

// Define schemas
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  traceId: z.string().uuid().optional()
});

const reportSchema = z.object({
  pipelineData: z.record(z.unknown()).refine(
    data => JSON.stringify(data).length < 50000,
    { message: "Pipeline data too large" }
  ),
  target: z.string().min(1).max(200)
});

// Validate in endpoint
app.post("/api/search", async (req, res) => {
  try {
    const validated = searchSchema.parse(req.body);
    // ... rest of logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }
  }
});
```

**Priority:** P0 - Add to all endpoints before deployment

---

### 3. No Rate Limiting

**Severity:** 🔴 CRITICAL
**CVSS Score:** 7.5 (High)

**Problem:** No rate limits on any endpoint

**Attack Scenarios:**
1. **API Quota Burnout:** Attacker spams `/api/search` → burns through Gemini API quota
2. **DoS:** 10,000 requests/second crashes server
3. **Scraping:** Automated tool extracts all intelligence data
4. **Cost Attack:** Each Gemini API call costs money → financial damage

**Current State:**
```javascript
// server.ts - NO rate limiting
app.post("/api/search", async (req, res) => {
  // Anyone can call this unlimited times
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent(...);
});
```

**Fix:**
```typescript
import rateLimit from 'express-rate-limit';

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min per IP
  message: { error: 'Too many requests, please try again later' }
});

// Expensive endpoint rate limit (AI calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI calls per minute per IP
  message: { error: 'AI quota exceeded, please slow down' }
});

app.use('/api/', globalLimiter);
app.post("/api/search", aiLimiter, async (req, res) => { /* ... */ });
app.post("/api/report", aiLimiter, async (req, res) => { /* ... */ });
app.post("/api/forge/analyze", aiLimiter, async (req, res) => { /* ... */ });
```

**Priority:** P0 - Add before any public deployment

---

### 4. No CSRF Protection

**Severity:** 🟠 HIGH
**CVSS Score:** 6.5 (Medium)

**Problem:** State-changing endpoints (POST, PATCH, DELETE) have no CSRF tokens

**Attack Scenario:**
```html
<!-- Attacker's malicious site -->
<img src="https://shaivra.com/api/projects" hidden />
<script>
  fetch('https://shaivra.com/api/org/profile', {
    method: 'POST',
    credentials: 'include', // Sends session cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgName: 'Victim Corp',
      objective: 'Steal intelligence'
    })
  });
</script>
```

**Risk:**
- Authenticated user visits attacker's site
- Attacker makes requests on user's behalf
- Can create projects, run profiling, modify settings

**Fix:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Apply to all state-changing routes
app.post('/api/projects', csrfProtection, async (req, res) => { /* ... */ });
app.post('/api/org/profile', csrfProtection, async (req, res) => { /* ... */ });
app.patch('/api/projects/:id/settings', csrfProtection, async (req, res) => { /* ... */ });

// Send CSRF token to client
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**Frontend:**
```typescript
// Fetch CSRF token on app load
const csrfToken = await fetch('/api/csrf-token').then(r => r.json()).then(d => d.csrfToken);

// Include in all POST requests
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  body: JSON.stringify({ name: 'New Project' })
});
```

**Priority:** P0 - Add before deployment

---

### 5. API Key Exposed Client-Side

**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.1 (Critical)

**Location:** `vite.config.ts` (lines 14-15)

**Vulnerable Code:**
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

**Problem:** Gemini API key is embedded in client-side JavaScript bundle

**Risk:**
1. Anyone can open DevTools → Sources → search for "GEMINI_API_KEY"
2. Attacker extracts key → uses for own projects
3. Quota exhaustion and financial damage

**Proof:**
```bash
# Build the app
npm run build

# Search compiled bundle
grep -r "gemini" dist/assets/*.js
# Result: API key is visible!
```

**Fix:**
1. **Remove from Vite config:**
```typescript
// vite.config.ts - REMOVE these lines
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // DELETE
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // DELETE
}
```

2. **Backend proxy pattern:**
```typescript
// Frontend - NO direct Gemini calls
// src/services/geminiClient.ts - DELETE THIS FILE

// Instead, use backend proxy
export const aiService = {
  search: async (query: string) => {
    return fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }).then(r => r.json());
  }
};
```

3. **Backend keeps key secret:**
```typescript
// server.ts - API key only on backend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
// Never send to client
```

**Priority:** P0 - Fix immediately

---

### 6. No Session Management

**Severity:** 🟠 HIGH
**CVSS Score:** 7.5 (High)

**Problem:** Mock token `'mock-admin-token'` is never validated

**Current Auth Flow:**
```typescript
// Login returns mock token
res.json({ token: 'mock-admin-token', user: { id: 'admin-1', ... } });

// But no endpoint validates it!
app.get("/api/projects", async (req, res) => {
  // No check: if (req.headers.authorization !== 'Bearer mock-admin-token') ...
  const projects = await getProjects();
  res.json(projects);
});
```

**Risk:**
- Anyone can call API endpoints without authentication
- No session expiration
- No logout functionality (token never invalidated)

**Fix:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Apply to protected routes
app.get("/api/projects", authenticateToken, async (req, res) => {
  const projects = await getProjects(req.user.id);
  res.json(projects);
});

// Login generates real JWT
app.post("/api/auth/login", async (req, res) => {
  // ... validate credentials
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '24h'
  });
  res.json({ token, user });
});
```

**Priority:** P0 - Add before deployment

---

## 🟠 HIGH-PRIORITY SECURITY ISSUES

### 7. No SQL Injection Protection (Future)

**Severity:** 🟠 HIGH (once DB is added)
**CVSS Score:** 9.8 (Critical)

**Current State:** Not vulnerable (no database)
**Future Risk:** When PostgreSQL is added, unvalidated inputs are dangerous

**Example Vulnerable Code (DON'T DO THIS):**
```typescript
// WRONG - SQL injection vulnerability
app.get("/api/projects", async (req, res) => {
  const { search } = req.query;
  const query = `SELECT * FROM projects WHERE name LIKE '%${search}%'`;
  const result = await db.query(query);
  // Attacker: ?search='; DROP TABLE projects; --
});
```

**Fix:**
```typescript
// RIGHT - Parameterized query
app.get("/api/projects", async (req, res) => {
  const { search } = req.query;
  const query = `SELECT * FROM projects WHERE name LIKE $1`;
  const result = await db.query(query, [`%${search}%`]);
});
```

**Priority:** P0 when adding database

---

### 8. No XSS Protection

**Severity:** 🟠 HIGH
**CVSS Score:** 6.1 (Medium)

**Problem:** User inputs rendered without sanitization

**Vulnerable Code:**
```typescript
// src/pages/portal/OrgProfiler.tsx
<div dangerouslySetInnerHTML={{ __html: profile.mission }} />
// If mission = "<script>alert(1)</script>", executes!
```

**Fix:**
```typescript
import DOMPurify from 'dompurify';

// Sanitize before rendering
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(profile.mission)
}} />

// Or just use plain text
<div>{profile.mission}</div>
```

**Priority:** P1 - Add before handling user-generated content

---

### 9. No HTTPS Enforcement

**Severity:** 🟠 HIGH
**CVSS Score:** 7.4 (High)

**Problem:** No redirect from HTTP → HTTPS in production

**Fix:**
```typescript
import { createServer } from 'https';
import { readFileSync } from 'fs';

if (process.env.NODE_ENV === 'production') {
  // Redirect HTTP → HTTPS
  const http = require('http');
  http.createServer((req: any, res: any) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  }).listen(80);

  // HTTPS server
  const options = {
    key: readFileSync(process.env.SSL_KEY_PATH!),
    cert: readFileSync(process.env.SSL_CERT_PATH!)
  };
  createServer(options, app).listen(443);
} else {
  app.listen(PORT);
}
```

**Priority:** P0 for production deployment

---

### 10. No Content Security Policy (CSP)

**Severity:** 🟠 HIGH
**CVSS Score:** 6.5 (Medium)

**Problem:** No CSP headers to prevent XSS and data exfiltration

**Fix:**
```typescript
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

**Priority:** P1 - Add before production

---

## 🟡 MEDIUM-PRIORITY SECURITY ISSUES

### 11. Passwords Not Hashed

**Severity:** 🟡 MEDIUM
**CVSS Score:** 7.5 (High)

**Problem:** Plaintext password comparison (demo only, but bad pattern)

**Current Code:**
```typescript
const hashedProvidedPass = await portalApi.hashData(password);
const hashedAdminPass = await portalApi.hashData(ADMIN_PASS);
// SHA-256 is NOT a password hash!
```

**Fix:**
```typescript
import bcrypt from 'bcrypt';

// Store hashed password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, storedHash);
```

**Priority:** P1 when adding real user database

---

### 12. No Audit Logging

**Severity:** 🟡 MEDIUM
**CVSS Score:** 5.3 (Medium)

**Problem:** No record of who did what and when

**Required Logging:**
- Authentication attempts (success/failure)
- OSINT queries and targets
- Report generation
- Settings changes
- User role changes

**Fix:**
```typescript
interface AuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
}

const logAudit = async (log: AuditLog) => {
  await db.query(
    'INSERT INTO audit_logs (timestamp, user_id, action, resource, details, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [log.timestamp, log.userId, log.action, log.resource, log.details, log.ipAddress, log.userAgent]
  );
};

// Usage
app.post("/api/org/profile", authenticateToken, async (req, res) => {
  await logAudit({
    timestamp: new Date().toISOString(),
    userId: req.user.id,
    action: 'org_profile_started',
    resource: req.body.orgName,
    details: { objective: req.body.objective },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  // ... rest of logic
});
```

**Priority:** P2 - Add before public release

---

## 🔴 DISCONNECTED API ENDPOINTS

### Endpoints With Mock Implementations

| Endpoint | Status | Backend Logic | Frontend Usage | Fix Required |
|----------|--------|---------------|----------------|--------------|
| `GET /api/osint/shodan` | 🟡 Partial | Returns 400 if no API key | Used in `portalApi.shodanSearch()` | Add real Shodan API key |
| `GET /api/osint/alienvault` | 🟡 Partial | Returns 400 if no API key | Used in `portalApi.alienvaultSearch()` | Add real AlienVault API key |
| `GET /api/osint/virustotal` | 🟡 Partial | Returns 400 if no API key | Used in `portalApi.virustotalSearch()` | Add real VirusTotal API key |
| `POST /api/osint/maltego` | ❌ Mock only | Simulates transform output | Used in `portalApi.runMaltegoTransform()` | Integrate Maltego CLI |
| `GET /api/rss` | ❌ Mock data | Returns hardcoded 6 items | ❌ Not used | Add RSS parser library |
| `GET /api/admin/reports/daily` | 🟡 Partial | Reads empty `searchHistory[]` | Used in `portalApi.getDailyIntelligence()` | Add persistent storage |
| `GET /api/admin/reports/weekly` | 🟡 Partial | Reads empty `masterGraph.nodes` | Used in `portalApi.getWeeklyIntelligence()` | Add persistent storage |
| `GET /api/trends` | ❌ Mock data | Returns empty `trends[]` | Used in `/portal/trends` | Add time series database |
| `POST /api/agent/investigate` | ✅ Works | Calls `runAgentNetwork()` | Used in `/portal/recon` | None (functional) |
| `POST /api/forge/analyze` | ✅ Works | Calls Gemini AI | Used in `/portal/forge` | None (functional) |

### Fix Priority: Real OSINT Tool Integration

**P0 - Critical:**
1. Shodan API (`SHODAN_API_KEY`)
2. AlienVault OTX (`ALIENVAULT_API_KEY`)
3. VirusTotal (`VIRUSTOTAL_API_KEY`)

**P1 - High:**
4. RSS feed parser (add `rss-parser` library)
5. Maltego CLI integration (requires licensed Maltego)

**P2 - Medium:**
6. Historical data storage for trends/reports

---

## 🔴 OSINT CAPABILITY GAPS

### 1. Social Media Real-Time Monitoring

**Gap:** No real Twitter, Reddit, LinkedIn integration

**Current State:**
- Mock implementations in `portalApi.simulatePublicSource()`
- UI shows source selection in Lens page
- Backend has no API clients

**What's Missing:**

#### Twitter/X API v2
```typescript
// Required: Twitter Developer Account + Bearer Token
import { TwitterApi } from 'twitter-api-v2';

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

async function monitorTwitter(query: string) {
  const tweets = await twitterClient.v2.search(query, {
    max_results: 100,
    'tweet.fields': ['created_at', 'author_id', 'public_metrics']
  });
  return tweets.data;
}
```

**Cost:** Free tier (500K tweets/month), Pro $100/month

#### Reddit API
```typescript
// Required: Reddit App Credentials
import snoowrap from 'snoowrap';

const reddit = new snoowrap({
  userAgent: 'Shaivra Intelligence Suite',
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN!
});

async function monitorSubreddit(subreddit: string, keywords: string[]) {
  const posts = await reddit.getSubreddit(subreddit).getNew({ limit: 100 });
  return posts.filter(p => keywords.some(k => p.title.includes(k)));
}
```

**Cost:** Free (rate limited: 60 requests/minute)

#### LinkedIn Scraping
```typescript
// Required: Proxies + Selenium (no official API for scraping)
import puppeteer from 'puppeteer';

async function scrapeLinkedIn(companyName: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.linkedin.com/company/${companyName}`);
  // ... scraping logic (requires rotating proxies to avoid bans)
  await browser.close();
}
```

**Cost:** Proxies ~$50-200/month

**Priority:** 🔴 P0 - Critical for real-time intelligence

---

### 2. OSINT Tool Orchestration

**Gap:** No integration with command-line OSINT tools

**Current State:**
- Endpoints exist (`/api/osint/maltego`) but return mocks
- No CLI tool orchestration

**Missing Tools:**

#### Sherlock (Username Search)
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function runSherlock(username: string) {
  try {
    const { stdout } = await execAsync(`sherlock ${username} --json`);
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Sherlock failed: ${error}`);
  }
}
```

**Installation:**
```bash
pip3 install sherlock-project
```

#### TheHarvester (Email Enumeration)
```typescript
async function runTheHarvester(domain: string) {
  const { stdout } = await execAsync(
    `theHarvester -d ${domain} -b all -f /tmp/harvest_${domain}.json`
  );
  const results = JSON.parse(fs.readFileSync(`/tmp/harvest_${domain}.json`, 'utf-8'));
  return results;
}
```

**Installation:**
```bash
pip3 install theharvester
```

#### SpiderFoot (Automated OSINT)
```typescript
// SpiderFoot has API mode
async function runSpiderFoot(target: string) {
  const response = await fetch('http://localhost:5001/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanname: `scan_${Date.now()}`,
      scantarget: target,
      modules: ['sfp_dnsresolve', 'sfp_shodanapi', 'sfp_whois']
    })
  });
  return response.json();
}
```

**Installation:**
```bash
git clone https://github.com/smicallef/spiderfoot.git
cd spiderfoot && pip3 install -r requirements.txt
python3 sf.py -l 127.0.0.1:5001
```

**Priority:** 🟠 P1 - High value for deep reconnaissance

---

### 3. Document Intelligence

**Gap:** No file parsing for campaign analysis

**Current State:**
- Upload UI exists in `/portal/campaign-analysis`
- `portalApi.uploadCampaignFile()` returns mock
- No backend file handling

**What's Missing:**

#### PDF Parsing
```typescript
import pdf from 'pdf-parse';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

app.post("/api/campaign/upload", upload.single('file'), async (req, res) => {
  const file = req.file!;

  // Upload to S3
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: `campaigns/${file.originalname}`,
    Body: file.buffer
  }));

  // Parse PDF
  const data = await pdf(file.buffer);
  const text = data.text;

  // Chunk for processing
  const chunks = chunkText(text, 2000);

  // Analyze with Gemini
  const analysis = await analyzeChunks(chunks);

  res.json({ analysis_id: '...', text, analysis });
});
```

**Required Libraries:**
```bash
npm install pdf-parse mammoth @aws-sdk/client-s3 multer
```

**Priority:** 🟠 P1 - High for campaign analysis

---

### 4. Network Reconnaissance

**Gap:** Limited to LLM-based fingerprinting

**Current State:**
- `GET /api/osint/fingerprint` uses Gemini AI to guess tech stack
- No real DNS queries, port scans, or certificate analysis

**What's Missing:**

#### DNS Enumeration
```typescript
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolve4 = promisify(dns.resolve4);

async function enumerateDNS(domain: string) {
  const [mx, ns, a] = await Promise.all([
    resolveMx(domain).catch(() => []),
    resolveNs(domain).catch(() => []),
    resolve4(domain).catch(() => [])
  ]);

  return { mx, ns, a, domain };
}
```

#### SSL/TLS Certificate Analysis
```typescript
import https from 'https';

async function getCertificate(hostname: string) {
  return new Promise((resolve, reject) => {
    const options = { hostname, port: 443, rejectUnauthorized: false };
    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      resolve({
        issuer: cert.issuer,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        subject: cert.subject,
        subjectaltname: cert.subjectaltname
      });
    });
    req.on('error', reject);
    req.end();
  });
}
```

**Priority:** 🟠 P1 - High for infrastructure analysis

---

### 5. Dark Web Monitoring

**Gap:** No dark web monitoring capabilities

**Current State:** Not implemented

**What's Missing:**

#### Tor Proxy Configuration
```typescript
import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch from 'node-fetch';

const agent = new SocksProxyAgent('socks5h://127.0.0.1:9050');

async function fetchOnion(url: string) {
  const response = await fetch(url, { agent });
  return response.text();
}
```

**Setup:**
```bash
# Install Tor
brew install tor  # macOS
sudo apt install tor  # Ubuntu

# Start Tor proxy
tor
# Proxy runs on localhost:9050
```

#### Paste Site Monitoring
```typescript
async function monitorPastebinForKeywords(keywords: string[]) {
  const response = await fetch('https://pastebin.com/api_scraping.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api_dev_key=${process.env.PASTEBIN_API_KEY}&api_option=trends`
  });
  const pastes = await response.json();

  return pastes.filter((p: any) =>
    keywords.some(k => p.title.includes(k) || p.snippet.includes(k))
  );
}
```

**Priority:** 🟡 P2 - Medium (requires legal/ethical review)

---

### 6. Entity Resolution & Deduplication

**Gap:** No entity normalization or alias detection

**Current State:**
- Master graph stores duplicate entities (e.g., "John Doe", "J. Doe", "JDoe")
- No name normalization

**What's Missing:**

#### Fuzzy Matching
```typescript
import { distance } from 'fastest-levenshtein';

function findSimilarEntities(name: string, existingEntities: string[], threshold = 0.8) {
  return existingEntities.filter(existing => {
    const similarity = 1 - (distance(name.toLowerCase(), existing.toLowerCase()) / Math.max(name.length, existing.length));
    return similarity > threshold;
  });
}

// Example
const newName = "John Doe";
const existing = ["John A. Doe", "J. Doe", "Jane Doe"];
const matches = findSimilarEntities(newName, existing);
// Returns: ["John A. Doe", "J. Doe"]
```

#### Company Name Normalization
```typescript
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|corporation|llc|ltd|limited|co|company)\b/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Example
normalizeCompanyName("Acme Corporation, Inc.")
// Returns: "acme"
```

**Priority:** 🟡 P2 - Medium but critical for data quality

---

### 7. Temporal Analysis & Trend Detection

**Gap:** No time series analysis or anomaly detection

**Current State:**
- Trends page UI exists
- No backend time series database
- No statistical analysis

**What's Missing:**

#### Time Series Storage (InfluxDB)
```typescript
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const influx = new InfluxDB({ url: process.env.INFLUX_URL!, token: process.env.INFLUX_TOKEN! });
const writeApi = influx.getWriteApi('shaivra', 'intelligence');

// Store metric
function recordMetric(measurement: string, value: number, tags: Record<string, string>) {
  const point = new Point(measurement)
    .tag('source', tags.source)
    .floatField('value', value)
    .timestamp(new Date());
  writeApi.writePoint(point);
}

// Query trends
async function getTrend(measurement: string, timeRange: string) {
  const queryApi = influx.getQueryApi('shaivra');
  const query = `
    from(bucket: "intelligence")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
  `;
  return queryApi.collectRows(query);
}
```

#### Anomaly Detection (Z-Score)
```typescript
function detectAnomalies(values: number[], threshold = 3): number[] {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

  return values.map((v, i) => {
    const zScore = Math.abs((v - mean) / std);
    return zScore > threshold ? i : -1;
  }).filter(i => i !== -1);
}

// Example
const dailyCounts = [100, 105, 98, 102, 500, 99]; // Day 4 is anomaly
const anomalies = detectAnomalies(dailyCounts);
// Returns: [4]
```

**Priority:** 🟠 P1 - High for strategic intelligence

---

## 🟢 RECOMMENDED FIXES IN PRIORITY ORDER

### Phase 1: Security Hardening (P0 - 1 week)
1. ✅ Remove hardcoded credentials
2. ✅ Remove Gemini API key from client bundle
3. ✅ Add input validation (Zod) to all endpoints
4. ✅ Add rate limiting (express-rate-limit)
5. ✅ Add CSRF protection (csurf)
6. ✅ Add JWT session management
7. ✅ Configure HTTPS redirect

### Phase 2: Storage & Auth (P0 - 1 week)
8. ✅ Set up Supabase (PostgreSQL + Auth)
9. ✅ Migrate in-memory data to database
10. ✅ Set up Redis for caching
11. ✅ Set up S3 for file storage
12. ✅ Add database migrations (Prisma/Drizzle)

### Phase 3: OSINT Integration (P1 - 2 weeks)
13. ✅ Configure Shodan API key
14. ✅ Configure AlienVault API key
15. ✅ Configure VirusTotal API key
16. ✅ Integrate Twitter API v2
17. ✅ Integrate Reddit API
18. ✅ Add Sherlock CLI integration
19. ✅ Add TheHarvester CLI integration

### Phase 4: Document Processing (P1 - 1 week)
20. ✅ Add PDF parsing (pdf-parse)
21. ✅ Add DOCX parsing (mammoth)
22. ✅ Add file upload endpoint with S3
23. ✅ Add chunking strategy for large documents

### Phase 5: Advanced Analysis (P2 - 2 weeks)
24. ✅ Add InfluxDB for time series
25. ✅ Implement anomaly detection
26. ✅ Add entity resolution and deduplication
27. ✅ Add network reconnaissance (DNS, SSL)
28. ✅ Add RSS feed parser

### Phase 6: Testing & Monitoring (P2 - 1 week)
29. ✅ Add unit tests (Vitest) - 80%+ coverage
30. ✅ Add integration tests (Supertest)
31. ✅ Add E2E tests (Playwright)
32. ✅ Add monitoring (Sentry)
33. ✅ Add audit logging

**Total Timeline:** 8 weeks to production-ready

---

## 📋 IMMEDIATE ACTION ITEMS

### Week 1: Security Lockdown
- [ ] Delete hardcoded credentials from codebase
- [ ] Remove Gemini API key from Vite config
- [ ] Add Zod validation to top 10 endpoints
- [ ] Add rate limiting to all `/api/*` routes
- [ ] Add CSRF tokens to state-changing endpoints
- [ ] Set up Supabase project

### Week 2: Storage Migration
- [ ] Design PostgreSQL schema (users, projects, reports, clips, jobs)
- [ ] Set up Prisma ORM
- [ ] Migrate `projects[]` → PostgreSQL
- [ ] Migrate `searchHistory[]` → PostgreSQL
- [ ] Migrate `clips[]` → PostgreSQL
- [ ] Set up Redis for session storage

### Week 3: OSINT Phase 1
- [ ] Purchase API keys (Shodan, AlienVault, VirusTotal)
- [ ] Implement real API clients with error handling
- [ ] Add fallback logic when APIs are down
- [ ] Test with rate limiting
- [ ] Document API costs in README

---

## 🎯 SUCCESS METRICS

**Security:**
- ✅ Zero hardcoded credentials
- ✅ Zero exposed API keys
- ✅ All endpoints have input validation
- ✅ All state-changing endpoints have CSRF protection
- ✅ Rate limiting on all public endpoints

**OSINT:**
- ✅ 3+ real OSINT APIs integrated (Shodan, AlienVault, VirusTotal)
- ✅ 2+ social media APIs integrated (Twitter, Reddit)
- ✅ 3+ CLI tools integrated (Sherlock, TheHarvester, SpiderFoot)
- ✅ File upload and parsing working for PDF/DOCX

**Production Readiness:**
- ✅ Data persists across server restarts
- ✅ Authentication with JWT and session management
- ✅ 80%+ test coverage
- ✅ Monitoring and alerting configured
- ✅ Security audit completed

---

**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Next Review:** After Phase 1 completion
