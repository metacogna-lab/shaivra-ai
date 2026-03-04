---
name: shaivra-security-first-architecture
description: Security-first backend architecture patterns for intelligence platforms
version: 1.0.0
source: codebase-analysis
framework: Express + React + TypeScript
stack: Supabase Auth, Zod Validation, Helmet, Rate Limiting
---

# Shaivra Intelligence Suite - Architectural Patterns

This skill documents the security-first architectural patterns established in the Shaivra Intelligence Suite, a boutique private intelligence platform. These patterns prioritize security, scalability, and maintainability.

## Core Principles

### 1. Security-First Architecture

**CRITICAL**: All endpoints follow the "defense in depth" pattern:

```typescript
// PATTERN: Layered security for API endpoints
app.post("/api/endpoint",
  authenticate,           // Layer 1: JWT authentication
  authorize(['analyst']), // Layer 2: Role-based access
  rateLimiter,           // Layer 3: Rate limiting
  validateBody(schema),  // Layer 4: Input validation
  async (req, res) => {
    // Layer 5: Business logic
  }
);
```

**Apply this pattern to:**
- All state-changing operations (POST, PATCH, DELETE)
- All AI endpoints (prevent API cost attacks)
- All data retrieval endpoints (prevent scraping)

### 2. Input Validation with Zod

**NEVER** trust user input. Always validate with Zod schemas:

```typescript
// PATTERN: Define schema in src/server/validation/schemas.ts
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query too long'),
  traceId: z.string().uuid().optional(),
});

// PATTERN: Apply validation middleware
app.post("/api/search",
  authenticate,
  validateBody(searchSchema),
  async (req, res) => {
    // req.body is now validated and type-safe
  }
);
```

### 3. Rate Limiting Strategy

Different endpoints require different rate limits:

```typescript
// PATTERN: Tiered rate limiting
globalLimiter      // 100 req/15min  - All API routes
authLimiter        // 5 req/15min    - Login/register (prevent brute force)
aiLimiter          // 10 req/min     - AI endpoints (prevent cost attacks)
searchLimiter      // 30 req/min     - Search endpoints
uploadLimiter      // 10 req/hour    - File uploads
```

**Apply multiple limiters when needed:**

```typescript
app.post("/api/search",
  searchLimiter,    // More permissive for search
  aiLimiter,        // Stricter for AI cost control
  // ...
);
```

## Project Structure

### Backend Organization

```
src/server/
├── auth/
│   └── supabaseAuth.ts          # Authentication logic (JWT, Supabase)
├── middleware/
│   ├── authenticate.ts          # JWT validation
│   ├── authorize.ts             # Role-based access control
│   ├── validate.ts              # Zod validation wrapper
│   ├── rateLimiting.ts          # All rate limiters
│   ├── security.ts              # Helmet configuration
│   └── csrf.ts                  # CSRF protection
└── validation/
    └── schemas.ts               # All Zod schemas
```

**PATTERN: One file per concern**
- Authentication logic: `auth/`
- Middleware: `middleware/`
- Validation schemas: `validation/`

### Frontend Organization

```
src/
├── components/
│   ├── portal/                  # Portal-specific components
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── PortalLayout.tsx     # Portal layout wrapper
│   │   └── ...
│   └── ui/                      # Reusable UI components
├── pages/
│   └── portal/                  # Portal page views
├── services/
│   ├── portalApi.ts             # API client
│   ├── osintAggregator.ts       # OSINT integration
│   └── ...
├── types.ts                     # Landing page types
├── portalTypes.ts               # Portal types
└── constants.ts                 # Application constants
```

**PATTERN: Separation by domain**
- Portal features: `portal/`
- Public landing: root level
- Shared UI: `ui/`

## Authentication & Authorization

### Authentication Flow

```typescript
// PATTERN: Supabase Auth + JWT
// 1. User logs in via Supabase
const { user, session } = await authenticateUser(email, password);

// 2. Generate custom JWT for API
const token = generateToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});

// 3. Return both to client
res.json({ token, user, session });
```

**Why both Supabase session AND custom JWT?**
- Supabase session: For realtime subscriptions, storage, database RLS
- Custom JWT: For Express API authentication (faster, more flexible)

### Authorization Roles

```typescript
// PATTERN: Hierarchical roles
type Role = 'viewer' | 'analyst' | 'admin';

const roleHierarchy = {
  viewer: 1,   // Read-only access
  analyst: 2,  // Can create/edit own content
  admin: 3,    // Full access
};
```

**Shorthand middleware:**
```typescript
adminOnly           // Exact match: only admins
analystOrHigher     // Hierarchical: analyst + admin
anyAuthenticated    // Any authenticated user
```

## Middleware Patterns

### 1. Validation Middleware

```typescript
// PATTERN: Factory function for reusable validation
export function validate(
  schema: z.ZodSchema,
  location: 'body' | 'query' | 'params' = 'body'
) {
  return (req, res, next) => {
    try {
      req[location] = schema.parse(req[location]);
      next();
    } catch (error) {
      // Return 400 with validation errors
    }
  };
}

// Usage
app.post("/api/search", validateBody(searchSchema), ...);
app.get("/api/users/:id", validateParams(idSchema), ...);
```

### 2. Error Handling

```typescript
// PATTERN: Structured error responses
{
  "error": "Validation failed",
  "details": [
    {
      "field": "query",
      "message": "Query too long (max 500 characters)"
    }
  ]
}
```

**Always include:**
- `error`: High-level error type
- `message` or `details`: User-friendly explanation

### 3. Security Headers

```typescript
// PATTERN: Environment-specific CSP
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://generativelanguage.googleapis.com", // Gemini AI
        "https://*.supabase.co",                     // Supabase
      ],
      // ... more restrictive in production
    },
  },
});

// Apply early in middleware chain
app.use(NODE_ENV === 'production' ? securityHeaders : devSecurityHeaders);
```

## API Design Patterns

### 1. AI Endpoint Pattern

```typescript
// PATTERN: AI endpoints with security
app.post("/api/ai-operation",
  authenticate,               // Required
  aiLimiter,                 // 10 req/min
  validateBody(schema),      // Validate input
  async (req, res) => {
    try {
      // Always check for API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "AI service not configured"
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: req.body.query,
        config: {
          responseMimeType: "application/json" // Structured output
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error('[AI] Error:', error.message);
      res.status(500).json({
        error: "AI request failed",
        message: error.message
      });
    }
  }
);
```

### 2. OSINT Integration Pattern

```typescript
// PATTERN: Fallback to mock when API unavailable
const fetchShodanData = async (ip: string) => {
  if (!process.env.SHODAN_API_KEY) {
    console.warn('[SHODAN] API key not configured, using mock');
    return generateMockShodanData(ip);
  }

  try {
    const response = await fetch(
      `https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('[SHODAN] API error:', error);
    return generateMockShodanData(ip); // Graceful degradation
  }
};
```

## Security Checklist

Before deploying ANY new endpoint:

- [ ] Authentication required? (`authenticate` middleware)
- [ ] Role restrictions? (`authorize` middleware)
- [ ] Rate limiting applied? (choose appropriate limiter)
- [ ] Input validated? (`validateBody/Query/Params`)
- [ ] Error messages safe? (no sensitive data leaked)
- [ ] API keys server-side only? (NEVER in client bundle)
- [ ] CSRF token required? (for state-changing operations)
- [ ] Logging includes user ID? (for audit trail)

## Environment Variables

### Required Variables

```bash
# CRITICAL - Required for auth
SUPABASE_URL=
SUPABASE_ANON_KEY=
JWT_SECRET=                    # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRITICAL - Required for core functionality
GEMINI_API_KEY=
```

### Optional Variables

```bash
# OSINT APIs (fallback to mocks if missing)
SHODAN_API_KEY=
VIRUSTOTAL_API_KEY=
ALIENVAULT_API_KEY=

# Rate limiting
RATE_LIMIT_WHITELIST=          # Comma-separated IPs
```

**PATTERN: Fail gracefully when optional APIs missing**

## Testing Patterns

### Validation Schema Testing

```typescript
// PATTERN: Test validation schemas separately
describe('searchSchema', () => {
  it('accepts valid input', () => {
    const result = searchSchema.parse({
      query: 'test query',
      traceId: '550e8400-e29b-41d4-a716-446655440000'
    });
    expect(result.query).toBe('test query');
  });

  it('rejects query over 500 chars', () => {
    expect(() => {
      searchSchema.parse({ query: 'a'.repeat(501) });
    }).toThrow('Query too long');
  });
});
```

### Middleware Testing

```typescript
// PATTERN: Test middleware in isolation
describe('authenticate middleware', () => {
  it('rejects missing token', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn(), json: jest.fn() };

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

## Common Pitfalls

### ❌ DON'T: Expose API keys in Vite config

```typescript
// WRONG - Exposes API key in client bundle
export default defineConfig({
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  }
});
```

### ✅ DO: Keep API keys server-side

```typescript
// CORRECT - API key stays on server
// No define block in vite.config.ts
// API calls go through Express endpoints
```

### ❌ DON'T: Skip validation

```typescript
// WRONG - No validation
app.post("/api/search", async (req, res) => {
  const { query } = req.body; // Could be anything!
});
```

### ✅ DO: Validate all inputs

```typescript
// CORRECT - Validated input
app.post("/api/search",
  validateBody(searchSchema),
  async (req, res) => {
    const { query } = req.body; // Type-safe and validated
  }
);
```

### ❌ DON'T: Hardcode credentials

```typescript
// WRONG
if (username === 'admin' && password === 'Password123!') {
  // ...
}
```

### ✅ DO: Use Supabase/Auth service

```typescript
// CORRECT
const { user, session } = await authenticateUser(email, password);
```

## When to Use This Pattern

**Use this security-first architecture when:**
- Building intelligence platforms with sensitive data
- Handling OSINT data aggregation
- Integrating paid APIs (AI, OSINT tools)
- Multi-tenant applications with role-based access
- Applications requiring audit trails
- High-security environments (defense, finance, research)

**Key indicators:**
- Need to prevent API cost attacks
- Need to prevent data scraping
- Need role-based access control
- Need compliance (audit logs, data protection)
- Integrating multiple external APIs

## Related Patterns

- **everything-claude-code:security-review** - Security audit workflow
- **everything-claude-code:api-design** - REST API design patterns
- **everything-claude-code:testing** - TDD workflow with security tests
- **everything-claude-code:backend-patterns** - Express.js best practices

---

*Generated from Shaivra Intelligence Suite codebase analysis*
*Version: 1.0.0 - March 2026*
