/**
 * TaskDependency 聚合根单元测试
 *
 * 测试覆盖：
 * - 工厂方法 (create, fromServerDTO, fromPersistenceDTO)
 * - 业务方法 (updateDependencyType, updateLagDays)
 * - 查询方法 (involvesTasks, isPredecessorOf, isSuccessorOf)
 * - DTO 转换 (toServerDTO, toPersistenceDTO)
 * - 验证逻辑和边界条件
 *
 * 目标覆盖率: 90%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskDependency } from '../task-dependency';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import { DependencyType } from '@dailyuse/contracts/task';

describe('TaskDependency Aggregate', () => {
  // ==================== 测试数据 ====================
  const mockPredecessorUuid = 'task-predecessor-uuid-123';
  const mockSuccessorUuid = 'task-successor-uuid-456';
  const mockDependencyType: DependencyType = 'FINISH_TO_START';

  // ==================== 工厂方法测试 ====================
  describe('Factory Methods', () => {
    describe('create()', () => {
      it('应该创建有效的 TaskDependency', () => {
        const dependency = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
        });

        expect(dependency.uuid).toBeDefined();
        expect(typeof dependency.uuid).toBe('string');
        expect(dependency.uuid.length).toBeGreaterThan(0);
        expect(dependency.predecessorTaskUuid).toBe(mockPredecessorUuid);
        expect(dependency.successorTaskUuid).toBe(mockSuccessorUuid);
        expect(dependency.dependencyType).toBe(mockDependencyType);
        expect(dependency.lagDays).toBeUndefined();
        expect(dependency.createdAt).toBeInstanceOf(Date);
        expect(dependency.updatedAt).toBeInstanceOf(Date);
      });

      it('应该为每个依赖生成唯一的 UUID', () => {
        const dependency1 = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
        });

        const dependency2 = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
        });

        expect(dependency1.uuid).not.toBe(dependency2.uuid);
      });

      it('应该支持设置延迟天数', () => {
        const dependency = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
          lagDays: 3,
        });

        expect(dependency.lagDays).toBe(3);
      });

      it('应该拒绝任务自己依赖自己', () => {
        expect(() => {
          TaskDependency.create({
            predecessorTaskUuid: mockPredecessorUuid,
            successorTaskUuid: mockPredecessorUuid,
            dependencyType: mockDependencyType,
          });
        }).toThrow('Task cannot depend on itself');
      });

      it('应该拒绝负数的延迟天数', () => {
        expect(() => {
          TaskDependency.create({
            predecessorTaskUuid: mockPredecessorUuid,
            successorTaskUuid: mockSuccessorUuid,
            dependencyType: mockDependencyType,
            lagDays: -1,
          });
        }).toThrow('Lag days cannot be negative');
      });

      it('应该发布领域事件', () => {
        const dependency = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
        });

        const events = dependency.getDomainEvents();
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].eventType).toBe('task.dependency.created');
      });
    });

    describe('fromServerDTO()', () => {
      it('应该从 ServerDTO 正确恢复依赖', () => {
        const now = new Date();
        const dto: TaskDependencyServerDTO = {
          uuid: 'test-uuid',
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType,
          lagDays: 5,
          createdAt: now,
          updatedAt: now,
        };

        const dependency = TaskDependency.fromServerDTO(dto);

        expect(dependency.uuid).toBe('test-uuid');
        expect(dependency.predecessorTaskUuid).toBe(mockPredecessorUuid);
        expect(dependency.successorTaskUuid).toBe(mockSuccessorUuid);
        expect(dependency.dependencyType).toBe(mockDependencyType);
        expect(dependency.lagDays).toBe(5);
      });
    });

    describe('fromPersistenceDTO()', () => {
      it('应该从 PersistenceDTO 正确恢复依赖', () => {
        const now = Date.now();
        const dto = {
          uuid: 'test-uuid',
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: mockDependencyType as DependencyType,
          lagDays: 3,
          createdAt: now,
          updatedAt: now,
        };

        const dependency = TaskDependency.fromPersistenceDTO(dto);

        expect(dependency.uuid).toBe('test-uuid');
        expect(dependency.predecessorTaskUuid).toBe(mockPredecessorUuid);
        expect(dependency.lagDays).toBe(3);
      });
    });
  });

  // ==================== 业务方法测试 ====================
  describe('Business Methods', () => {
    let dependency: TaskDependency;

    beforeEach(() => {
      dependency = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: mockDependencyType,
        lagDays: 2,
      });
      dependency.clearDomainEvents();
    });

    describe('updateDependencyType()', () => {
      it('应该更新依赖类型', () => {
        dependency.updateDependencyType('START_TO_START');
        expect(dependency.dependencyType).toBe('START_TO_START');
      });

      it('应该发布领域事件', () => {
        dependency.updateDependencyType('FINISH_TO_FINISH');
        const events = dependency.getDomainEvents();
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('task.dependency.updated');
      });

      it('相同类型不应该更新', () => {
        const oldUpdatedAt = dependency.updatedAt;
        dependency.updateDependencyType(mockDependencyType);
        expect(dependency.updatedAt).toEqual(oldUpdatedAt);
        expect(dependency.getDomainEvents().length).toBe(0);
      });
    });

    describe('updateLagDays()', () => {
      it('应该更新延迟天数', () => {
        dependency.updateLagDays(5);
        expect(dependency.lagDays).toBe(5);
      });

      it('应该拒绝负数的延迟天数', () => {
        expect(() => {
          dependency.updateLagDays(-1);
        }).toThrow('Lag days cannot be negative');
      });

      it('应该发布领域事件', () => {
        dependency.updateLagDays(10);
        const events = dependency.getDomainEvents();
        expect(events.length).toBe(1);
      });
    });
  });

  // ==================== 查询方法测试 ====================
  describe('Query Methods', () => {
    let dependency: TaskDependency;

    beforeEach(() => {
      dependency = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: mockDependencyType,
      });
    });

    describe('involvesTasks()', () => {
      it('应该识别前置任务', () => {
        expect(dependency.involvesTasks(mockPredecessorUuid)).toBe(true);
      });

      it('应该识别后续任务', () => {
        expect(dependency.involvesTasks(mockSuccessorUuid)).toBe(true);
      });

      it('不相关的任务应该返回 false', () => {
        expect(dependency.involvesTasks('unrelated-task-uuid')).toBe(false);
      });
    });

    describe('isPredecessorOf()', () => {
      it('应该正确识别是某任务的前置依赖', () => {
        expect(dependency.isPredecessorOf(mockSuccessorUuid)).toBe(true);
      });

      it('不是某任务的前置依赖应该返回 false', () => {
        expect(dependency.isPredecessorOf(mockPredecessorUuid)).toBe(false);
      });
    });

    describe('isSuccessorOf()', () => {
      it('应该正确识别是某任务的后续依赖', () => {
        expect(dependency.isSuccessorOf(mockPredecessorUuid)).toBe(true);
      });

      it('不是某任务的后续依赖应该返回 false', () => {
        expect(dependency.isSuccessorOf(mockSuccessorUuid)).toBe(false);
      });
    });
  });

  // ==================== DTO 转换测试 ====================
  describe('DTO Conversion', () => {
    let dependency: TaskDependency;

    beforeEach(() => {
      dependency = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: mockDependencyType,
        lagDays: 3,
      });
    });

    describe('toServerDTO()', () => {
      it('应该正确转换为 ServerDTO', () => {
        const dto = dependency.toServerDTO();

        expect(dto.uuid).toBe(dependency.uuid);
        expect(dto.predecessorTaskUuid).toBe(mockPredecessorUuid);
        expect(dto.successorTaskUuid).toBe(mockSuccessorUuid);
        expect(dto.lagDays).toBe(3);
      });
    });

    describe('toPersistenceDTO()', () => {
      it('应该正确转换为 PersistenceDTO', () => {
        const dto = dependency.toPersistenceDTO();

        expect(dto.uuid).toBe(dependency.uuid);
        expect(dto.predecessorTaskUuid).toBe(mockPredecessorUuid);
        expect(typeof dto.createdAt).toBe('number');
        expect(typeof dto.updatedAt).toBe('number');
      });
    });
  });

  // ==================== 往返转换测试 ====================
  describe('Round-trip Conversion', () => {
    it('应该正确处理 ServerDTO 往返转换', () => {
      const original = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: 'START_TO_START',
        lagDays: 5,
      });

      const dto = original.toServerDTO();
      const restored = TaskDependency.fromServerDTO(dto);

      expect(restored.uuid).toBe(original.uuid);
      expect(restored.predecessorTaskUuid).toBe(original.predecessorTaskUuid);
      expect(restored.lagDays).toBe(original.lagDays);
    });

    it('应该正确处理 PersistenceDTO 往返转换', () => {
      const original = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: 'FINISH_TO_FINISH',
        lagDays: 10,
      });

      const dto = original.toPersistenceDTO();
      const restored = TaskDependency.fromPersistenceDTO(dto);

      expect(restored.uuid).toBe(original.uuid);
      expect(restored.lagDays).toBe(original.lagDays);
    });
  });

  // ==================== 边界条件测试 ====================
  describe('Edge Cases', () => {
    it('应该处理所有依赖类型', () => {
      const types: DependencyType[] = [
        'FINISH_TO_START',
        'START_TO_START',
        'FINISH_TO_FINISH',
        'START_TO_FINISH',
      ];

      types.forEach((type) => {
        const dependency = TaskDependency.create({
          predecessorTaskUuid: mockPredecessorUuid,
          successorTaskUuid: mockSuccessorUuid,
          dependencyType: type,
        });

        expect(dependency.dependencyType).toBe(type);
      });
    });

    it('应该处理极大的延迟天数', () => {
      const dependency = TaskDependency.create({
        predecessorTaskUuid: mockPredecessorUuid,
        successorTaskUuid: mockSuccessorUuid,
        dependencyType: mockDependencyType,
        lagDays: 9999,
      });

      expect(dependency.lagDays).toBe(9999);
    });
  });
});
