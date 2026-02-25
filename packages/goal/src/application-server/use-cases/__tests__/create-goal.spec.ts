/**
 * CreateGoal Use Case Unit Tests
 *
 * 测试层级: Service / Application Layer (Use Case)
 * 策略: 纯粹逻辑测试，所有依赖注入 Mock 对象
 *
 * 覆盖内容:
 * - 正常创建流程
 * - 输入校验 (title, identityId)
 * - 父目标查询与校验
 * - Repository 调用验证
 * - 错误场景
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateGoal } from '../commands/create-goal';
import { GoalPolicy } from '@/domain-server';
import type { IGoalRepository } from '@/domain-server';
import type { Context } from '@dailyuse/contracts/shared';

describe('CreateGoal Use Case', () => {
  let useCase: CreateGoal;
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
  let goalPolicy: GoalPolicy;
  let defaultContext: Context;

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

    goalPolicy = new GoalPolicy();
    useCase = new CreateGoal(mockRepository as unknown as IGoalRepository, goalPolicy);

    defaultContext = {
      identityId: 'test-identity-123',
      deviceId: 'test-device-456',
    };
  });

  // ==================== 正常流程测试 ====================

  describe('正常创建', () => {
    it('应该成功创建目标并返回 ok result', async () => {
      const input: CreateGoalReq = {
        title: 'Learn TypeScript',
        description: 'Master TypeScript in 30 days',
        importance: 'MEDIUM' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('Learn TypeScript');
      }
    });

    it('应该调用 repository.save 持久化目标', async () => {
      const input: CreateGoalReq = {
        title: 'Build a project',
        importance: 'HIGH' as any,
      };

      await useCase.execute(input, defaultContext);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // Goal aggregate 被传入 save
        }),
      );
    });

    it('返回的 DTO 应包含正确的 identityId', async () => {
      const input: CreateGoalReq = {
        title: 'Test Goal',
        importance: 'LOW' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.identityId).toBe('test-identity-123');
      }
    });
  });

  // ==================== 输入校验测试 ====================

  describe('输入校验', () => {
    it('title 为空时应返回 VALIDATION_ERROR', async () => {
      const input: CreateGoalReq = {
        title: '',
        importance: 'MEDIUM' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('title 为空白字符时应返回 VALIDATION_ERROR', async () => {
      const input: CreateGoalReq = {
        title: '   ',
        importance: 'MEDIUM' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('identityId 为空时应返回 UNAUTHORIZED', async () => {
      const input: CreateGoalReq = {
        title: 'Valid Title',
        importance: 'MEDIUM' as any,
      };
      const badContext: Context = { identityId: '', deviceId: 'device-1' };

      const result = await useCase.execute(input, badContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  // ==================== 父目标校验测试 ====================

  describe('父目标处理', () => {
    it('指定不存在的 parentGoalId 时应返回 NOT_FOUND', async () => {
      const input: CreateGoalReq = {
        title: 'Child Goal',
        importance: 'MEDIUM' as any,
        parentGoalId: 'non-existent-id' as any,
      };

      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toContain('non-existent-id');
      }
    });

    it('没有 parentGoalId 时不应查询父目标', async () => {
      const input: CreateGoalReq = {
        title: 'Root Goal',
        importance: 'MEDIUM' as any,
      };

      await useCase.execute(input, defaultContext);

      // save 一定会调用，但 findById 不应该被调用（因为没有 parentGoalId）
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });

  // ==================== 默认值测试 ====================

  describe('默认值', () => {
    it('未提供 color 时应使用默认值', async () => {
      const input: CreateGoalReq = {
        title: 'Goal without color',
        importance: 'MEDIUM' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.color).toBe('#3B82F6');
      }
    });

    it('未提供 tags 时应默认为空数组', async () => {
      const input: CreateGoalReq = {
        title: 'Goal without tags',
        importance: 'MEDIUM' as any,
      };

      const result = await useCase.execute(input, defaultContext);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.tags).toEqual([]);
      }
    });
  });
});
