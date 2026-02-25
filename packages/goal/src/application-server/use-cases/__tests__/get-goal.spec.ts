/**
 * GetGoal Use Case Unit Tests
 *
 * 测试层级: Service / Application Layer (Use Case)
 * 策略: 纯粹逻辑测试，所有依赖注入 Mock 对象
 *
 * 覆盖内容:
 * - 正常查询流程
 * - 目标不存在场景
 * - includeChildren 参数传递
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetGoal } from '../queries/get-goal';
import { Goal } from '@/domain-server';
import type { IGoalRepository } from '@/domain-server';

describe('GetGoal Use Case', () => {
  let useCase: GetGoal;
  let mockRepository: {
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByIdentityId: ReturnType<typeof vi.fn>;
    findByFolderId: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    batchUpdateStatus: ReturnType<typeof vi.fn>;
    batchMoveToFolder: ReturnType<typeof vi.fn>;
    isAncestor: ReturnType<typeof vi.fn>;
    findChildren: ReturnType<typeof vi.fn>;
  };

  /**
   * 创建一个真实的 Goal 聚合根用于测试
   */
  function createTestGoal(name = 'Test Goal') {
    return Goal.create({
      identityId: 'test-identity-123' as any,
      name,
      description: 'Test description',
      color: '#3B82F6',
      feasibilityAnalysis: null,
      motivation: null,
      importance: 'MEDIUM' as any,
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
  }

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByIdentityId: vi.fn().mockResolvedValue([]),
      findByFolderId: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
      batchUpdateStatus: vi.fn().mockResolvedValue(undefined),
      batchMoveToFolder: vi.fn().mockResolvedValue(undefined),
      isAncestor: vi.fn().mockResolvedValue(false),
      findChildren: vi.fn().mockResolvedValue([]),
    };

    useCase = new GetGoal(mockRepository as unknown as IGoalRepository);
  });

  // ==================== 正常查询测试 ====================

  describe('查询目标', () => {
    it('应该返回找到的目标', async () => {
      const testGoal = createTestGoal('My Goal');
      mockRepository.findById.mockResolvedValue(testGoal);

      const result = await useCase.execute(testGoal.id as unknown as string);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('My Goal');
        expect(result.data.identityId).toBe('test-identity-123');
      }
    });

    it('应该将 includeChildren 参数传递给 repository', async () => {
      const testGoal = createTestGoal();
      mockRepository.findById.mockResolvedValue(testGoal);

      await useCase.execute(testGoal.id as unknown as string, true);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        testGoal.id,
        { includeChildren: true },
      );
    });

    it('不指定 includeChildren 时应默认不传递', async () => {
      const testGoal = createTestGoal();
      mockRepository.findById.mockResolvedValue(testGoal);

      await useCase.execute(testGoal.id as unknown as string);

      expect(mockRepository.findById).toHaveBeenCalledWith(
        testGoal.id,
        { includeChildren: undefined },
      );
    });
  });

  // ==================== 目标不存在测试 ====================

  describe('目标不存在', () => {
    it('查询不存在的目标时应返回 NOT_FOUND', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute('non-existent-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toContain('non-existent-id');
      }
    });

    it('NOT_FOUND 结果中应包含目标 ID 信息', async () => {
      mockRepository.findById.mockResolvedValue(null);
      const testId = 'goal-abc-123';

      const result = await useCase.execute(testId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain(testId);
      }
    });
  });
});
