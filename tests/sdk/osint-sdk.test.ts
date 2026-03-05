/**
 * OSINT Adapter SDK: contracts, SignalNormalizer, BaseAdapter.run, AdapterRunner.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ToolQuery, ToolResult, RawSignal, CanonicalEvent } from '@shaivra/osint-sdk/contracts';
import { normalizeToolResult } from '@shaivra/osint-sdk/normalization';
import { registerTool, getAdapter, hasAdapter } from '@shaivra/osint-sdk/registry';
import { runAdapter, BaseAdapter } from '@shaivra/osint-sdk/adapter';

/** Stub adapter for tests (mirrors SDK StubShodanAdapter). */
class StubShodanAdapter extends BaseAdapter {
  id = 'shodan';
  supportedEntities = ['domain', 'ip', 'infrastructure'];
  async execute(query: ToolQuery): Promise<ToolResult> {
    const now = new Date().toISOString();
    const signals: RawSignal[] = [
      { source: this.id, signal_type: 'open_port', entity_type: 'ip', value: '1.2.3.4', context: 'port 443', confidence: 0.9, observed_at: now },
      { source: this.id, signal_type: 'hostname', entity_type: 'domain', value: query.value, confidence: 0.85, observed_at: now },
    ];
    return { tool: this.id, timestamp: now, raw_output: { stub: true }, signals };
  }
}

describe('OSINT SDK contracts', () => {
  it('normalizes ToolResult to CanonicalEvent shape', () => {
    const result: ToolResult = {
      tool: 'test',
      timestamp: new Date().toISOString(),
      signals: [
        {
          source: 'test',
          signal_type: 'open_port',
          entity_type: 'ip',
          value: '1.2.3.4',
          confidence: 0.9,
          observed_at: new Date().toISOString(),
        } as RawSignal,
      ],
    };
    const event = normalizeToolResult(result, 'example.com', 'trace-1', 'inv-1');
    expect(event).toMatchObject({
      tool: 'test',
      target: 'example.com',
      traceId: 'trace-1',
      investigationId: 'inv-1',
      status: 'success',
      relationships: [],
    });
    expect(Array.isArray(event.entities)).toBe(true);
    expect(event.entities.length).toBe(1);
    expect(Array.isArray(event.observations)).toBe(true);
    expect(event.observations.length).toBe(1);
    expect(event.observations[0].property).toBe('open_port');
    expect(event.observations[0].confidence).toBe(0.9);
  });

  it('produces valid UUIDs and dates', () => {
    const result: ToolResult = {
      tool: 't',
      timestamp: new Date().toISOString(),
      signals: [],
    };
    const event = normalizeToolResult(result, 'x', 't2') as CanonicalEvent;
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.entities[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.timestamp).toBeInstanceOf(Date);
  });
});

describe('BaseAdapter.run (StubShodanAdapter)', () => {
  it('returns CanonicalEvent from execute() then normalize', async () => {
    const adapter = new StubShodanAdapter();
    const query: ToolQuery = {
      entity_type: 'domain',
      value: 'example.com',
    };
    const event = await adapter.run(query);
    expect(event.tool).toBe('shodan');
    expect(event.target).toBe('example.com');
    expect(event.observations.length).toBeGreaterThanOrEqual(1);
    expect(event.entities).toHaveLength(1);
  });
});

describe('AdapterRunner and registry', () => {
  const mockRuntime = {
    getRemaining: vi.fn((_id: string, _max: number) => 10),
    checkAndConsume: vi.fn(() => true),
    recordToolCall: vi.fn(),
  };

  beforeEach(() => {
    mockRuntime.getRemaining.mockReturnValue(10);
    mockRuntime.checkAndConsume.mockReturnValue(true);
    mockRuntime.recordToolCall.mockClear();
    registerTool('shodan', new StubShodanAdapter());
  });

  it('runAdapter returns event when adapter registered and budget allows', async () => {
    const query: ToolQuery = {
      entity_type: 'domain',
      value: 'test.com',
      investigation_id: 'inv-1',
    };
    const event = await runAdapter('shodan', query, mockRuntime, 20);
    expect(event).toBeDefined();
    expect(event!.tool).toBe('shodan');
    expect(mockRuntime.checkAndConsume).toHaveBeenCalledWith('inv-1', 1, 20);
    expect(mockRuntime.recordToolCall).toHaveBeenCalledWith('shodan');
  });

  it('runAdapter returns undefined when no adapter registered', async () => {
    const query: ToolQuery = { entity_type: 'domain', value: 'x' };
    const event = await runAdapter('unknown_tool', query, mockRuntime, 20);
    expect(event).toBeUndefined();
    expect(mockRuntime.recordToolCall).not.toHaveBeenCalled();
  });

  it('runAdapter returns undefined when budget exhausted', async () => {
    mockRuntime.getRemaining.mockReturnValue(0);
    const query: ToolQuery = { entity_type: 'domain', value: 'x', investigation_id: 'inv-2' };
    const event = await runAdapter('shodan', query, mockRuntime, 20);
    expect(event).toBeUndefined();
    expect(mockRuntime.recordToolCall).not.toHaveBeenCalled();
  });

  it('hasAdapter and getAdapter reflect registration', () => {
    expect(hasAdapter('shodan')).toBe(true);
    expect(getAdapter('shodan')).toBeInstanceOf(BaseAdapter);
    expect(hasAdapter('other')).toBe(false);
    expect(getAdapter('other')).toBeUndefined();
  });
});
