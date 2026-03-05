/**
 * Tests for the LangGraph JS agent network using dummy pipeline output.
 * Pipeline data (entities, observations, relationships) is passed as context to the agent.
 */

import { describe, expect, it, vi } from 'vitest';
import { v4 as uuid } from 'uuid';
import type { IntelligenceEvent } from '../../src/contracts/intelligence';

/** Controlled return value for mocked agent.invoke() */
let mockInvokeReturn: { messages: Array<{ type: string; content: string }> } = {
  messages: [{ type: 'ai', content: 'Mocked risk assessment.' }],
};

vi.mock('@langchain/langgraph/prebuilt', () => ({
  createReactAgent: vi.fn(() => ({
    invoke: vi.fn(() => Promise.resolve(mockInvokeReturn)),
  })),
}));

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: class MockChatGoogleGenerativeAI {},
}));

vi.mock('@langchain/core/messages', () => ({
  HumanMessage: class HumanMessage {
    content: string;
    constructor(opts: { content: string }) {
      this.content = opts.content;
    }
  },
  SystemMessage: class SystemMessage {
    content: string;
    constructor(opts: { content: string }) {
      this.content = opts.content;
    }
  },
}));

vi.mock('langsmith', () => ({
  Client: vi.fn(),
  RunTree: vi.fn(),
  getDefaultProjectName: vi.fn(() => 'test-project'),
  overrideFetchImplementation: vi.fn(),
  uuid7: vi.fn(() => '00000000-0000-0000-0000-000000000000'),
  uuid7FromTime: vi.fn(() => '00000000-0000-0000-0000-000000000000'),
  Cache: vi.fn(),
  PromptCache: vi.fn(),
  configureGlobalPromptCache: vi.fn(),
  promptCacheSingleton: {},
  __version__: '0.0.0-test',
}));

vi.mock('../../src/services/osintAggregator', () => ({
  osintAggregator: { fetchFromSource: vi.fn().mockResolvedValue({}) },
}));

/**
 * Build dummy pipeline output as it would come from the intelligence pipeline
 * (normalized entities, observations, relationships).
 */
function buildDummyPipelineEvent(overrides: Partial<IntelligenceEvent> = {}): IntelligenceEvent {
  const now = new Date();
  const entityId1 = uuid();
  const entityId2 = uuid();
  const obsId = uuid();
  const relId = uuid();
  return {
    id: uuid(),
    traceId: uuid(),
    tool: 'shodan',
    target: 'example.com',
    timestamp: now,
    status: 'success',
    entities: [
      {
        id: entityId1,
        type: 'organization',
        name: 'Acme Corp',
        aliases: ['Acme'],
        confidence: 0.9,
        attributes: { domain: 'example.com' },
        sourceIds: [],
        firstSeen: now,
        lastSeen: now,
        metadata: { verified: false, tags: ['osint'] },
      },
      {
        id: entityId2,
        type: 'infrastructure',
        name: 'example.com',
        aliases: [],
        confidence: 0.95,
        attributes: { ip: '93.184.216.34' },
        sourceIds: [],
        firstSeen: now,
        lastSeen: now,
        metadata: { verified: true, tags: [] },
      },
    ],
    observations: [
      {
        id: obsId,
        entityId: entityId1,
        type: 'attribute',
        property: 'open_ports',
        value: [443, 80],
        confidence: 0.85,
        source: { tool: 'shodan', timestamp: now, raw: {} },
        context: {},
      },
    ],
    relationships: [
      {
        id: relId,
        fromEntityId: entityId1,
        toEntityId: entityId2,
        type: 'HOSTS',
        strength: 0.9,
        confidence: 0.88,
        evidence: [],
        bidirectional: false,
        metadata: { firstSeen: now, lastSeen: now, count: 1 },
      },
    ],
    metadata: { executionTime: 1200, cost: 0, errors: [] },
    ...overrides,
  };
}

/** Serialize pipeline events to context string as would be passed to the agent. */
function pipelineEventsToContext(events: IntelligenceEvent[]): string {
  return JSON.stringify(
    events.map((e) => ({
      target: e.target,
      tool: e.tool,
      status: e.status,
      entities: e.entities.length,
      observations: e.observations.length,
      relationships: e.relationships.length,
      sample: e.entities[0]?.name,
    })),
    null,
    2
  );
}

describe('LangGraph agent network with pipeline data', () => {
  it('receives pipeline-shaped context and returns agent analysis result', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const dummyEvents = [
      buildDummyPipelineEvent({ target: 'example.com', tool: 'shodan' }),
      buildDummyPipelineEvent({ target: 'example.com', tool: 'virustotal' }),
    ];
    const context = pipelineEventsToContext(dummyEvents);
    const input = 'Assess risk for example.com using the pipeline findings above.';

    mockInvokeReturn = {
      messages: [
        { type: 'human', content: input },
        {
          type: 'ai',
          content:
            'Risk assessment: Medium. Key entities: Acme Corp, example.com. Open ports 80, 443. Relationship: HOSTS. Sources: shodan, virustotal.',
        },
      ],
    };

    const { runAgentAnalysis } = await import('../../src/services/langChainService');
    const result = await runAgentAnalysis(input, context);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Risk assessment');
    expect(result).toContain('Acme Corp');
  });

  it('uses dummy pipeline event shape consistent with IntelligenceEvent schema', () => {
    const event = buildDummyPipelineEvent();
    expect(event.entities).toHaveLength(2);
    expect(event.observations).toHaveLength(1);
    expect(event.relationships).toHaveLength(1);
    expect(event.entities[0].name).toBe('Acme Corp');
    expect(event.entities[0].type).toBe('organization');
    expect(event.relationships[0].type).toBe('HOSTS');
  });

  it('passes full pipeline context into agent system prompt', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const event = buildDummyPipelineEvent({ target: 'target.io', tool: 'theHarvester' });
    const context = pipelineEventsToContext([event]);
    mockInvokeReturn = { messages: [{ type: 'ai', content: 'Done.' }] };

    const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
    const { runAgentAnalysis } = await import('../../src/services/langChainService');

    await runAgentAnalysis('Summarize findings.', context);

    expect(createReactAgent).toHaveBeenCalled();
    const lastCall = (createReactAgent as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const stateModifier = lastCall![0].stateModifier as string;
    expect(stateModifier).toContain('target.io');
    expect(stateModifier).toContain('theHarvester');
    expect(stateModifier).toContain('entities');
  });
});
