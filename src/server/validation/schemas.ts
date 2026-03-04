import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  turnstileToken: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query too long (max 500 characters)'),
  traceId: z.string().uuid().optional(),
});

export const filteredSearchSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query too long'),
  filters: z.record(z.unknown()).optional(),
  traceId: z.string().uuid().optional(),
});

// Report Schemas
export const reportSchema = z.object({
  pipelineData: z.record(z.unknown())
    .refine(
      (data) => JSON.stringify(data).length < 50000,
      'Pipeline data exceeds 50KB limit'
    ),
  target: z.string()
    .min(1, 'Target required')
    .max(200, 'Target too long'),
  traceId: z.string().uuid().optional(),
});

export const summarizeSchema = z.object({
  data: z.record(z.unknown())
    .refine(
      (data) => JSON.stringify(data).length < 100000,
      'Data exceeds 100KB limit'
    ),
  domain: z.string()
    .min(1, 'Domain required')
    .max(100, 'Domain too long')
    .optional(),
});

// Organization Schemas
export const orgProfileSchema = z.object({
  orgName: z.string()
    .min(2, 'Organization name too short')
    .max(200, 'Organization name too long'),
  objective: z.string()
    .min(10, 'Objective too short (min 10 characters)')
    .max(500, 'Objective too long (max 500 characters)'),
  traceId: z.string().uuid().optional(),
});

// Investigation Schemas
export const investigationSchema = z.object({
  target: z.string()
    .min(1, 'Target required')
    .max(200, 'Target too long'),
  goal: z.string()
    .min(10, 'Goal too short')
    .max(500, 'Goal too long'),
  traceId: z.string().uuid().optional(),
});

// Forge Analysis Schemas
export const forgeAnalysisSchema = z.object({
  scenario: z.string()
    .min(20, 'Scenario too short (min 20 characters)')
    .max(2000, 'Scenario too long (max 2000 characters)'),
  constraints: z.array(z.string()).optional(),
  traceId: z.string().uuid().optional(),
});

// OSINT Schemas
export const osintQuerySchema = z.object({
  target: z.string()
    .min(1, 'Target required')
    .max(200, 'Target too long'),
  type: z.enum(['ip', 'domain', 'hash', 'url', 'email']).optional(),
});

export const fingerprintSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long'),
  traceId: z.string().uuid().optional(),
});

// Clip Schemas
export const clipSchema = z.object({
  title: z.string()
    .min(1, 'Title required')
    .max(200, 'Title too long'),
  content: z.string()
    .min(1, 'Content required')
    .max(10000, 'Content too long (max 10KB)'),
  source: z.string().url('Invalid source URL').optional(),
  tags: z.array(z.string()).optional(),
});

export const clipUpdateSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().max(10000, 'Content too long').optional(),
  source: z.string().url('Invalid source URL').optional(),
  tags: z.array(z.string()).optional(),
});

// Project Schemas
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name required')
    .max(200, 'Project name too long'),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  settings: z.record(z.unknown()).optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().max(200, 'Project name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

// Bot Schemas
export const botStartSchema = z.object({
  objective: z.string()
    .min(10, 'Objective too short')
    .max(500, 'Objective too long'),
  target: z.string()
    .min(1, 'Target required')
    .max(200, 'Target too long'),
  mode: z.enum(['passive', 'active', 'aggressive']).optional(),
});

// Ingestion Schemas
export const ingestionSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['twitter', 'reddit', 'news', 'rss', 'web']),
    url: z.string().url('Invalid source URL').optional(),
    query: z.string().optional(),
  })).min(1, 'At least one source required'),
  filters: z.record(z.unknown()).optional(),
});

// Analytics Schemas
export const analyticsQuerySchema = z.object({
  domain: z.string().min(1, 'Domain required').max(100, 'Domain too long'),
  timeRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
});
