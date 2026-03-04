# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shaivra Intelligence Suite** is a boutique private intelligence platform for OSINT aggregation, threat analysis, and strategic report generation. Built with React 19, TypeScript, Express, and Google Gemini AI.

**Status:** Alpha - functional demo with mock data. NOT production-ready without storage, authentication, and security hardening.

## Commands

```bash
# Development (runs on http://localhost:3000)
npm run dev         # Start Express server with Vite middleware (tsx server.ts)

# Production Build
npm run build       # Vite build to dist/
npm run preview     # Preview production build

# Type Checking
npm run lint        # Run TypeScript compiler without emitting files
```

**Note:** Always use `bun` as the package manager per user's global instructions:
```bash
bun install         # Install dependencies
bun run dev         # Start dev server
bun run build       # Production build
bun run lint        # Type checking
```

## Environment Variables

Required in `.env` file:
```bash
GEMINI_API_KEY=              # Google Gemini AI (REQUIRED for core functionality)
SHODAN_API_KEY=              # Shodan.io (optional, falls back to mock)
ALIENVAULT_API_KEY=          # AlienVault OTX (optional)
VIRUSTOTAL_API_KEY=          # VirusTotal (optional)
LANGSMITH_API_KEY=           # LangSmith tracing (optional)
```

## Architecture

### Dual-Mode Application

1. **Landing Mode** (`/`): Public marketing site with animated demos
   - Components: `Hero.tsx`, `Navigation.tsx`, `ProductShowcase.tsx`, `KnowledgeGraphExplorer.tsx`
   - Fully functional with demo data, production-ready visuals

2. **Portal Mode** (`/portal/*`): Authenticated intelligence workspace
   - Routes: Dashboard, Lens, Forge, Shield, Analytics, Reports, etc.
   - Uses mock authentication (hardcoded credentials: `shaivra-ai` / `ShaivraAdmin345%`)

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main router - splits landing vs. portal routes |
| `server.ts` | Express backend with 24+ API endpoints (1131 lines) |
| `src/services/portalApi.ts` | Frontend API client with mock fallbacks (1074 lines) |
| `src/types.ts` | Landing page types (GraphNode, Campaign, etc.) |
| `src/portalTypes.ts` | Portal types (comprehensive pipeline schemas) |

### Intelligence Pipeline (Lens)

The core pipeline processes OSINT data through 6 stages:

```
Public Source Selection → Ingestion → Normalization →
Enrichment → Entity Extraction → OSINT Tool Enrichment →
Knowledge Graph Update → Strategic Report → Human Audit
```

**Implementation Status:**
- ✅ UI complete (`src/pages/portal/Lens.tsx`)
- ✅ Backend endpoints exist
- ⚠️ Real integrations missing (Twitter API, Reddit API, etc.)
- ⚠️ Uses Google Gemini for synthesis (works), OSINT tools return mocks

### Agent Network System

Located in `server.ts` (lines 64-120). Recursive intelligence gathering:

```javascript
while (certainty < 80% && iterations < 5) {
  1. Query Gemini AI with current data
  2. Quantitative analysis
  3. Compare against master graph
  4. Attribute likelihood scores
  5. Update certainty
}
```

**Used by:**
- `POST /api/report` - Strategic report generation
- `POST /api/search/filtered` - Filtered web search
- `POST /api/org/profile` - Organization profiling

### Storage Architecture

**Current:** All data stored in-memory (server.ts):
```javascript
let masterGraph: any = { nodes: [], links: [], metadata: {} };
let dailyReports: any[] = [];
let weeklyReports: any[] = [];
let projects: any[] = [];
// ... etc. Data lost on server restart!
```

**Required for Production:**
- PostgreSQL/MongoDB for relational data (projects, users, reports)
- Neo4j/Neptune for master graph
- Redis for caching and sessions
- S3 for uploaded files and report storage

## Critical Security Issues

### 🔴 Hardcoded Credentials
**Location:** `src/services/portalApi.ts` (lines 33-40), `server.ts` (lines 1118-1119)
```javascript
const ADMIN_USER = 'shaivra-ai';
const ADMIN_PASS = 'ShaivraAdmin345%';
```
**Fix:** Remove immediately. Replace with Supabase/Auth0/Clerk.

### 🔴 No Input Validation
**Problem:** All endpoints in `server.ts` accept raw `req.body` without validation
**Fix:** Add Zod schemas for all request bodies:
```typescript
import { z } from 'zod';
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  traceId: z.string().uuid().optional()
});
```

### 🔴 No Rate Limiting
**Problem:** Vulnerable to DDoS and API abuse
**Fix:** Add `express-rate-limit`:
```typescript
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### 🔴 No CSRF Protection
**Fix:** Add `csurf` middleware for state-changing endpoints

### 🔴 API Keys Exposed Client-Side
**Location:** `vite.config.ts` (lines 14-15)
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```
**Problem:** Gemini API key embedded in client bundle
**Fix:** Remove from Vite define. Proxy all AI calls through backend.

### 🔴 No SQL Injection Protection
**Status:** Not currently vulnerable (no DB), but will be once PostgreSQL is added
**Fix:** Use parameterized queries only. Never concatenate user input.

## Disconnected API Endpoints

### Endpoints That Exist But Return Mocks

| Endpoint | Status | What's Missing |
|----------|--------|----------------|
| `GET /api/osint/shodan` | 🟡 Mock fallback | Requires `SHODAN_API_KEY` |
| `GET /api/osint/alienvault` | 🟡 Mock fallback | Requires `ALIENVAULT_API_KEY` |
| `GET /api/osint/virustotal` | 🟡 Mock fallback | Requires `VIRUSTOTAL_API_KEY` |
| `POST /api/osint/maltego` | ❌ Mock only | No Maltego integration |
| `GET /api/rss` | ❌ Mock data | No RSS parser library |
| `POST /api/ingestion/advanced` | 🟡 Partial | No real source integrations |
| `GET /api/admin/reports/daily` | ❌ Empty history | No persistent storage |
| `GET /api/admin/reports/weekly` | ❌ Mock | No historical data |
| `POST /api/forge/analyze` | ✅ Works | Relies on Gemini AI |
| `POST /api/agent/investigate` | ✅ Works | Relies on Gemini AI |

### Frontend Pages Without Full Backend

| Page | Status | Missing |
|------|--------|---------|
| `/portal/trends` | 🟡 UI only | Historical trend data, time series analysis |
| `/portal/org-profiler` | 🟡 Partial | Full UI implementation, profile editing |
| `/portal/user-analytics` | ❌ Placeholder | All functionality |
| `/portal/governance` | ❌ Placeholder | All functionality |
| `/portal/observability` | ❌ Placeholder | Tracing dashboard, health metrics |

## OSINT Capability Gaps

### 1. Real-Time Social Media Monitoring

**Current State:** Mock implementations only

**Missing Integrations:**
- **Twitter/X API v2:** No bearer token configuration
- **Reddit API:** No OAuth flow, no subreddit monitoring
- **LinkedIn:** No scraping infrastructure (requires proxies/Selenium)
- **GitHub API:** No GraphQL queries, no repository monitoring

**Fix Priority:** 🔴 P0 - Critical for core functionality

**Implementation Steps:**
1. Configure API credentials in `.env`
2. Add OAuth flows for Reddit/LinkedIn
3. Implement rate-limited API clients
4. Add error handling for API quota limits
5. Store raw data in persistent storage

### 2. OSINT Tool Orchestration

**Current State:** Individual tool endpoints exist but return mocks

**Missing Tools:**
- Sherlock (username search across platforms)
- TheHarvester (email/domain enumeration)
- SpiderFoot (automated OSINT)
- Recon-ng (reconnaissance framework)
- FOCA (metadata extraction)
- Sublist3r (subdomain enumeration)

**Fix Priority:** 🟠 P1 - High value for threat intelligence

**Implementation:**
```typescript
// Example: Sherlock integration
import { exec } from 'child_process';

async function runSherlock(username: string): Promise<SherlockResult> {
  return new Promise((resolve, reject) => {
    exec(`sherlock ${username} --json`, (error, stdout) => {
      if (error) reject(error);
      resolve(JSON.parse(stdout));
    });
  });
}
```

### 3. Dark Web Monitoring

**Current State:** No implementation

**Missing:**
- Tor proxy configuration
- .onion domain monitoring
- Paste site aggregation (Pastebin, PasteBin alternatives)
- Underground forum monitoring
- Breach database integration (HaveIBeenPwned API)

**Fix Priority:** 🟡 P2 - Medium (requires legal/ethical review)

### 4. Document Intelligence

**Current State:** Campaign analysis UI exists but no file processing

**Missing:**
- PDF parsing (pdf-parse, pdfjs-dist)
- DOCX parsing (mammoth)
- OCR for scanned documents (Tesseract.js)
- Metadata extraction
- S3/Azure Blob Storage integration

**Fix Priority:** 🟠 P1 - High for campaign analysis

### 5. Network Reconnaissance

**Current State:** Website fingerprinting via Gemini AI (functional but limited)

**Missing:**
- DNS enumeration (actual queries, not LLM guesses)
- Port scanning (nmap integration - requires caution)
- SSL/TLS certificate analysis
- WHOIS data enrichment
- ASN/BGP routing analysis
- IP geolocation accuracy

**Fix Priority:** 🟠 P1 - High for infrastructure analysis

### 6. Entity Resolution & Deduplication

**Current State:** No implementation

**Missing:**
- Fuzzy name matching (fuzzywuzzy, Levenshtein distance)
- Entity linking across sources
- Alias detection (John Doe vs. J. Doe vs. JDoe)
- Company name normalization (Acme Corp vs. ACME CORPORATION)
- Address parsing and normalization

**Fix Priority:** 🟡 P2 - Medium but critical for data quality

### 7. Temporal Analysis

**Current State:** Trends page UI exists, no time series backend

**Missing:**
- Time series database (InfluxDB, TimescaleDB)
- Trend detection algorithms (linear regression, ARIMA)
- Anomaly detection (Isolation Forest, Z-score)
- Velocity scoring (rate of change calculations)
- Historical comparison ("this week vs. last week")

**Fix Priority:** 🟠 P1 - High for strategic intelligence

## Google Gemini AI Usage

**Status:** ✅ Production-ready

**Model:** `gemini-2.0-flash-exp`

**Endpoints Using Gemini:**
- `POST /api/search` - Web search with grounding ✅
- `POST /api/summarize` - Intelligence synthesis ✅
- `POST /api/report` - Strategic reports ✅
- `POST /api/analytics/summary` - Multi-domain analysis ✅
- `POST /api/osint/fingerprint` - Website fingerprinting ✅
- `POST /api/forge/analyze` - Scenario analysis ✅
- `POST /api/bot/start` - Autonomous bot ✅
- `POST /api/org/profile` - Organization profiling ✅

**Best Practices:**
1. Always use `responseMimeType: "application/json"` for structured output
2. Truncate large data to avoid token limits (see line 83: `.substring(0, 2000)`)
3. Wrap in try-catch, return user-friendly errors
4. Extract grounding sources from `groundingMetadata`

## Knowledge Graph Visualization

**File:** `src/components/KnowledgeGraphExplorer.tsx`

**Technology:** D3.js force-directed graph

**Performance Note:** Current implementation handles <100 nodes efficiently. For 10K+ nodes:
1. Use Web Workers for physics simulation
2. Implement level-of-detail rendering (aggregate distant clusters)
3. Add virtualization (only render visible nodes)
4. Consider switching to WebGL (e.g., sigma.js, ForceGraph3D)

## Testing Strategy

**Current State:** ❌ No tests

**Required:**
1. **Unit Tests** (Vitest recommended):
   - `src/services/*.ts` - API clients
   - `src/lib/riskHeuristics.ts` - Risk scoring logic
   - `src/services/osintAggregator.ts` - Data normalization

2. **Integration Tests** (Supertest):
   - All `/api/*` endpoints in `server.ts`
   - Mock Gemini AI responses with fixtures

3. **E2E Tests** (Playwright):
   - Landing page navigation
   - Portal authentication flow
   - Lens pipeline execution
   - Knowledge graph interaction

**Test Command (once configured):**
```bash
bun test              # Run all tests
bun test:watch        # Watch mode
bun test:coverage     # Generate coverage report (target: 80%+)
```

## Common Development Patterns

### Adding a New API Endpoint

1. **Backend** (`server.ts`):
```typescript
app.post("/api/new-endpoint", async (req, res) => {
  const { param } = req.body;

  // Add validation
  if (!param) return res.status(400).json({ error: "param required" });

  try {
    // Call Gemini or process data
    const result = await processData(param);
    res.json(result);
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

2. **Frontend API Client** (`src/services/portalApi.ts`):
```typescript
export const portalApi = {
  // ...
  newEndpoint: async (param: string) => {
    const response = await fetch('/api/new-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ param })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }
};
```

3. **Type Definitions** (`src/portalTypes.ts`):
```typescript
export interface NewEndpointResult {
  data: any;
  meta: {
    trace_id: string;
    timestamp: string;
  };
}
```

### Adding a New Portal Page

1. Create `src/pages/portal/NewPage.tsx`
2. Add route in `App.tsx`:
```typescript
<Route path="new-page" element={<NewPage />} />
```
3. Add navigation link in `src/components/portal/PortalLayout.tsx`

## Deployment Considerations

**NOT READY FOR PRODUCTION** until:

1. ✅ **Storage:** PostgreSQL + Neo4j + Redis + S3 configured
2. ✅ **Authentication:** Supabase/Auth0 replacing mock system
3. ✅ **Security:** Input validation, rate limiting, CSRF, HTTPS
4. ✅ **OSINT APIs:** Real credentials configured
5. ✅ **Monitoring:** Sentry/DataDog for error tracking
6. ✅ **Tests:** 80%+ coverage

**Recommended Stack:**
- Hosting: Railway, Render, or Vercel (frontend) + Railway (backend)
- Database: Supabase (PostgreSQL + Auth) or Neon + Clerk
- Graph DB: Neo4j Aura or AWS Neptune
- Cache: Upstash Redis
- Storage: AWS S3 or Cloudflare R2
- Monitoring: Sentry + Vercel Analytics

## Known Issues

1. **Large Files:** `server.ts` (1131 lines), `portalApi.ts` (1074 lines) need refactoring
2. **Memory Leaks:** In-memory storage grows unbounded
3. **Token Limits:** Agent network can hit Gemini API token limits with large graphs
4. **No Pagination:** Search results, history, reports are unbounded
5. **No WebSocket:** Dashboard uses polling, should use real-time updates
6. **D3 Performance:** Knowledge graph slows down >500 nodes
7. **Error UX:** Many errors logged to console but not shown to users

## Strategic Principles

The application follows strategic principles in `strategy/core_strategy.md`:
1. Information Dominance via continuous ingestion
2. Strategic Anticipation through predictive modeling
3. Adversarial Resilience with deep threat understanding
4. Network-Centric Intelligence via graph analysis
5. Data Integrity with source legitimacy scoring

**Implementation:** Agent network enforces these via system prompts to Gemini AI.

## Quick Start for New Features

**Before adding features:**
1. Read `src/portalTypes.ts` for existing type system
2. Check `server.ts` for similar endpoints
3. Review `src/services/portalApi.ts` for API patterns
4. Use `bun run dev` and test in browser

**Priority Order:**
1. Fix security issues (P0)
2. Add persistent storage (P0)
3. Integrate real OSINT APIs (P1)
4. Add tests (P1)
5. Refactor large files (P2)
6. Add WebSocket real-time updates (P2)

## Production Readiness Checklist

- [ ] Remove hardcoded credentials
- [ ] Configure Supabase or Auth0
- [ ] Add PostgreSQL with migrations
- [ ] Add Neo4j for knowledge graph
- [ ] Configure Redis for caching
- [ ] Set up S3 for file storage
- [ ] Add input validation (Zod)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add CSRF protection (csurf)
- [ ] Configure real OSINT API keys
- [ ] Add unit tests (80%+ coverage)
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Add monitoring (Sentry)
- [ ] Add logging (Winston/Pino)
- [ ] Security audit and penetration testing
- [ ] Performance testing (load tests)
- [ ] Documentation (API docs, user guide)

**Estimated Time to Production:** 5-8 weeks with focused development.
