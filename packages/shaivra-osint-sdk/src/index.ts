/**
 * Shaivra OSINT Adapter SDK. Deterministic signal producers; normalize to canonical events.
 */

export * from './contracts/index.js';
export * from './adapter/index.js';
export { runAdapter, type AdapterRuntime } from './adapter/AdapterRunner.js';
export { SignalNormalizer, normalizeToolResult } from './normalization/SignalNormalizer.js';
export { registerTool, getAdapter, hasAdapter } from './registry/registerTool.js';
export { emitSignals } from './events/emitSignal.js';
export { rateLimitAllowed } from './utils/rateLimiter.js';
export { withRetry, type RetryOptions } from './utils/retryPolicy.js';
