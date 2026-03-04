# Deployment Guide - Railway

This guide covers deploying Shaivra Intelligence Suite to Railway with PostgreSQL, Redis, and Neo4j.

## Railway Setup

### Prerequisites

1. Railway account: https://railway.app
2. Railway CLI installed: `npm i -g @railway/cli`
3. GitHub repository connected

### Quick Deploy

```bash
# 1. Login to Railway
railway login

# 2. Create new project
railway init

# 3. Link to GitHub repo (optional but recommended)
railway link

# 4. Add PostgreSQL database
railway add --database postgresql

# 5. Add Redis
railway add --database redis

# 6. Deploy
railway up
```

## Database Configuration

### PostgreSQL (Included with Railway)

Railway automatically provisions PostgreSQL and sets the `DATABASE_URL` environment variable.

**After provisioning:**

```bash
# Apply Prisma migrations
railway run npx prisma migrate deploy

# Generate Prisma Client
railway run npx prisma generate
```

### Redis (Included with Railway)

Railway automatically provisions Redis and sets the `REDIS_URL` environment variable.

**No additional setup required** - the app will auto-connect.

### Neo4j (External Service)

Railway doesn't provide Neo4j natively. Use **Neo4j Aura** (free tier available):

1. Create account: https://neo4j.com/cloud/aura/
2. Create free database instance
3. Get connection credentials
4. Add to Railway environment variables:
   - `NEO4J_URI`
   - `NEO4J_USER`
   - `NEO4J_PASSWORD`

## Environment Variables

### Required Variables

Set these in Railway Dashboard → Variables:

```bash
# Google Gemini AI (REQUIRED)
GEMINI_API_KEY=your-gemini-api-key

# Supabase Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# JWT Secret (generate random 256-bit key)
JWT_SECRET=your-random-secret-key

# Neo4j (from Neo4j Aura)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Node Environment
NODE_ENV=production
PORT=3000

# OSINT APIs (Optional)
SHODAN_API_KEY=your-shodan-key
ALIENVAULT_API_KEY=your-alienvault-key
VIRUSTOTAL_API_KEY=your-virustotal-key

# Social Media APIs (Optional)
TWITTER_BEARER_TOKEN=your-twitter-token
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-secret

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

### Auto-Configured Variables

Railway automatically sets these (no action needed):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `RAILWAY_ENVIRONMENT` - Environment name (production/staging)
- `RAILWAY_PROJECT_ID` - Project identifier
- `RAILWAY_SERVICE_ID` - Service identifier

## Deployment Commands

### Using Railway CLI

```bash
# Deploy current branch
railway up

# Deploy specific service
railway up --service backend

# View logs
railway logs

# Open deployed app
railway open

# Run migrations
railway run npx prisma migrate deploy

# Access database shell
railway connect postgres
```

### Using GitHub Integration

1. Push to main branch → Auto-deploys
2. Push to other branches → Creates preview deployment
3. Pull request → Preview URL in PR comment

## Build Configuration

Railway uses the following from `package.json`:

```json
{
  "scripts": {
    "build": "vite build && npx prisma generate",
    "start": "node dist/server.js",
    "railway:migrate": "npx prisma migrate deploy"
  }
}
```

## Post-Deployment Setup

### 1. Apply Database Migrations

```bash
railway run npx prisma migrate deploy
```

### 2. Verify Services

```bash
# Check PostgreSQL
railway run npx prisma db pull

# Check Redis
railway run -- node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log)"

# Check Neo4j (after adding credentials)
# Test from app startup logs
```

### 3. Create Initial Admin User

```bash
# Using Supabase Dashboard
# 1. Go to Authentication → Users
# 2. Create user with email + password
# 3. Set user_metadata.role = "admin"
```

### 4. Test Deployment

```bash
# Get deployment URL
railway open

# Test endpoints
curl https://your-app.railway.app/api/health
curl https://your-app.railway.app/api/csrf-token
```

## Scaling Configuration

### Horizontal Scaling

Railway supports horizontal scaling:

```bash
# Scale to 2 replicas
railway up --replicas 2
```

### Vertical Scaling

Upgrade plan for more resources:
- Hobby: $5/month per service
- Pro: $20/month per service (includes metrics)

### Database Scaling

PostgreSQL automatically scales storage up to plan limits.

For high-traffic scenarios:
1. Enable connection pooling (built-in)
2. Add read replicas (Pro plan)
3. Configure PgBouncer (available on Pro)

## Monitoring

### Railway Dashboard

- Real-time logs
- CPU/Memory usage
- HTTP metrics
- Database connections

### Sentry Integration

```bash
# Add Sentry DSN to environment variables
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Sentry will automatically track:
# - API errors
# - Performance issues
# - Database query performance
```

### Health Check Endpoint

Railway pings `/health` every 30s:

```typescript
// Add to server.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected', // Check Prisma connection
    redis: 'connected',    // Check Redis connection
  });
});
```

## Troubleshooting

### Build Failures

```bash
# View build logs
railway logs --build

# Common issues:
# 1. Missing DATABASE_URL → Add PostgreSQL service
# 2. Prisma generate fails → Check schema.prisma syntax
# 3. TypeScript errors → Run `npm run lint` locally
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run npx prisma db pull

# Check connection pool
# Railway limits: 20 connections (Hobby), 100 (Pro)
```

### Redis Connection Issues

```bash
# Verify REDIS_URL is set
railway variables

# Test connection
railway shell
redis-cli ping
```

## Cost Optimization

### Railway Pricing

- **Starter**: $5/month (includes $5 usage)
- **Hobby**: $5-20/month per service
- **Pro**: $20/month + usage

### Tips to Minimize Costs

1. **Use single service deployment** (combine frontend + backend)
2. **Enable sleep mode** for non-production environments
3. **Optimize database queries** (reduce connection time)
4. **Cache API responses** (reduce Gemini API costs)
5. **Set memory limits** (prevent over-provisioning)

### Expected Monthly Costs

**Minimal Setup:**
- Railway Starter: $5/month
- Neo4j Aura Free: $0
- Supabase Free: $0
- **Total: ~$5/month**

**Production Setup:**
- Railway Pro (2 services): $40/month
- Neo4j Aura Pro: $65/month
- Supabase Pro: $25/month
- **Total: ~$130/month**

## CI/CD Pipeline

### Automatic Deployments

```yaml
# .github/workflows/railway-deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Pre-Deploy Checks

```yaml
# Add before railway up
- name: Run Tests
  run: npm test

- name: Type Check
  run: npm run lint

- name: Security Scan
  run: npm audit --audit-level=moderate
```

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied (`railway run npx prisma migrate deploy`)
- [ ] Admin user created in Supabase
- [ ] HTTPS enabled (automatic with Railway)
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled (Sentry DSN set)
- [ ] Rate limiting configured
- [ ] CORS settings updated for production domain
- [ ] Security headers verified
- [ ] Backup strategy in place (Railway auto-backups PostgreSQL)
- [ ] Neo4j Aura connected and tested
- [ ] Redis connected and tested
- [ ] Health check endpoint responding
- [ ] API endpoints tested with production credentials

## Rollback Strategy

### Rollback to Previous Deployment

```bash
# View deployment history
railway status

# Rollback to specific deployment
railway rollback <deployment-id>

# Or use Railway Dashboard → Deployments → Rollback
```

### Database Rollback

```bash
# Rollback last migration
railway run npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
railway run npx prisma migrate deploy
```

## Support Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Neo4j Aura Support: https://neo4j.com/docs/aura
- Supabase Docs: https://supabase.com/docs

---

**Last Updated:** March 2026
**Platform:** Railway (railway.app)
**Region:** US West (or configured region)
