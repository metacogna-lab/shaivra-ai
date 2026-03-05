/**
 * Tool Selector
 * 
 * Intelligent selection of OSINT tools based on target entity type,
 * signal ranking, cost optimization, and custom filters.
 */

export interface ToolSelectionRequest {
  /** Target identifier (IP, domain, username, etc.) */
  target: string;

  /** Entity type (auto-detected if not provided) */
  entityType?: 'person' | 'organization' | 'infrastructure' | 'event' | 'unknown';

  /** Return tools ordered by signal rank (Layer 1 > Layer 5) */
  ranked?: boolean;

  /** Include only these tools */
  include?: string[];

  /** Exclude these tools */
  exclude?: string[];

  /** Maximum number of tools to return */
  maxTools?: number;

  /** Prioritize free/cached tools to minimize cost */
  costAware?: boolean;
}

/**
 * Tool metadata for intelligent selection
 */
interface ToolMetadata {
  name: string;
  
  /** Signal quality layer (1=authoritative, 2=infrastructure, 3=correlation, 4=enrichment, 5=narratives) */
  layer: 1 | 2 | 3 | 4 | 5;
  
  /** Supported entity types */
  entityTypes: Array<'person' | 'organization' | 'infrastructure' | 'event' | 'unknown'>;
  
  /** Estimated cost (0=free, 1=low, 2=medium, 3=high) */
  cost: 0 | 1 | 2 | 3;
  
  /** Average response time in milliseconds */
  avgResponseTime: number;
  
  /** Reliability score (0.0-1.0) */
  reliability: number;
}

/**
 * Tool registry with metadata for intelligent selection
 */
const TOOL_REGISTRY: ToolMetadata[] = [
  // Layer 1 - Authoritative Records (highest signal)
  // Note: These will be added in Phase 2B
  // { name: 'opencorporates', layer: 1, entityTypes: ['organization'], cost: 1, avgResponseTime: 2000, reliability: 1.0 },
  // { name: 'sec_edgar', layer: 1, entityTypes: ['organization'], cost: 0, avgResponseTime: 3000, reliability: 1.0 },
  // { name: 'gov_data', layer: 1, entityTypes: ['organization', 'person'], cost: 0, avgResponseTime: 2500, reliability: 0.95 },

  // Layer 2 - Infrastructure Intel (high signal)
  {
    name: 'shodan',
    layer: 2,
    entityTypes: ['infrastructure'],
    cost: 1, // Paid API
    avgResponseTime: 1500,
    reliability: 0.95
  },
  {
    name: 'virustotal',
    layer: 2,
    entityTypes: ['infrastructure'],
    cost: 1, // Paid API (free tier limited)
    avgResponseTime: 1200,
    reliability: 0.95
  },
  {
    name: 'alienvault',
    layer: 2,
    entityTypes: ['infrastructure'],
    cost: 0, // Free API
    avgResponseTime: 1800,
    reliability: 0.9
  },

  // Layer 3 - Correlation Tools (medium signal)
  // Note: Will be added in Phase 2C
  // { name: 'maltego', layer: 3, entityTypes: ['person', 'organization', 'infrastructure'], cost: 2, avgResponseTime: 5000, reliability: 0.85 },
  // { name: 'spiderfoot', layer: 3, entityTypes: ['infrastructure', 'person'], cost: 0, avgResponseTime: 8000, reliability: 0.8 },
  // { name: 'reconng', layer: 3, entityTypes: ['infrastructure'], cost: 0, avgResponseTime: 6000, reliability: 0.8 },

  // Layer 4 - Enrichment Sources (medium signal)
  // Note: Will be added in Phase 2D
  // { name: 'securitytrails', layer: 4, entityTypes: ['infrastructure'], cost: 1, avgResponseTime: 2000, reliability: 0.85 },
  // { name: 'builtwith', layer: 4, entityTypes: ['infrastructure'], cost: 1, avgResponseTime: 1500, reliability: 0.8 },

  // Layer 5 - Narrative Sources (context-rich)
  {
    name: 'twitter',
    layer: 5,
    entityTypes: ['person', 'organization'],
    cost: 2, // Paid API
    avgResponseTime: 1000,
    reliability: 0.75
  },
  {
    name: 'reddit',
    layer: 5,
    entityTypes: ['person', 'organization'],
    cost: 0, // Free API
    avgResponseTime: 1200,
    reliability: 0.7
  }
];

/**
 * Tool Selector Service
 */
export class ToolSelector {
  /**
   * Select appropriate OSINT tools based on request criteria
   */
  selectTools(request: ToolSelectionRequest): string[] {
    let candidates = [...TOOL_REGISTRY];

    // Step 1: Auto-detect entity type if not provided
    const entityType = request.entityType || this.detectEntityType(request.target);

    // Step 2: Filter by entity type
    candidates = candidates.filter(tool => 
      tool.entityTypes.includes(entityType)
    );

    // Step 3: Apply custom filters
    if (request.include && request.include.length > 0) {
      candidates = candidates.filter(tool => request.include!.includes(tool.name));
    }

    if (request.exclude && request.exclude.length > 0) {
      candidates = candidates.filter(tool => !request.exclude!.includes(tool.name));
    }

    // Step 4: Cost optimization
    if (request.costAware) {
      // Sort by cost (ascending), then by layer (ascending for higher signal)
      candidates.sort((a, b) => {
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.layer - b.layer;
      });
    }

    // Step 5: Signal ranking (Layer 1 > Layer 5)
    if (request.ranked) {
      candidates.sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer; // Lower layer = higher priority
        if (a.reliability !== b.reliability) return b.reliability - a.reliability;
        return a.avgResponseTime - b.avgResponseTime; // Faster = better
      });
    }

    // Step 6: Apply max tools limit
    if (request.maxTools && request.maxTools > 0) {
      candidates = candidates.slice(0, request.maxTools);
    }

    return candidates.map(tool => tool.name);
  }

  /**
   * Detect entity type from target string
   */
  private detectEntityType(target: string): 'person' | 'organization' | 'infrastructure' | 'unknown' {
    // IP address pattern
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(target)) {
      return 'infrastructure';
    }

    // Domain pattern
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (domainPattern.test(target)) {
      return 'infrastructure';
    }

    // URL pattern
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return 'infrastructure';
    }

    // Twitter handle pattern
    if (target.startsWith('@')) {
      return 'person';
    }

    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(target)) {
      return 'person';
    }

    // Organization indicators (keywords)
    const orgKeywords = ['corp', 'inc', 'llc', 'ltd', 'company', 'technologies', 'systems'];
    const targetLower = target.toLowerCase();
    if (orgKeywords.some(keyword => targetLower.includes(keyword))) {
      return 'organization';
    }

    // Default to unknown for ambiguous targets
    return 'unknown';
  }

  /**
   * Get tool metadata by name
   */
  getToolMetadata(toolName: string): ToolMetadata | undefined {
    return TOOL_REGISTRY.find(tool => tool.name === toolName);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): string[] {
    return TOOL_REGISTRY.map(tool => tool.name);
  }

  /**
   * Get tools by layer
   */
  getToolsByLayer(layer: 1 | 2 | 3 | 4 | 5): string[] {
    return TOOL_REGISTRY
      .filter(tool => tool.layer === layer)
      .map(tool => tool.name);
  }

  /**
   * Calculate estimated execution time for selected tools
   */
  estimateExecutionTime(toolNames: string[]): number {
    return toolNames.reduce((total, name) => {
      const tool = this.getToolMetadata(name);
      return total + (tool?.avgResponseTime || 0);
    }, 0);
  }

  /**
   * Calculate estimated cost for selected tools
   */
  estimateCost(toolNames: string[]): number {
    return toolNames.reduce((total, name) => {
      const tool = this.getToolMetadata(name);
      return total + (tool?.cost || 0);
    }, 0);
  }
}

// Export singleton instance
export const toolSelector = new ToolSelector();
