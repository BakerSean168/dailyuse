/**
 * TaskInstance Aggregate Unit Tests
 *
 * Covers:
 * - Factory methods (create, load)
 * - State transitions (start, complete, skip, markExpired)
 * - Business logic (canStart, canComplete, canSkip, isOverdue)
 * - DTO conversion (toServerDTO, toClientDTO)
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskInstance } from '../task-instance';
import type { TaskInstanceState } from '../task-instance';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../../value-objects';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskInstanceId } from '../../../domain-shared/value-objects/task-instance-id';
import { TaskTemplateId } from '../../../domain-shared/value-objects/task-template-id';
import { IdentityId } from '@dailyuse/domain-shared';

// ─── Helpers ───────────────────────────────────────────────────────

function makeTemplateId(): TaskTemplateId {
  return TaskTemplateId.generate();
}

function makeIdentityId(): IdentityId {
  return IdentityId.generate();
}

function makeAllDayTimeConfig(date?: Date): TaskTimeConfig {
  return TaskTimeConfig.createAllDay(date ?? new Date('2025-06-15'));
}

function makeTimePointConfig(minutesFromMidnight = 540, date?: Date): TaskTimeConfig {
  return TaskTimeConfig.createTimePoint(date ?? new Date('2025-06-15'), minutesFromMidnight);
}

function makeInstance(
  overrides?: Partial<{
    templateId: TaskTemplateId;
    identityId: IdentityId;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
    importance: ImportanceLevel;
  }>,
): TaskInstance {
  return TaskInstance.create({
    templateId: overrides?.templateId ?? makeTemplateId(),
    identityId: overrides?.identityId ?? makeIdentityId(),
    instanceDate: overrides?.instanceDate ?? Date.now(),
    timeConfig: overrides?.timeConfig ?? makeAllDayTimeConfig(),
    importance: overrides?.importance ?? ImportanceLevel.Important,
  });
}

function makeState(overrides: Partial<TaskInstanceState> = {}): TaskInstanceState {
  const now = Date.now();
  return {
    id: overrides.id ?? TaskInstanceId.generate(),
    templateId: overrides.templateId ?? makeTemplateId(),
    identityId: overrides.identityId ?? makeIdentityId(),
    instanceDate: overrides.instanceDate ?? now,
    timeConfig: overrides.timeConfig ?? makeAllDayTimeConfig(),
    importance: overrides.importance ?? ImportanceLevel.Important,
    status: overrides.status ?? TaskInstanceStatus.Pending,
    completionRecord: overrides.completionRecord ?? null,
    skipRecord: overrides.skipRecord ?? null,
    actualStartTime: overrides.actualStartTime ?? null,
    actualEndTime: overrides.actualEndTime ?? null,
    note: overrides.note ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    version: overrides.version ?? 1,
    deletedAt: overrides.deletedAt ?? null,
  };
}

describe('TaskInstance Aggregate', () => {
  // ==================== Factory Methods ====================
  describe('Factory Methods', () => {
    describe('create()', () => {
      it('should create a valid TaskInstance with required params', () => {
        const templateId = makeTemplateId();
        const identityId = makeIdentityId();
        const instanceDate = Date.now();
        const timeConfig = makeAllDayTimeConfig();

        const instance = TaskInstance.create({
          templateId,
          identityId,
          instanceDate,
          timeConfig,
          importance: ImportanceLevel.Important,
        });

        expect(instance.id).toBeDefined();
        expect(typeof instance.id).toBe('string');
        expect(instance.templateId).toBe(templateId);
        expect(instance.identityId).toBe(identityId);
        expect(instance.instanceDate).toBe(instanceDate);
        expect(instance.importance).toBe(ImportanceLevel.Important);
        expect(instance.status).toBe(TaskInstanceStatus.Pending);
        expect(instance.completionRecord).toBeNull();
        expect(instance.skipRecord).toBeNull();
        expect(instance.actualStartTime).toBeNull();
        expect(instance.actualEndTime).toBeNull();
        expect(instance.note).toBeNull();
        expect(instance.version).toBe(1);
      });

      it('should generate unique IDs for each instance', () => {
        const instance1 = makeInstance();
        const instance2 = makeInstance();
        expect(instance1.id).not.toBe(instance2.id);
      });

      it('should set createdAt and updatedAt to current timestamp', () => {
        const before = Date.now();
        const instance = makeInstance();
        const after = Date.now();

        expect(instance.createdAt).toBeGreaterThanOrEqual(before);
        expect(instance.createdAt).toBeLessThanOrEqual(after);
        expect(instance.updatedAt).toBeGreaterThanOrEqual(before);
        expect(instance.updatedAt).toBeLessThanOrEqual(after);
      });

      it('should throw for missing templateId', () => {
        expect(() =>
          TaskInstance.create({
            templateId: null as any,
            identityId: makeIdentityId(),
            instanceDate: Date.now(),
            timeConfig: makeAllDayTimeConfig(),
            importance: ImportanceLevel.Important,
          }),
        ).toThrow();
      });

      it('should throw for missing identityId', () => {
        expect(() =>
          TaskInstance.create({
            templateId: makeTemplateId(),
            identityId: null as any,
            instanceDate: Date.now(),
            timeConfig: makeAllDayTimeConfig(),
            importance: ImportanceLevel.Important,
          }),
        ).toThrow();
      });

      it('should throw for invalid instanceDate', () => {
        expect(() =>
          TaskInstance.create({
            templateId: makeTemplateId(),
            identityId: makeIdentityId(),
            instanceDate: NaN,
            timeConfig: makeAllDayTimeConfig(),
            importance: ImportanceLevel.Important,
          }),
        ).toThrow();
      });

      it('should throw for missing timeConfig', () => {
        expect(() =>
          TaskInstance.create({
            templateId: makeTemplateId(),
            identityId: makeIdentityId(),
            instanceDate: Date.now(),
            timeConfig: null as any,
            importance: ImportanceLevel.Important,
          }),
        ).toThrow();
      });
    });

    describe('load()', () => {
      it('should reconstitute instance from state', () => {
        const templateId = makeTemplateId();
        const identityId = makeIdentityId();
        const now = Date.now();

        const state = makeState({
          templateId,
          identityId,
          instanceDate: now,
        });

        const instance = TaskInstance.load(state);

        expect(instance.id).toBe(state.id);
        expect(instance.templateId).toBe(templateId);
        expect(instance.identityId).toBe(identityId);
        expect(instance.status).toBe(TaskInstanceStatus.Pending);
      });

      it('should restore instance with completionRecord', () => {
        const now = Date.now();
        const completionRecord = CompletionRecord.create({
          completedAt: now,
          actualDuration: 3600000,
          note: 'Test note',
          rating: 5,
        });

        const instance = TaskInstance.load(
          makeState({
            status: TaskInstanceStatus.Completed,
            completionRecord,
          }),
        );

        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.rating).toBe(5);
      });

      it('should restore instance with skipRecord', () => {
        const skipRecord = SkipRecord.create({
          skippedAt: Date.now(),
          reason: 'Too busy',
        });

        const instance = TaskInstance.load(
          makeState({
            status: TaskInstanceStatus.Skipped,
            skipRecord,
          }),
        );

        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBe('Too busy');
      });
    });
  });

  // ==================== Business Methods ====================
  describe('Business Methods', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = makeInstance();
    });

    describe('start()', () => {
      it('should start a Pending task', () => {
        expect(instance.status).toBe(TaskInstanceStatus.Pending);
        expect(instance.actualStartTime).toBeNull();

        const before = Date.now();
        instance.start();
        const after = Date.now();

        expect(instance.status).toBe(TaskInstanceStatus.InProgress);
        expect(instance.actualStartTime).not.toBeNull();
        expect(instance.actualStartTime!).toBeGreaterThanOrEqual(before);
        expect(instance.actualStartTime!).toBeLessThanOrEqual(after);
      });

      it('should update updatedAt timestamp', () => {
        const before = Date.now();
        instance.start();
        const after = Date.now();

        expect(instance.updatedAt).toBeGreaterThanOrEqual(before);
        expect(instance.updatedAt).toBeLessThanOrEqual(after);
      });

      it('should throw when starting a non-Pending task', () => {
        instance.complete();
        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(() => instance.start()).toThrow('Cannot start task in current state');
      });
    });

    describe('complete()', () => {
      it('should complete a Pending task', () => {
        expect(instance.status).toBe(TaskInstanceStatus.Pending);

        const before = Date.now();
        instance.complete();
        const after = Date.now();

        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord!.completedAt.getTime()).toBeGreaterThanOrEqual(before);
        expect(instance.completionRecord!.completedAt.getTime()).toBeLessThanOrEqual(after);
        expect(instance.actualEndTime).not.toBeNull();
        expect(instance.actualEndTime!).toBeGreaterThanOrEqual(before);
        expect(instance.actualEndTime!).toBeLessThanOrEqual(after);
      });

      it('should complete an InProgress task', () => {
        instance.start();
        expect(instance.status).toBe(TaskInstanceStatus.InProgress);

        instance.complete();

        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(instance.completionRecord).not.toBeNull();
      });

      it('should accept optional completion parameters', () => {
        instance.complete(3600000, 'Task completed successfully', 5);

        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.actualDuration).toBe(3600000);
        expect(instance.completionRecord?.note).toBe('Task completed successfully');
        expect(instance.completionRecord?.rating).toBe(5);
        expect(instance.note).toBe('Task completed successfully');
      });

      it('should auto-compute actualDuration when started', () => {
        instance.start();

        instance.complete();

        expect(instance.completionRecord).not.toBeNull();
        expect(instance.completionRecord?.actualDuration).toBeGreaterThanOrEqual(0);
      });

      it('should throw when completing a Completed task', () => {
        instance.complete();
        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });

      it('should throw when completing a Skipped task', () => {
        instance.skip('Too busy');
        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });

      it('should throw when completing an Expired task', () => {
        instance.markExpired();
        expect(instance.status).toBe(TaskInstanceStatus.Expired);
        expect(() => instance.complete()).toThrow('Cannot complete task in current state');
      });

      it('should emit task:instance:completed domain event', () => {
        instance.complete();
        const events = instance.pullDomainEvents();
        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events.some((e) => e.eventType === 'task:instance:completed')).toBe(true);
      });
    });

    describe('skip()', () => {
      it('should skip a Pending task with reason', () => {
        expect(instance.status).toBe(TaskInstanceStatus.Pending);

        instance.skip('Too busy today');

        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBe('Too busy today');
        expect(instance.note).toBe('Too busy today');
      });

      it('should skip an InProgress task', () => {
        instance.start();
        expect(instance.status).toBe(TaskInstanceStatus.InProgress);

        instance.skip('Interrupted');

        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(instance.skipRecord).not.toBeNull();
      });

      it('should accept skip without reason', () => {
        instance.skip();

        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(instance.skipRecord).not.toBeNull();
        expect(instance.skipRecord?.reason).toBeNull();
      });

      it('should throw when skipping a Completed task', () => {
        instance.complete();
        expect(instance.status).toBe(TaskInstanceStatus.Completed);
        expect(() => instance.skip('Late')).toThrow('Cannot skip task in current state');
      });

      it('should throw when skipping a Skipped task', () => {
        instance.skip('First reason');
        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
        expect(() => instance.skip('Second reason')).toThrow('Cannot skip task in current state');
      });

      it('should throw when skipping an Expired task', () => {
        instance.markExpired();
        expect(instance.status).toBe(TaskInstanceStatus.Expired);
        expect(() => instance.skip('Late')).toThrow('Cannot skip task in current state');
      });
    });

    describe('markExpired()', () => {
      it('should expire a Pending task', () => {
        expect(instance.status).toBe(TaskInstanceStatus.Pending);

        const before = Date.now();
        instance.markExpired();
        const after = Date.now();

        expect(instance.status).toBe(TaskInstanceStatus.Expired);
        expect(instance.updatedAt).toBeGreaterThanOrEqual(before);
        expect(instance.updatedAt).toBeLessThanOrEqual(after);
      });

      it('should expire an InProgress task', () => {
        instance.start();
        expect(instance.status).toBe(TaskInstanceStatus.InProgress);

        instance.markExpired();

        expect(instance.status).toBe(TaskInstanceStatus.Expired);
      });

      it('should not expire a Completed task', () => {
        instance.complete();
        expect(instance.status).toBe(TaskInstanceStatus.Completed);

        instance.markExpired();

        expect(instance.status).toBe(TaskInstanceStatus.Completed);
      });

      it('should not expire a Skipped task', () => {
        instance.skip('Busy');
        expect(instance.status).toBe(TaskInstanceStatus.Skipped);

        instance.markExpired();

        expect(instance.status).toBe(TaskInstanceStatus.Skipped);
      });

      it('should not re-expire an already Expired task', () => {
        instance.markExpired();
        expect(instance.status).toBe(TaskInstanceStatus.Expired);
        const firstUpdatedAt = instance.updatedAt;

        instance.markExpired();

        expect(instance.status).toBe(TaskInstanceStatus.Expired);
        expect(instance.updatedAt).toBe(firstUpdatedAt);
      });
    });
  });

  // ==================== Business Logic Methods ====================
  describe('Business Logic Methods', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = makeInstance();
    });

    describe('canStart()', () => {
      it('should return true for Pending status', () => {
        expect(instance.status).toBe(TaskInstanceStatus.Pending);
        expect(instance.canStart()).toBe(true);
      });

      it('should return false for InProgress status', () => {
        instance.start();
        expect(instance.canStart()).toBe(false);
      });

      it('should return false for Completed status', () => {
        instance.complete();
        expect(instance.canStart()).toBe(false);
      });

      it('should return false for Skipped status', () => {
        instance.skip();
        expect(instance.canStart()).toBe(false);
      });

      it('should return false for Expired status', () => {
        instance.markExpired();
        expect(instance.canStart()).toBe(false);
      });
    });

    describe('canComplete()', () => {
      it('should return true for Pending status', () => {
        expect(instance.canComplete()).toBe(true);
      });

      it('should return true for InProgress status', () => {
        instance.start();
        expect(instance.canComplete()).toBe(true);
      });

      it('should return false for Completed status', () => {
        instance.complete();
        expect(instance.canComplete()).toBe(false);
      });

      it('should return false for Skipped status', () => {
        instance.skip();
        expect(instance.canComplete()).toBe(false);
      });

      it('should return false for Expired status', () => {
        instance.markExpired();
        expect(instance.canComplete()).toBe(false);
      });
    });

    describe('canSkip()', () => {
      it('should return true for Pending status', () => {
        expect(instance.canSkip()).toBe(true);
      });

      it('should return true for InProgress status', () => {
        instance.start();
        expect(instance.canSkip()).toBe(true);
      });

      it('should return false for Completed status', () => {
        instance.complete();
        expect(instance.canSkip()).toBe(false);
      });

      it('should return false for Skipped status', () => {
        instance.skip();
        expect(instance.canSkip()).toBe(false);
      });

      it('should return false for Expired status', () => {
        instance.markExpired();
        expect(instance.canSkip()).toBe(false);
      });
    });

    describe('isOverdue()', () => {
      it('should return true for Pending task past due', () => {
        const overdueInstance = makeInstance({
          instanceDate: Date.now() - 86400000 - 1000, // more than 1 day ago
        });

        expect(overdueInstance.status).toBe(TaskInstanceStatus.Pending);
        expect(overdueInstance.isOverdue()).toBe(true);
      });

      it('should return true for InProgress task past due', () => {
        const overdueInstance = makeInstance({
          instanceDate: Date.now() - 86400000 - 1000,
        });

        overdueInstance.start();
        expect(overdueInstance.status).toBe(TaskInstanceStatus.InProgress);
        expect(overdueInstance.isOverdue()).toBe(true);
      });

      it('should return false for Pending task not yet due', () => {
        const freshInstance = makeInstance({
          instanceDate: Date.now(),
        });

        expect(freshInstance.status).toBe(TaskInstanceStatus.Pending);
        expect(freshInstance.isOverdue()).toBe(false);
      });

      it('should return false for Completed task even if past due', () => {
        const overdueInstance = makeInstance({
          instanceDate: Date.now() - 86400000 - 1000,
        });

        overdueInstance.complete();
        expect(overdueInstance.status).toBe(TaskInstanceStatus.Completed);
        expect(overdueInstance.isOverdue()).toBe(false);
      });

      it('should return false for Skipped task even if past due', () => {
        const overdueInstance = makeInstance({
          instanceDate: Date.now() - 86400000 - 1000,
        });

        overdueInstance.skip();
        expect(overdueInstance.status).toBe(TaskInstanceStatus.Skipped);
        expect(overdueInstance.isOverdue()).toBe(false);
      });

      it('should return false for Expired task', () => {
        const overdueInstance = makeInstance({
          instanceDate: Date.now() - 86400000 - 1000,
        });

        overdueInstance.markExpired();
        expect(overdueInstance.status).toBe(TaskInstanceStatus.Expired);
        expect(overdueInstance.isOverdue()).toBe(false);
      });
    });

    describe('dueDate (computed)', () => {
      it('should compute dueDate from AllDay timeConfig', () => {
        const instanceDate = new Date('2025-06-15').getTime();
        const inst = makeInstance({
          instanceDate,
          timeConfig: makeAllDayTimeConfig(new Date('2025-06-15')),
        });

        // AllDay: instanceDate + 86400000 - 1
        expect(inst.dueDate).toBe(instanceDate + 86400000 - 1);
      });

      it('should compute dueDate from TimePoint timeConfig', () => {
        const instanceDate = new Date('2025-06-15').getTime();
        const minutesFromMidnight = 540; // 9:00 AM
        const inst = makeInstance({
          instanceDate,
          timeConfig: makeTimePointConfig(minutesFromMidnight, new Date('2025-06-15')),
        });

        // TimePoint: the timePoint value itself
        expect(inst.dueDate).toBe(minutesFromMidnight);
      });
    });
  });

  // ==================== DTO Conversion ====================
  describe('DTO Conversion', () => {
    let instance: TaskInstance;
    let templateId: TaskTemplateId;
    let identityId: IdentityId;
    const instanceDate = Date.now();

    beforeEach(() => {
      templateId = makeTemplateId();
      identityId = makeIdentityId();
      instance = TaskInstance.create({
        templateId,
        identityId,
        instanceDate,
        timeConfig: makeAllDayTimeConfig(),
        importance: ImportanceLevel.Important,
      });
    });

    describe('toServerDTO()', () => {
      it('should convert to ServerDTO with correct fields', () => {
        const dto = instance.toServerDTO();

        expect(dto.id).toBe(instance.id.toString());
        expect(dto.templateId).toBe(templateId.toString());
        expect(dto.identityId).toBe(identityId.toString());
        expect(dto.instanceDate).toBe(instanceDate);
        expect(dto.status).toBe(TaskInstanceStatus.Pending);
        expect(dto.importance).toBe(ImportanceLevel.Important);
        expect(dto.timeConfig).toBeDefined();
        expect(dto.actualStartTime).toBeNull();
        expect(dto.actualEndTime).toBeNull();
        expect(dto.comment).toBeNull(); // note maps to comment
        expect(dto.createdAt).toBe(instance.createdAt);
        expect(dto.updatedAt).toBe(instance.updatedAt);
        expect(dto.version).toBe(1);
        expect(dto.deletedAt).toBeNull();
      });

      it('should include comment when note is set via complete()', () => {
        instance.complete(3600000, 'Done well', 5);
        const dto = instance.toServerDTO();

        expect(dto.comment).toBe('Done well');
      });

      it('should include comment when note is set via skip()', () => {
        instance.skip('Too busy');
        const dto = instance.toServerDTO();

        expect(dto.comment).toBe('Too busy');
      });

      it('should reflect InProgress status after start()', () => {
        instance.start();
        const dto = instance.toServerDTO();

        expect(dto.status).toBe(TaskInstanceStatus.InProgress);
        expect(dto.actualStartTime).not.toBeNull();
      });

      it('should reflect Completed status after complete()', () => {
        instance.complete();
        const dto = instance.toServerDTO();

        expect(dto.status).toBe(TaskInstanceStatus.Completed);
        expect(dto.actualEndTime).not.toBeNull();
      });
    });

    describe('toClientDTO()', () => {
      it('should convert to ClientDTO with correct fields', () => {
        const dto = instance.toClientDTO();

        expect(dto.id).toBe(instance.id.toString());
        expect(dto.templateId).toBe(templateId.toString());
        expect(dto.identityId).toBe(identityId.toString());
        expect(dto.instanceDate).toBe(instanceDate);
        expect(dto.status).toBe(TaskInstanceStatus.Pending);
        expect(dto.timeConfig).toBeDefined();
        expect(dto.actualStartTime).toBeNull();
        expect(dto.actualEndTime).toBeNull();
        expect(dto.comment).toBeNull();
        expect(dto.version).toBe(1);
      });

      it('should reflect status changes', () => {
        instance.start();
        let dto = instance.toClientDTO();
        expect(dto.status).toBe(TaskInstanceStatus.InProgress);

        instance.complete();
        dto = instance.toClientDTO();
        expect(dto.status).toBe(TaskInstanceStatus.Completed);
      });

      it('should include comment on completed instance', () => {
        instance.complete(0, 'Test note');
        const dto = instance.toClientDTO();
        expect(dto.comment).toBe('Test note');
      });
    });
  });

  // ==================== State Transitions ====================
  describe('State Transitions', () => {
    let instance: TaskInstance;

    beforeEach(() => {
      instance = makeInstance();
    });

    it('should allow Pending → InProgress', () => {
      expect(instance.status).toBe(TaskInstanceStatus.Pending);
      instance.start();
      expect(instance.status).toBe(TaskInstanceStatus.InProgress);
    });

    it('should allow Pending → Completed', () => {
      expect(instance.status).toBe(TaskInstanceStatus.Pending);
      instance.complete();
      expect(instance.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should allow Pending → Skipped', () => {
      expect(instance.status).toBe(TaskInstanceStatus.Pending);
      instance.skip();
      expect(instance.status).toBe(TaskInstanceStatus.Skipped);
    });

    it('should allow Pending → Expired', () => {
      expect(instance.status).toBe(TaskInstanceStatus.Pending);
      instance.markExpired();
      expect(instance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should allow InProgress → Completed', () => {
      instance.start();
      expect(instance.status).toBe(TaskInstanceStatus.InProgress);
      instance.complete();
      expect(instance.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should allow InProgress → Skipped', () => {
      instance.start();
      expect(instance.status).toBe(TaskInstanceStatus.InProgress);
      instance.skip();
      expect(instance.status).toBe(TaskInstanceStatus.Skipped);
    });

    it('should allow InProgress → Expired', () => {
      instance.start();
      expect(instance.status).toBe(TaskInstanceStatus.InProgress);
      instance.markExpired();
      expect(instance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should reject transitions from Completed', () => {
      instance.complete();
      expect(instance.status).toBe(TaskInstanceStatus.Completed);

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired(); // no-op
      expect(instance.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should reject transitions from Skipped', () => {
      instance.skip();
      expect(instance.status).toBe(TaskInstanceStatus.Skipped);

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired(); // no-op
      expect(instance.status).toBe(TaskInstanceStatus.Skipped);
    });

    it('should reject transitions from Expired', () => {
      instance.markExpired();
      expect(instance.status).toBe(TaskInstanceStatus.Expired);

      expect(() => instance.start()).toThrow();
      expect(() => instance.complete()).toThrow();
      expect(() => instance.skip()).toThrow();
      instance.markExpired(); // no-op
      expect(instance.status).toBe(TaskInstanceStatus.Expired);
    });
  });

  // ==================== Domain Events ====================
  describe('Domain Events', () => {
    it('should emit task:instance:completed event on completion', () => {
      const instance = makeInstance();
      instance.complete();

      const events = instance.pullDomainEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);

      const completeEvent = events.find((e) => e.eventType === 'task:instance:completed');
      expect(completeEvent).toBeDefined();
      expect(completeEvent!.aggregateId).toBe(instance.id);
    });

    it('should clear events after pull', () => {
      const instance = makeInstance();
      instance.complete();

      instance.pullDomainEvents();
      expect(instance.domainEvents).toHaveLength(0);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle all-day time config', () => {
      const instance = makeInstance({
        timeConfig: makeAllDayTimeConfig(),
      });

      expect(instance.timeConfig.timeType).toBe('AllDay');
    });

    it('should handle time-point config', () => {
      const instance = makeInstance({
        timeConfig: makeTimePointConfig(600),
      });

      expect(instance.timeConfig.timeType).toBe('TimePoint');
    });

    it('should handle round-trip via ServerDTO → load', () => {
      const original = makeInstance();
      original.complete(3600000, 'Test', 5);

      const dto = original.toServerDTO();
      const restored = TaskInstance.load({
        id: TaskInstanceId.of(dto.id),
        templateId: TaskTemplateId.of(dto.templateId),
        identityId: IdentityId.of(dto.identityId),
        instanceDate: dto.instanceDate,
        timeConfig: TaskTimeConfig.fromDTO(dto.timeConfig),
        importance: dto.importance as ImportanceLevel,
        priority: dto.priority,
        status: dto.status as TaskInstanceStatus,
        completionRecord: original.completionRecord,
        skipRecord: null,
        actualStartTime: dto.actualStartTime,
        actualEndTime: dto.actualEndTime,
        note: dto.comment,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        version: dto.version,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      });

      expect(restored.id.toString()).toBe(original.id.toString());
      expect(restored.status).toBe(original.status);
      expect(restored.completionRecord?.rating).toBe(5);
    });

    it('should handle complete without start (no actualStartTime)', () => {
      const instance = makeInstance();

      instance.complete(3600000);

      expect(instance.status).toBe(TaskInstanceStatus.Completed);
      expect(instance.completionRecord).not.toBeNull();
      expect(instance.completionRecord?.actualDuration).toBe(3600000);
    });

    it('should handle very small time intervals', () => {
      const instance = makeInstance();

      instance.start();
      instance.complete();

      expect(instance.status).toBe(TaskInstanceStatus.Completed);
      expect(instance.completionRecord?.actualDuration).toBeGreaterThanOrEqual(0);
    });

    it('should preserve deletedAt on loaded instance', () => {
      const deletedAt = new Date('2025-06-15');
      const instance = TaskInstance.load(makeState({ deletedAt }));

      expect(instance.deletedAt).toEqual(deletedAt);
    });

    it('should use different importance levels', () => {
      for (const level of [
        ImportanceLevel.Vital,
        ImportanceLevel.Important,
        ImportanceLevel.Moderate,
        ImportanceLevel.Minor,
        ImportanceLevel.Trivial,
      ]) {
        const inst = makeInstance({ importance: level });
        expect(inst.importance).toBe(level);
      }
    });
  });
});
