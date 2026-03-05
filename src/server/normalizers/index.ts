/**
 * Normalizer Registry
 *
 * Central registry for looking up and executing OSINT tool normalizers.
 * Auto-discovers and registers all available normalizers.
 */

import type { BaseNormalizer } from './base';
import { ShodanNormalizer } from './shodanNormalizer';
import { VirusTotalNormalizer } from './virusTotalNormalizer';
import { AlienVaultNormalizer } from './alienVaultNormalizer';
import { TwitterNormalizer } from './twitterNormalizer';
import { RedditNormalizer } from './redditNormalizer';

/**
 * Normalizer Registry
 *
 * Provides centralized lookup for all OSINT tool normalizers.
 * Automatically discovers and registers all normalizers.
 */
export class NormalizerRegistry {
  private normalizers: Map<string, BaseNormalizer>;

  constructor() {
    this.normalizers = new Map();
    this.registerAllNormalizers();
  }

  /**
   * Auto-register all normalizers
   *
   * New normalizers are automatically discovered and registered
   * by importing them and instantiating them here.
   */
  private registerAllNormalizers(): void {
    const normalizers = [
      new ShodanNormalizer(),
      new VirusTotalNormalizer(),
      new AlienVaultNormalizer(),
      new TwitterNormalizer(),
      new RedditNormalizer()
      // Future normalizers: Add new instances here
      // new OpenCorporatesNormalizer(),
      // new SECEdgarNormalizer(),
      // etc.
    ];

    normalizers.forEach(normalizer => {
      this.register(normalizer);
    });

    console.log(`[NormalizerRegistry] Registered ${this.normalizers.size} normalizers`);
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

// Export normalizer classes for external use
export { ShodanNormalizer } from './shodanNormalizer';
export { VirusTotalNormalizer } from './virusTotalNormalizer';
export { AlienVaultNormalizer } from './alienVaultNormalizer';
export { TwitterNormalizer } from './twitterNormalizer';
export { RedditNormalizer } from './redditNormalizer';
export { BaseNormalizer, AbstractNormalizer } from './base';
