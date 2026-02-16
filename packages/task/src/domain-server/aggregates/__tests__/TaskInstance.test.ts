/**
 * TaskInstance 聚合根单元测试
 *
 * 测试覆盖：
 * - 工厂方法 (create, fromServerDTO, fromPersistenceDTO)
 * - 状态转换 (start, complete, skip, markExpired)
 * - 业务判断 (canStart, canComplete, canSkip, isOverdue)
 * - DTO 转换 (toServerDTO, toClientDTO, toPersistenceDTO)
 * - 边界条件和错误处理
 *
 * 目标覆盖率: 90%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskInstance } from '../task-instance';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../../value-objects';
import type { CompletionRecordServerDTO, SkipRecordServerDTO, TaskInstancePersistenceDTO, TaskInstanceServerDTO } from '@dailyuse/contracts/task';
import { TimeType } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

describe('TaskInstance Aggregate', () => {
  // ==================== 测试数据 ====================
  const mockTemplateId = 'template-uuid-123';
  const mockAccountId = 'account-uuid-456';
  const mockInstanceDate = Date.now();

  /**
   * 创建测试用的 TimeConfig
   */
  const createTestTimeConfig = (): TaskTimeConfig => {
    return new TaskTimeConfig({
      timeType: 'TIME_POINT' as TimeType,
      startDate: mockInstanceDate,
      endDate: mockInstanceDate + 86400000, // 1天后
      timePoint: mockInstanceDate,
      timeRange: null,
    });
  };

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('create()', () => {
      it('应该创建有效的 TaskInstance', () => {
        const instance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        expect(instance.id).toBeDefined();
        expect(typeof instance.id).toBe('string');
        expect(instance.id.length).toBeGreaterThan(0);
        expect(instance.templateId).toBe(mockTemplateId);
        expect(instance.identityId).toBe(mockAccountId);
        expect(instance.instanceDate).toBe(mockInstanceDate);
        expect(instance.status).toBe('PENDING');
        expect(instance.completionRecord).toBeNull();
        expect(instance.skipRecord).toBeNull();
        expect(instance.actualStartTime).toBeNull();
        expect(instance.actualEndTime).toBeNull();
        expect(instance.note).toBeNull();
        expect(instance.createdAt).toBeDefined();
        expect(instance.updatedAt).toBeDefined();
      });

      it('应该为每个实例生成唯一的 UUID', () => {
        const instance1 = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        const instance2 = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        expect(instance1.id).not.toBe(instance2.id);
      });

      it('应该设置 createdAt 和 updatedAt 为当前时间', () => {
        const beforeCreate = Date.now();
        const instance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });
        const afterCreate = Date.now();

        expect(instance.createdAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(instance.createdAt).toBeLessThanOrEqual(afterCreate);
        expect(instance.updatedAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(instance.updatedAt).toBeLessThanOrEqual(afterCreate);
      });
    });

    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 正确恢复实例', () => {
        const now = Date.now();
        const dto: TaskInstanceServerDTO = {
          id: 'test-uuid',
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig().toServerDTO(),
          status: 'PENDING',
          completionRecord: null,
          skipRecord: null,
          actualStartTime: null,
          actualEndTime: null,
          note: null,
          createdAt: now,
          updatedAt: now,
        };

        const instance = TaskInstance.fromServerDTO(dto);

        expect(instance.id).toBe('test-uuid');
        expect(instance.templateId).toBe(mockTemplateId);
        expect(instance.status).toBe('PENDING');
      });

      it('应该正确恢复包含 completionRecord 的实例', () => {
        const now = Date.now();
        const completionRecordDTO: CompletionRecordServerDTO = {
          completedAt: now,
          actualDuration: 3600000,
          note: 'Test note',
          rating: 5,
          taskId: 'test-uuid',
          completionStatus: 'completed',
        };

        const dto: TaskInstanceServerDTO = {
          id: 'test-uuid',
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig().toServerDTO(),
          status: 'COMPLETED',
          completionRecord: completionRecordDTO,
          skipRecord: null,
          actualStartTime: now - 3600000,
          actualEndTime: now,
          note: 'Test note',
          createdAt: now,
          updatedAt: now,
        };

        const instance = TaskInstance.fromServerDTO(dto);

        expect(instance.status).toBe('COMPLETED');
        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.completedAt).toBe(now);
        expect(instance.completionRecord?.rating).toBe(5);
      });

      it('应该正确恢复包含 skipRecord 的实例', () => {
        const now = Date.now();
        const skipRecordDTO: SkipRecordServerDTO = {
          skippedAt: now,
          reason: 'Too busy',
        };

        const dto: TaskInstanceServerDTO = {
          id: 'test-uuid',
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: createTestTimeConfig().toServerDTO(),
          status: 'SKIPPED',
          completionRecord: null,
          skipRecord: skipRecordDTO,
          actualStartTime: null,
          actualEndTime: null,
          note: 'Too busy',
          createdAt: now,
          updatedAt: now,
        };

        const instance = TaskInstance.fromServerDTO(dto);

        expect(instance.status).toBe('SKIPPED');
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBe('Too busy');
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 正确恢复实例', () => {
        const now = Date.now();
        const timeConfigDTO = createTestTimeConfig().toPersistenceDTO();

        const dto: TaskInstancePersistenceDTO = {
          id: 'test-uuid',
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: mockInstanceDate,
          timeConfig: JSON.stringify(timeConfigDTO),
          status: 'PENDING',
          completionRecord: null,
          skipRecord: null,
          actualStartTime: null,
          actualEndTime: null,
          note: null,
          createdAt: now,
          updatedAt: now,
        };

        const instance = TaskInstance.fromPersistenceDTO(dto);

        expect(instance.id).toBe('test-uuid');
        expect(instance.status).toBe('PENDING');
      });
    });
  });

  // ==================== 业务方法测试 ====================
  describe('Business Methods', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });
    });

    describe('start()', () => {
      it('应该启动 PENDING 状态的任务', () => {
        expect(instance.status).toBe('PENDING');
        expect(instance.actualStartTime).toBeNull();

        const beforeStart = Date.now();
        instance.start();
        const afterStart = Date.now();

        expect(instance.status).toBe('IN_PROGRESS');
        expect(instance.actualStartTime).not.toBeNull();
        expect(instance.actualStartTime!).toBeGreaterThanOrEqual(beforeStart);
        expect(instance.actualStartTime!).toBeLessThanOrEqual(afterStart);
      });

      it('应该更新 updatedAt 时间戳', () => {
        const beforeStart = Date.now();
        instance.start();
        const afterStart = Date.now();

        expect(instance.updatedAt).toBeGreaterThanOrEqual(beforeStart);
        expect(instance.updatedAt).toBeLessThanOrEqual(afterStart);
      });

      it('应该拒绝启动非 PENDING 状态的任务', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');

        expect(() => instance.start()).toThrow('Cannot start task in current state');
      });
    });

    describe('complete()', () => {
      it('应该完成 PENDING 状态的任务', () => {
        expect(instance.status).toBe('PENDING');

        const beforeComplete = Date.now();
        instance.complete();
        const afterComplete = Date.now();

        expect(instance.status).toBe('COMPLETED');
        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.completedAt).toBeGreaterThanOrEqual(beforeComplete);
        expect(instance.completionRecord?.completedAt).toBeLessThanOrEqual(afterComplete);
        expect(instance.actualEndTime).toBeGreaterThanOrEqual(beforeComplete);
        expect(instance.actualEndTime!).toBeLessThanOrEqual(afterComplete);
      });

      it('应该完成 IN_PROGRESS 状态的任务', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');

        instance.complete();

        expect(instance.status).toBe('COMPLETED');
        expect(instance.completionRecord).not.toBeNull();
      });

      it('应该支持传入完成参数', () => {
        instance.complete(3600000, 'Task completed successfully', 5);

        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.actualDuration).toBe(3600000);
        expect(instance.completionRecord?.note).toBe('Task completed successfully');
        expect(instance.completionRecord?.rating).toBe(5);
        expect(instance.note).toBe('Task completed successfully');
      });

      it('应该自动计算实际耗时（如果已启动）', () => {
        instance.start();
        const startTime = instance.actualStartTime!;

        // 完成任务时会自动计算耗时
        instance.complete();

        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.actualDuration).toBeDefined();
        // 耗时应该非常小（毫秒级）
        expect(instance.completionRecord?.actualDuration).toBeGreaterThanOrEqual(0);
      });

      it('应该拒绝完成已完成的任务', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');

        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });

      it('应该拒绝完成已跳过的任务', () => {
        instance.skip('Too busy');
        expect(instance.status).toBe('SKIPPED');

        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });

      it('应该拒绝完成已过期的任务', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');

        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });
    });

    describe('skip()', () => {
      it('应该跳过 PENDING 状态的任务', () => {
        expect(instance.status).toBe('PENDING');

        const beforeSkip = Date.now();
        instance.skip('Too busy today');
        const afterSkip = Date.now();

        expect(instance.status).toBe('SKIPPED');
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBe('Too busy today');
        expect(instance.skipRecord?.skippedAt).toBeGreaterThanOrEqual(beforeSkip);
        expect(instance.skipRecord?.skippedAt).toBeLessThanOrEqual(afterSkip);
        expect(instance.note).toBe('Too busy today');
      });

      it('应该跳过 IN_PROGRESS 状态的任务', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');

        instance.skip('Interrupted');

        expect(instance.status).toBe('SKIPPED');
        expect(instance.skipRecord).not.toBeNull();
      });

      it('应该支持不传入原因', () => {
        instance.skip();

        expect(instance.status).toBe('SKIPPED');
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBeNull();
      });

      it('应该拒绝跳过已完成的任务', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');

        expect(() => instance.skip('Late')).toThrow('Cannot skip task in current state');
      });

      it('应该拒绝跳过已跳过的任务', () => {
        instance.skip('First reason');
        expect(instance.status).toBe('SKIPPED');

        expect(() => instance.skip('Second reason')).toThrow(
          'Cannot skip task in current state',
        );
      });

      it('应该拒绝跳过已过期的任务', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');

        expect(() => instance.skip('Late')).toThrow('Cannot skip task in current state');
      });
    });

    describe('markExpired()', () => {
      it('应该标记 PENDING 任务为过期', () => {
        expect(instance.status).toBe('PENDING');

        const beforeExpire = Date.now();
        instance.markExpired();
        const afterExpire = Date.now();

        expect(instance.status).toBe('EXPIRED');
        expect(instance.updatedAt).toBeGreaterThanOrEqual(beforeExpire);
        expect(instance.updatedAt).toBeLessThanOrEqual(afterExpire);
      });

      it('应该标记 IN_PROGRESS 任务为过期', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');

        instance.markExpired();

        expect(instance.status).toBe('EXPIRED');
      });

      it('不应该标记 COMPLETED 任务为过期', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');

        instance.markExpired();

        expect(instance.status).toBe('COMPLETED');
      });

      it('不应该标记 SKIPPED 任务为过期', () => {
        instance.skip('Busy');
        expect(instance.status).toBe('SKIPPED');

        instance.markExpired();

        expect(instance.status).toBe('SKIPPED');
      });

      it('不应该标记已 EXPIRED 任务为过期', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');
        const firstUpdatedAt = instance.updatedAt;

        instance.markExpired();

        expect(instance.status).toBe('EXPIRED');
        expect(instance.updatedAt).toBe(firstUpdatedAt);
      });
    });
  });

  // ==================== 业务判断方法测试 ====================
  describe('Business Logic Methods', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });
    });

    describe('canStart()', () => {
      it('PENDING 状态应该可以启动', () => {
        expect(instance.status).toBe('PENDING');
        expect(instance.canStart()).toBe(true);
      });

      it('IN_PROGRESS 状态不应该可以启动', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');
        expect(instance.canStart()).toBe(false);
      });

      it('COMPLETED 状态不应该可以启动', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');
        expect(instance.canStart()).toBe(false);
      });

      it('SKIPPED 状态不应该可以启动', () => {
        instance.skip();
        expect(instance.status).toBe('SKIPPED');
        expect(instance.canStart()).toBe(false);
      });

      it('EXPIRED 状态不应该可以启动', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');
        expect(instance.canStart()).toBe(false);
      });
    });

    describe('canComplete()', () => {
      it('PENDING 状态应该可以完成', () => {
        expect(instance.status).toBe('PENDING');
        expect(instance.canComplete()).toBe(true);
      });

      it('IN_PROGRESS 状态应该可以完成', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');
        expect(instance.canComplete()).toBe(true);
      });

      it('COMPLETED 状态不应该可以完成', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');
        expect(instance.canComplete()).toBe(false);
      });

      it('SKIPPED 状态不应该可以完成', () => {
        instance.skip();
        expect(instance.status).toBe('SKIPPED');
        expect(instance.canComplete()).toBe(false);
      });

      it('EXPIRED 状态不应该可以完成', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');
        expect(instance.canComplete()).toBe(false);
      });
    });

    describe('canSkip()', () => {
      it('PENDING 状态应该可以跳过', () => {
        expect(instance.status).toBe('PENDING');
        expect(instance.canSkip()).toBe(true);
      });

      it('IN_PROGRESS 状态应该可以跳过', () => {
        instance.start();
        expect(instance.status).toBe('IN_PROGRESS');
        expect(instance.canSkip()).toBe(true);
      });

      it('COMPLETED 状态不应该可以跳过', () => {
        instance.complete();
        expect(instance.status).toBe('COMPLETED');
        expect(instance.canSkip()).toBe(false);
      });

      it('SKIPPED 状态不应该可以跳过', () => {
        instance.skip();
        expect(instance.status).toBe('SKIPPED');
        expect(instance.canSkip()).toBe(false);
      });

      it('EXPIRED 状态不应该可以跳过', () => {
        instance.markExpired();
        expect(instance.status).toBe('EXPIRED');
        expect(instance.canSkip()).toBe(false);
      });
    });

    describe('isOverdue()', () => {
      it('PENDING 状态的过期任务应该返回 true', () => {
        const overdueInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now() - 86400000 - 1000, // 超过1天 + 1秒
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        expect(overdueInstance.status).toBe('PENDING');
        expect(overdueInstance.isOverdue()).toBe(true);
      });

      it('IN_PROGRESS 状态的过期任务应该返回 true', () => {
        const overdueInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now() - 86400000 - 1000,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        overdueInstance.start();
        expect(overdueInstance.status).toBe('IN_PROGRESS');
        expect(overdueInstance.isOverdue()).toBe(true);
      });

      it('PENDING 状态的未过期任务应该返回 false', () => {
        const freshInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now(),
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        expect(freshInstance.status).toBe('PENDING');
        expect(freshInstance.isOverdue()).toBe(false);
      });

      it('COMPLETED 状态应该返回 false', () => {
        const overdueInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now() - 86400000 - 1000,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        overdueInstance.complete();
        expect(overdueInstance.status).toBe('COMPLETED');
        expect(overdueInstance.isOverdue()).toBe(false);
      });

      it('SKIPPED 状态应该返回 false', () => {
        const overdueInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now() - 86400000 - 1000,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        overdueInstance.skip();
        expect(overdueInstance.status).toBe('SKIPPED');
        expect(overdueInstance.isOverdue()).toBe(false);
      });

      it('EXPIRED 状态应该返回 false', () => {
        const overdueInstance = TaskInstance.create({
          templateId: mockTemplateId,
          identityId: mockAccountId,
          instanceDate: Date.now() - 86400000 - 1000,
          timeConfig: createTestTimeConfig(),
          importance: ImportanceLevel.Important,
        });

        overdueInstance.markExpired();
        expect(overdueInstance.status).toBe('EXPIRED');
        expect(overdueInstance.isOverdue()).toBe(false);
      });
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });
    });

    describe('toServerDTO()', () => {
      it('应该正确转换为 ServerDTO', () => {
        const dto = instance.toServerDTO();

        expect(dto.id).toBe(instance.id);
        expect(dto.templateId).toBe(mockTemplateId);
        expect(dto.identityId).toBe(mockAccountId);
        expect(dto.instanceDate).toBe(mockInstanceDate);
        expect(dto.status).toBe('PENDING');
        expect(dto.importance).toBe(ImportanceLevel.Important);
        expect(dto.priority).toBeUndefined();
        expect(dto.timeConfig).toBeDefined();
        expect(dto.completionRecord).toBeNull();
        expect(dto.skipRecord).toBeNull();
        expect(dto.actualStartTime).toBeNull();
        expect(dto.actualEndTime).toBeNull();
        expect(dto.note).toBeNull();
        expect(dto.createdAt).toBe(instance.createdAt);
        expect(dto.updatedAt).toBe(instance.updatedAt);
      });

      it('应该包含 completionRecord（如果已完成）', () => {
        instance.complete(3600000, 'Done', 5);
        const dto = instance.toServerDTO();

        expect(dto.completionRecord).not.toBeNull();
        expect(dto.completionRecord?.actualDuration).toBe(3600000);
        expect(dto.completionRecord?.rating).toBe(5);
      });

      it('应该包含 skipRecord（如果已跳过）', () => {
        instance.skip('Too busy');
        const dto = instance.toServerDTO();

        expect(dto.skipRecord).not.toBeNull();
        expect(dto.skipRecord?.reason).toBe('Too busy');
      });
    });

    describe('toClientDTO()', () => {
      it('应该正确转换为 ClientDTO', () => {
        const dto = instance.toClientDTO();

        expect(dto.id).toBe(instance.id);
        expect(dto.status).toBe('PENDING');
        expect(dto.isPending).toBe(true);
        expect(dto.isCompleted).toBe(false);
        expect(dto.isSkipped).toBe(false);
        expect(dto.isExpired).toBe(false);
        expect(dto.statusText).toBe('待完成');
        expect(dto.statusColor).toBe('blue');
        expect(dto.instanceDateFormatted).toBeDefined();
        expect(dto.formattedCreatedAt).toBeDefined();
        expect(dto.formattedUpdatedAt).toBeDefined();
      });

      it('应该包含格式化的日期', () => {
        const dto = instance.toClientDTO();

        expect(dto.instanceDateFormatted).toContain('/');
        expect(dto.formattedCreatedAt).toBeDefined();
        expect(dto.formattedUpdatedAt).toBeDefined();
      });

      it('应该包含正确的状态标志（COMPLETED）', () => {
        instance.complete();
        const dto = instance.toClientDTO();

        expect(dto.isCompleted).toBe(true);
        expect(dto.isPending).toBe(false);
        expect(dto.isSkipped).toBe(false);
        expect(dto.isExpired).toBe(false);
        expect(dto.statusText).toBe('已完成');
        expect(dto.statusColor).toBe('green');
      });

      it('应该包含正确的状态标志（SKIPPED）', () => {
        instance.skip();
        const dto = instance.toClientDTO();

        expect(dto.isSkipped).toBe(true);
        expect(dto.isPending).toBe(false);
        expect(dto.isCompleted).toBe(false);
        expect(dto.statusText).toBe('已跳过');
        expect(dto.statusColor).toBe('gray');
      });

      it('应该包含实际耗时（如果已完成）', () => {
        // 设置 actualStartTime 和 actualEndTime 来确保有实际耗时
        instance.start();
        // 手动完成，并传入耗时参数确保有值
        instance.complete(3600000); // 1小时
        const dto = instance.toClientDTO();

        expect(dto.actualDuration).toBeDefined();
        expect(dto.durationText).toBeDefined();
        if (dto.durationText !== null) {
          expect(dto.durationText).toContain('小时');
        }
      });

      it('应该包含 note 标志', () => {
        instance.complete(0, 'Test note');
        const dto = instance.toClientDTO();

        expect(dto.hasNote).toBe(true);
        expect(dto.note).toBe('Test note');
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该正确转换为 PersistenceDTO', () => {
        const dto = instance.toPersistenceDTO();

        expect(dto.id).toBe(instance.id);
        expect(dto.templateId).toBe(mockTemplateId);
        expect(dto.identityId).toBe(mockAccountId);
        expect(dto.status).toBe('PENDING');
        expect(dto.importance).toBe(ImportanceLevel.Important);
        expect(typeof dto.timeConfig).toBe('string');
        expect(dto.completionRecord).toBeNull();
        expect(dto.skipRecord).toBeNull();
      });

      it('应该序列化 completionRecord（如果存在）', () => {
        instance.complete();
        const dto = instance.toPersistenceDTO();

        expect(dto.completionRecord).not.toBeNull();
        expect(typeof dto.completionRecord).toBe('string');
        expect(() => JSON.parse(dto.completionRecord as string)).not.toThrow();
      });

      it('应该序列化 skipRecord（如果存在）', () => {
        instance.skip('Busy');
        const dto = instance.toPersistenceDTO();

        expect(dto.skipRecord).not.toBeNull();
        expect(typeof dto.skipRecord).toBe('string');
        expect(() => JSON.parse(dto.skipRecord as string)).not.toThrow();
      });
    });
  });

  // ==================== 状态转换测试 ====================
  describe('State Transitions', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });
    });

    it('应该允许 PENDING → IN_PROGRESS', () => {
      expect(instance.status).toBe('PENDING');
      instance.start();
      expect(instance.status).toBe('IN_PROGRESS');
    });

    it('应该允许 PENDING → COMPLETED', () => {
      expect(instance.status).toBe('PENDING');
      instance.complete();
      expect(instance.status).toBe('COMPLETED');
    });

    it('应该允许 PENDING → SKIPPED', () => {
      expect(instance.status).toBe('PENDING');
      instance.skip();
      expect(instance.status).toBe('SKIPPED');
    });

    it('应该允许 PENDING → EXPIRED', () => {
      expect(instance.status).toBe('PENDING');
      instance.markExpired();
      expect(instance.status).toBe('EXPIRED');
    });

    it('应该允许 IN_PROGRESS → COMPLETED', () => {
      instance.start();
      expect(instance.status).toBe('IN_PROGRESS');
      instance.complete();
      expect(instance.status).toBe('COMPLETED');
    });

    it('应该允许 IN_PROGRESS → SKIPPED', () => {
      instance.start();
      expect(instance.status).toBe('IN_PROGRESS');
      instance.skip();
      expect(instance.status).toBe('SKIPPED');
    });

    it('应该允许 IN_PROGRESS → EXPIRED', () => {
      instance.start();
      expect(instance.status).toBe('IN_PROGRESS');
      instance.markExpired();
      expect(instance.status).toBe('EXPIRED');
    });

    it('应该拒绝 COMPLETED → 任何状态', () => {
      instance.complete();
      expect(instance.status).toBe('COMPLETED');

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired();
      expect(instance.status).toBe('COMPLETED'); // 不变
    });

    it('应该拒绝 SKIPPED → 任何状态', () => {
      instance.skip();
      expect(instance.status).toBe('SKIPPED');

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired();
      expect(instance.status).toBe('SKIPPED'); // 不变
    });

    it('应该拒绝 EXPIRED → 任何状态', () => {
      instance.markExpired();
      expect(instance.status).toBe('EXPIRED');

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired();
      expect(instance.status).toBe('EXPIRED'); // 不变
    });
  });

  // ==================== 边界条件和错误处理 ====================
  describe('Edge Cases', () => {
    it('应该处理全天任务', () => {
      const allDayTimeConfig = new TaskTimeConfig({
        timeType: 'ALL_DAY' as TimeType,
        startDate: mockInstanceDate,
        endDate: mockInstanceDate + 86400000,
        timePoint: null,
        timeRange: null,
      });

      const instance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: allDayTimeConfig,
        importance: ImportanceLevel.Important,
      });

      expect(instance.timeConfig.timeType).toBe('ALL_DAY');
    });

    it('应该正确处理往返转换（ServerDTO）', () => {
      const original = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });

      original.complete(3600000, 'Test', 5);

      const dto = original.toServerDTO();
      const restored = TaskInstance.fromServerDTO(dto);

      expect(restored.id).toBe(original.id);
      expect(restored.status).toBe(original.status);
      expect(restored.completionRecord?.rating).toBe(5);
    });

    it('应该正确处理往返转换（PersistenceDTO）', () => {
      const original = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });

      original.skip('Busy');

      const dto = original.toPersistenceDTO();
      const restored = TaskInstance.fromPersistenceDTO(dto);

      expect(restored.id).toBe(original.id);
      expect(restored.status).toBe(original.status);
      expect(restored.skipRecord?.reason).toBe('Busy');
    });

    it('应该处理没有 actualStartTime 的完成', () => {
      const testInstance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });

      testInstance.complete(3600000);

      expect(testInstance.status).toBe('COMPLETED');
      expect(testInstance.completionRecord).not.toBeNull();
      expect(testInstance.completionRecord?.actualDuration).toBe(3600000);
    });

    it('应该处理极小的时间间隔', () => {
      const testInstance = TaskInstance.create({
        templateId: mockTemplateId,
        identityId: mockAccountId,
        instanceDate: mockInstanceDate,
        timeConfig: createTestTimeConfig(),
        importance: ImportanceLevel.Important,
      });

      testInstance.start();
      testInstance.complete();

      expect(testInstance.status).toBe('COMPLETED');
      expect(testInstance.completionRecord?.actualDuration).toBeGreaterThanOrEqual(0);
    });
  });
});
