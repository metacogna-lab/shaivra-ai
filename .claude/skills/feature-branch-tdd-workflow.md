---
name: shaivra-feature-branch-tdd-workflow
description: Feature branch workflow with test-driven development for Shaivra Intelligence Suite
version: 1.0.0
source: user-defined-workflow
workflow_type: git-branching + tdd
---

# Feature Branch + TDD Workflow

This skill documents the mandatory workflow for implementing features in Shaivra Intelligence Suite: **feature branches with test-driven development**.

## Core Workflow

```
1. Create feature branch
2. Write tests (RED)
3. Implement code (GREEN)
4. Run tests (VERIFY)
5. Commit changes
6. Merge to main
```

## Step-by-Step Implementation

### Step 1: Create Feature Branch

**Before starting ANY phase or feature:**

```bash
# PATTERN: Branch naming convention
git checkout -b phase-{N}-{feature-name}

# Examples:
git checkout -b phase-2-postgresql-migration
git checkout -b phase-3-shodan-integration
git checkout -b phase-5-unit-tests
```

**Branch naming rules:**
- Prefix with `phase-{N}` for plan phases
- Use kebab-case for feature names
- Be descriptive but concise
- Examples:
  - `phase-1-security-lockdown`
  - `phase-2-storage-migration`
  - `phase-3-osint-integration`
  - `phase-4-refactoring`
  - `phase-5-testing-monitoring`

### Step 2: Write Tests FIRST (RED)

**CRITICAL**: Always write tests BEFORE implementation.

```typescript
// PATTERN: Test file location
src/server/auth/__tests__/supabaseAuth.test.ts
src/server/middleware/__tests__/authenticate.test.ts
src/server/validation/__tests__/schemas.test.ts
```

**Example: Writing tests first**

```typescript
// File: src/server/middleware/__tests__/authenticate.test.ts
import { describe, it, expect, vi } from 'vitest';
import { authenticate } from '../authenticate';

describe('authenticate middleware', () => {
  it('should reject requests without Authorization header', () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    authenticate(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'Missing or invalid Authorization header'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid JWT tokens', () => {
    // Test case 2...
  });

  it('should accept valid JWT and set req.user', () => {
    // Test case 3...
  });
});
```

**Run tests - they MUST FAIL:**

```bash
bun test src/server/middleware/__tests__/authenticate.test.ts

# Expected output: FAIL (tests are RED)
```

### Step 3: Implement Code (GREEN)

**Now write the minimal code to make tests pass:**

```typescript
// File: src/server/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/supabaseAuth';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}
```

### Step 4: Run Tests (VERIFY)

**Tests MUST pass before committing:**

```bash
# Run specific test file
bun test src/server/middleware/__tests__/authenticate.test.ts

# Expected output: PASS (tests are GREEN)

# Run all tests
bun test

# Check coverage (target: 80%+)
bun test --coverage
```

**Coverage requirements:**
- **Minimum**: 80% coverage
- **Target**: 90%+ for security-critical code
- **Files requiring 100%**: Authentication, authorization, validation

### Step 5: Commit Changes

**Only commit when tests pass:**

```bash
# PATTERN: Commit message format
git add .
git commit -m "type: description

Detailed explanation (optional)

Tests included:
- test description 1
- test description 2

Coverage: X%"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Test additions/updates
- `refactor:` - Code refactoring
- `security:` - Security improvements
- `chore:` - Maintenance tasks

**Example commits:**

```bash
# Example 1: Feature with tests
git commit -m "feat: add JWT authentication middleware

Implements authenticate and optionalAuthenticate middleware
with comprehensive test coverage.

Tests included:
- Rejects missing Authorization header
- Rejects invalid JWT tokens
- Accepts valid JWT and sets req.user
- optionalAuthenticate allows missing tokens

Coverage: 95%"

# Example 2: Security fix
git commit -m "security: remove hardcoded credentials

Replaces hardcoded admin credentials with Supabase auth.
Updates both frontend and backend authentication.

Tests included:
- Authentication flow integration tests
- Login endpoint validation tests

Coverage: 88%"
```

### Step 6: Merge to Main

**After all tests pass:**

```bash
# Switch to main branch
git checkout main

# Merge feature branch (no fast-forward for history)
git merge --no-ff phase-{N}-{feature-name} -m "Merge phase-{N}-{feature-name}"

# Delete feature branch (cleanup)
git branch -d phase-{N}-{feature-name}

# Push to remote
git push origin main
```

**Merge commit message format:**

```
Merge phase-{N}-{feature-name}

Completed: {brief description}

Changes:
- Change 1
- Change 2
- Change 3

Tests: {number} tests added, {coverage}% coverage
```

## Phase Implementation Workflow

**For multi-week phases (like Phase 2: Storage Migration):**

### Option A: Single Feature Branch (Small Phases)

```bash
# Create branch for entire phase
git checkout -b phase-2-storage-migration

# Implement incrementally with test cycles
# Test → Code → Test → Commit (repeat)

# Merge when phase complete
git checkout main
git merge --no-ff phase-2-storage-migration
```

### Option B: Multiple Sub-Branches (Large Phases)

```bash
# Main phase branch
git checkout -b phase-2-storage-migration

# Sub-feature 1: PostgreSQL
git checkout -b phase-2-postgresql
# Write tests → Implement → Test → Commit
git checkout phase-2-storage-migration
git merge --no-ff phase-2-postgresql

# Sub-feature 2: Neo4j
git checkout -b phase-2-neo4j
# Write tests → Implement → Test → Commit
git checkout phase-2-storage-migration
git merge --no-ff phase-2-neo4j

# Sub-feature 3: Redis
git checkout -b phase-2-redis
# Write tests → Implement → Test → Commit
git checkout phase-2-storage-migration
git merge --no-ff phase-2-redis

# Merge complete phase to main
git checkout main
git merge --no-ff phase-2-storage-migration
```

## Test-Driven Development Rules

### Red-Green-Refactor Cycle

```
┌─────────────────────────────────────┐
│  1. RED: Write failing test         │
│  ↓                                   │
│  2. GREEN: Write minimal code       │
│  ↓                                   │
│  3. REFACTOR: Improve code          │
│  ↓                                   │
│  4. VERIFY: Tests still pass        │
│  ↓                                   │
│  5. COMMIT: Save working state      │
└─────────────────────────────────────┘
```

### Test Coverage Requirements

```typescript
// PATTERN: Test organization
describe('Module/Function name', () => {
  // Happy path tests
  it('should handle valid input correctly', () => {});

  // Edge cases
  it('should handle empty input', () => {});
  it('should handle maximum input size', () => {});

  // Error cases
  it('should reject invalid input', () => {});
  it('should handle API failures gracefully', () => {});

  // Security tests
  it('should prevent SQL injection', () => {});
  it('should sanitize HTML input', () => {});
});
```

### Required Test Types

**1. Unit Tests** (80%+ coverage)
```bash
# Location pattern
src/server/module/__tests__/file.test.ts
src/services/__tests__/service.test.ts
```

**2. Integration Tests** (Critical paths)
```bash
# Location pattern
src/__tests__/integration/auth.test.ts
src/__tests__/integration/api-endpoints.test.ts
```

**3. E2E Tests** (User flows)
```bash
# Location pattern
e2e/authentication.spec.ts
e2e/lens-pipeline.spec.ts
```

## Workflow Commands Reference

### Starting a New Phase

```bash
# 1. Create feature branch
git checkout -b phase-{N}-{feature-name}

# 2. Verify you're on the right branch
git branch --show-current

# 3. Start TDD cycle
bun test --watch  # Keep tests running in watch mode
```

### During Development

```bash
# Check test status
bun test

# Check coverage
bun test --coverage

# Run specific test file
bun test path/to/test.test.ts

# Run tests in watch mode
bun test --watch
```

### Before Committing

```bash
# 1. Run all tests
bun test

# 2. Check coverage
bun test --coverage

# 3. Lint code
bun run lint

# 4. Stage changes
git add .

# 5. Commit with descriptive message
git commit -m "type: description"
```

### Merging to Main

```bash
# 1. Switch to main
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Merge feature branch
git merge --no-ff phase-{N}-{feature-name}

# 4. Run tests on main
bun test

# 5. Push to remote
git push origin main

# 6. Delete feature branch
git branch -d phase-{N}-{feature-name}
```

## Workflow Violations

### ❌ DON'T: Commit without tests

```bash
# WRONG - No tests
git add src/server/middleware/authenticate.ts
git commit -m "feat: add authentication middleware"
# Missing: __tests__/authenticate.test.ts
```

### ✅ DO: Commit with tests

```bash
# CORRECT - Tests included
git add src/server/middleware/authenticate.ts
git add src/server/middleware/__tests__/authenticate.test.ts
git commit -m "feat: add authentication middleware

Tests included:
- Rejects missing Authorization header
- Rejects invalid JWT tokens
- Accepts valid JWT and sets req.user

Coverage: 95%"
```

### ❌ DON'T: Write code before tests

```bash
# WRONG - Implementation first
# 1. Write authenticate.ts
# 2. Write tests later (maybe never)
```

### ✅ DO: Write tests first

```bash
# CORRECT - Tests first (TDD)
# 1. Write authenticate.test.ts (tests FAIL - RED)
# 2. Write authenticate.ts (tests PASS - GREEN)
# 3. Refactor code
# 4. Verify tests still pass
```

### ❌ DON'T: Merge failing tests

```bash
# WRONG - Tests failing
bun test
# FAIL: 3 failing tests

git checkout main
git merge phase-2-storage  # DON'T DO THIS
```

### ✅ DO: Only merge passing tests

```bash
# CORRECT - All tests pass
bun test
# PASS: All tests passing

git checkout main
git merge --no-ff phase-2-storage
```

## Integration with Phase Plan

### Phase 1: Security Lockdown ✅ (Completed)

```bash
git checkout -b phase-1-security-lockdown

# 1.1: Remove exposed API keys
# Write tests → Implement → Test → Commit

# 1.2: Remove hardcoded credentials
# Write tests → Implement → Test → Commit

# 1.3: Add Supabase auth
# Write tests → Implement → Test → Commit

# 1.4: Add input validation
# Write tests → Implement → Test → Commit

# 1.5: Add rate limiting
# Write tests → Implement → Test → Commit

# All tasks complete, merge to main
git checkout main
git merge --no-ff phase-1-security-lockdown
```

### Phase 2: Storage Migration (Next)

```bash
git checkout -b phase-2-storage-migration

# 2.1: PostgreSQL with Prisma
git checkout -b phase-2-postgresql
# Write Prisma schema tests
# Implement schema
# Write repository tests
# Implement repositories
# Integration tests
# Merge to phase-2-storage-migration

# 2.2: Neo4j for Knowledge Graph
git checkout -b phase-2-neo4j
# Write graph operation tests
# Implement graph client
# Integration tests
# Merge to phase-2-storage-migration

# 2.3: Redis for Sessions & Caching
git checkout -b phase-2-redis
# Write cache tests
# Implement cache wrapper
# Integration tests
# Merge to phase-2-storage-migration

# All storage migrations complete
git checkout main
git merge --no-ff phase-2-storage-migration
```

## When to Use This Workflow

**MANDATORY for:**
- All feature development
- All bug fixes
- All refactoring
- All security updates
- All database migrations

**Exceptions:**
- Documentation-only changes (no tests needed)
- README updates
- Comment additions
- Version bumps

## Related Skills

- **everything-claude-code:tdd** - Test-driven development enforcement
- **everything-claude-code:git-workflow** - Advanced Git workflows
- **shaivra-security-first-architecture** - Security patterns for this project

---

*Version: 1.0.0 - March 2026*
*Project: Shaivra Intelligence Suite*
