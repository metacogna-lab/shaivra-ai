import { describe, it, expect, vi, beforeEach } from 'vitest';
import { intelligenceEvent } from '../fixtures/intelligenceDummyData';

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('../../src/server/db/prismaClient', () => ({
  prisma: {
    intelligenceEvent: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

describe('intelligenceEventRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('persists contract-shaped event with id', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      const event = intelligenceEvent({ tool: 'shodan', target: '93.184.216.34' });
      mockCreate.mockResolvedValue({
        id: event.id,
        traceId: event.traceId,
        investigationId: null,
        tool: event.tool,
        target: event.target,
        timestamp: event.timestamp,
        status: event.status,
        entities: [],
        observations: [],
        relationships: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.create(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const call = mockCreate.mock.calls[0][0];
      expect(call.data.traceId).toBe(event.traceId);
      expect(call.data.tool).toBe('shodan');
      expect(call.data.target).toBe('93.184.216.34');
      expect(call.data.status).toBe('success');
      expect(result.tool).toBe('shodan');
    });

    it('accepts CreateIntelligenceEventInput without id', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      mockCreate.mockResolvedValue({
        id: 'generated-uuid',
        traceId: 'trace-1',
        investigationId: 'inv-1',
        tool: 'alienvault',
        target: 'example.com',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repo.create({
        traceId: 'trace-1',
        investigationId: 'inv-1',
        tool: 'alienvault',
        target: 'example.com',
        timestamp: new Date(),
        status: 'success',
        entities: [],
        observations: [],
        relationships: [],
        metadata: { executionTime: 5 },
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const call = mockCreate.mock.calls[0][0];
      expect(call.data.id).toBeUndefined();
      expect(call.data.investigationId).toBe('inv-1');
    });
  });

  describe('findByTraceId', () => {
    it('queries by traceId with limit', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      mockFindMany.mockResolvedValue([]);

      await repo.findByTraceId('trace-abc', 10);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { traceId: 'trace-abc' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
    });
  });

  describe('findByInvestigationId', () => {
    it('queries by investigationId with limit', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      mockFindMany.mockResolvedValue([]);

      await repo.findByInvestigationId('inv-123', 50);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { investigationId: 'inv-123' },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });
  });

  describe('findRecent', () => {
    it('returns events ordered by timestamp desc with default limit', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      mockFindMany.mockResolvedValue([]);

      await repo.findRecent();

      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });
  });

  describe('countByInvestigationId', () => {
    it('returns count for investigation', async () => {
      const { intelligenceEventRepository: repo } = await import(
        '../../src/server/repositories/intelligenceEventRepository'
      );
      mockCount.mockResolvedValue(3);

      const count = await repo.countByInvestigationId('inv-1');

      expect(mockCount).toHaveBeenCalledWith({ where: { investigationId: 'inv-1' } });
      expect(count).toBe(3);
    });
  });
});
