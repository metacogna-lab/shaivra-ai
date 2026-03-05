/**
 * Normalizer Registry
 * 
 * Central registry for looking up and executing OSINT tool normalizers.
 */

import type { BaseNormalizer } from './base';
import { ShodanNormalizer } from './shodanNormalizer';
import { VirusTotalNormalizer } from './virusTotalNormalizer';
import { AlienVaultNormalizer } from './alienVaultNormalizer';

/**
 * Normalizer Registry
 * 
 * Provides centralized lookup for all OSINT tool normalizers.
 */
export class NormalizerRegistry {
  private normalizers: Map<string, BaseNormalizer>;

  constructor() {
    this.normalizers = new Map();
    this.registerDefaultNormalizers();
  }

  /**
   * Register default normalizers
   */
  private registerDefaultNormalizers(): void {
    this.register(new ShodanNormalizer());
    this.register(new VirusTotalNormalizer());
    this.register(new AlienVaultNormalizer());
    // Twitter and Reddit normalizers will be added in next phase
  }

  /**
   * Register a normalizer
   */
  register(normalizer: BaseNormalizer): void {
    this.normalizers.set(normalizer.toolName, normalizer);
    console.log(`[NormalizerRegistry] Registered normalizer for: ${normalizer.toolName}`);
  }

  /**
   * Get normalizer by tool name
   */
  get(toolName: string): BaseNormalizer | undefined {
    return this.normalizers.get(toolName);
  }

  /**
   * Check if normalizer exists for tool
   */
  has(toolName: string): boolean {
    return this.normalizers.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getRegisteredTools(): string[] {
    return Array.from(this.normalizers.keys());
  }

  /**
   * Unregister a normalizer (useful for testing)
   */
  unregister(toolName: string): boolean {
    return this.normalizers.delete(toolName);
  }
}

// Export singleton instance
export const normalizerRegistry = new NormalizerRegistry();

// Export normalizer classes
export { ShodanNormalizer } from './shodanNormalizer';
export { VirusTotalNormalizer } from './virusTotalNormalizer';
export { AlienVaultNormalizer } from './alienVaultNormalizer';
export { BaseNormalizer, AbstractNormalizer } from './base';
