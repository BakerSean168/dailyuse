import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleClientService } from '../rule-client-service';
import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';
import { ok, error } from '@dailyuse/contracts/result';
import type { RuleClientDTO } from '@/contracts/aggregates/rule-client';

describe('RuleClientService', () => {
  let service: RuleClientService;
  let apiClient: IRuleApiClient;

  beforeEach(() => {
    apiClient = {
      createRule: vi.fn(),
      getRule: vi.fn(),
      updateRule: vi.fn(),
      deleteRule: vi.fn(),
      listRules: vi.fn(),
      searchRules: vi.fn(),
    } as unknown as IRuleApiClient;
    service = new RuleClientService(apiClient);
  });

  describe('fetchRules', () => {
    it('should call listRules with correct query parameters', async () => {
      const mockRules = [{ id: '1', title: 'Rule 1' }] as RuleClientDTO[];
      vi.mocked(apiClient.listRules).mockResolvedValue(ok({ items: mockRules, total: 1, page: 1, pageSize: 20 }));

      const result = await service.fetchRules({
        status: 'Active',
        severity: 'Mandatory',
        tags: ['tag1'],
        limit: 10,
        offset: 0,
      });

      expect(apiClient.listRules).toHaveBeenCalledWith({
        status: 'Active',
        severity: 'Mandatory',
        tags: ['tag1'],
        page: 1,
        pageSize: 10,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockRules);
      }
    });

    it('should handle pagination correctly', async () => {
        vi.mocked(apiClient.listRules).mockResolvedValue(ok({ items: [], total: 0, page: 2, pageSize: 10 }));

        await service.fetchRules({ limit: 10, offset: 10 });

        expect(apiClient.listRules).toHaveBeenCalledWith(expect.objectContaining({
            page: 2,
            pageSize: 10
        }));
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.listRules).mockResolvedValue(error('API_ERROR', 'Failed to fetch'));

      const result = await service.fetchRules();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('API_ERROR');
      }
    });
  });

  describe('fetchRuleById', () => {
    it('should call getRule with correct ID', async () => {
      const mockRule = { id: '1', title: 'Rule 1' } as RuleClientDTO;
      vi.mocked(apiClient.getRule).mockResolvedValue(ok(mockRule));

      const result = await service.fetchRuleById('1');

      expect(apiClient.getRule).toHaveBeenCalledWith({ id: '1' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockRule);
      }
    });
  });

  describe('searchRules', () => {
    it('should call searchRules with correct query', async () => {
      const mockRules = [{ id: '1', title: 'Rule 1' }] as RuleClientDTO[];
      vi.mocked(apiClient.searchRules).mockResolvedValue(ok({ items: mockRules, total: 1, page: 1, pageSize: 20, searchTime: 10 }));

      const result = await service.searchRules({ query: 'test', limit: 10 });

      expect(apiClient.searchRules).toHaveBeenCalledWith({
        query: 'test',
        page: 1,
        pageSize: 10,
        status: undefined,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockRules);
      }
    });
  });

  describe('createRule', () => {
    it('should call createRule and return ruleId', async () => {
      const newRule = { id: 'new-id', title: 'New Rule' } as RuleClientDTO;
      vi.mocked(apiClient.createRule).mockResolvedValue(ok(newRule));

      const result = await service.createRule({ title: 'New Rule' } as any);

      expect(apiClient.createRule).toHaveBeenCalledWith({ title: 'New Rule' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.ruleId).toBe('new-id');
      }
    });
  });

  describe('updateRule', () => {
    it('should call updateRule', async () => {
      vi.mocked(apiClient.updateRule).mockResolvedValue(ok({} as any));

      const result = await service.updateRule('1', { title: 'Updated' });

      expect(apiClient.updateRule).toHaveBeenCalledWith('1', { title: 'Updated' });
      expect(result.ok).toBe(true);
    });
  });

  describe('deleteRule', () => {
    it('should call deleteRule and succeed', async () => {
      vi.mocked(apiClient.deleteRule).mockResolvedValue(ok({ success: true }));

      const result = await service.deleteRule('1');

      expect(apiClient.deleteRule).toHaveBeenCalledWith({ id: '1' });
      expect(result.ok).toBe(true);
    });

    it('should return error if delete fails', async () => {
      vi.mocked(apiClient.deleteRule).mockResolvedValue(ok({ success: false }));

      const result = await service.deleteRule('1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DELETE_FAILED');
      }
    });
  });
});
