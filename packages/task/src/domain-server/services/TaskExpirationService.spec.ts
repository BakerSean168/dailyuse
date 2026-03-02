/**
 * TaskExpirationService Tests
 *
 * Tests the domain service that checks and marks expired task instances.
 * Pure domain logic — no persistence, no external dependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskExpirationService } from './TaskExpirationService';
import { TaskInstance } from '../aggregates';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { TaskInstanceId } from '../../domain-shared/value-objects/task-instance-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTimeConfig } from '../value-objects';
import type { TaskInstanceState } from '../aggregates/task-instance';

// ─── Helpers ────────────────────────────────────────────────────────

const DAY_MS = 86400000;

/**
 * Build a TaskInstanceState for loading via TaskInstance.load().
 * instanceDate controls overdue logic: now > instanceDate + 1 day => overdue.
 */
function buildInstanceState(overrides: Partial<TaskInstanceState> = {}): TaskInstanceState {
  const now = Date.now();
  return {
    id: TaskInstanceId.generate(),
    templateId: TaskTemplateId.generate(),
    identityId: IdentityId.generate(),
    instanceDate: now, // default: today (not overdue yet)
    timeConfig: TaskTimeConfig.createAllDay(new Date()),
    importance: ImportanceLevel.Moderate,
    priority: undefined,
    status: TaskInstanceStatus.Pending,
    completionRecord: null,
    skipRecord: null,
    actualStartTime: null,
    actualEndTime: null,
    note: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

function createPendingOverdueInstance(): TaskInstance {
  // instanceDate 2 days ago => isOverdue() returns true
  return TaskInstance.load(
    buildInstanceState({
      instanceDate: Date.now() - 2 * DAY_MS,
      status: TaskInstanceStatus.Pending,
    }),
  );
}

function createInProgressOverdueInstance(): TaskInstance {
  return TaskInstance.load(
    buildInstanceState({
      instanceDate: Date.now() - 2 * DAY_MS,
      status: TaskInstanceStatus.InProgress,
      actualStartTime: Date.now() - 2 * DAY_MS,
    }),
  );
}

function createPendingNotOverdueInstance(): TaskInstance {
  // instanceDate is today — not overdue yet (needs > 1 day past)
  return TaskInstance.load(
    buildInstanceState({
      instanceDate: Date.now(),
      status: TaskInstanceStatus.Pending,
    }),
  );
}

function createCompletedInstance(): TaskInstance {
  return TaskInstance.load(
    buildInstanceState({
      status: TaskInstanceStatus.Completed,
      instanceDate: Date.now() - 2 * DAY_MS, // old, but completed
    }),
  );
}

function createSkippedInstance(): TaskInstance {
  return TaskInstance.load(
    buildInstanceState({
      status: TaskInstanceStatus.Skipped,
      instanceDate: Date.now() - 2 * DAY_MS,
    }),
  );
}

function createExpiredInstance(): TaskInstance {
  return TaskInstance.load(
    buildInstanceState({
      status: TaskInstanceStatus.Expired,
      instanceDate: Date.now() - 5 * DAY_MS,
    }),
  );
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('TaskExpirationService', () => {
  let service: TaskExpirationService;

  beforeEach(() => {
    service = new TaskExpirationService();
  });

  // ─── markExpiredInstances ───────────────────────────────────────

  describe('markExpiredInstances', () => {
    it('should mark overdue Pending instances as Expired', () => {
      const overdueInstance = createPendingOverdueInstance();
      const result = service.markExpiredInstances([overdueInstance]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(overdueInstance);
      expect(overdueInstance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should mark overdue InProgress instances as Expired', () => {
      const overdueInstance = createInProgressOverdueInstance();
      const result = service.markExpiredInstances([overdueInstance]);

      expect(result).toHaveLength(1);
      expect(overdueInstance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should NOT mark non-overdue Pending instances', () => {
      const freshInstance = createPendingNotOverdueInstance();
      const result = service.markExpiredInstances([freshInstance]);

      expect(result).toHaveLength(0);
      expect(freshInstance.status).toBe(TaskInstanceStatus.Pending);
    });

    it('should NOT mark already Completed instances', () => {
      const completedInstance = createCompletedInstance();
      const result = service.markExpiredInstances([completedInstance]);

      expect(result).toHaveLength(0);
      expect(completedInstance.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should NOT mark already Skipped instances', () => {
      const skippedInstance = createSkippedInstance();
      const result = service.markExpiredInstances([skippedInstance]);

      expect(result).toHaveLength(0);
      expect(skippedInstance.status).toBe(TaskInstanceStatus.Skipped);
    });

    it('should NOT mark already Expired instances', () => {
      const expiredInstance = createExpiredInstance();
      const result = service.markExpiredInstances([expiredInstance]);

      expect(result).toHaveLength(0);
      // Status stays Expired (no double-mark)
      expect(expiredInstance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should handle empty array', () => {
      const result = service.markExpiredInstances([]);
      expect(result).toHaveLength(0);
    });

    it('should return only the instances that were actually expired', () => {
      const overdue1 = createPendingOverdueInstance();
      const overdue2 = createInProgressOverdueInstance();
      const fresh = createPendingNotOverdueInstance();
      const completed = createCompletedInstance();

      const result = service.markExpiredInstances([overdue1, overdue2, fresh, completed]);

      expect(result).toHaveLength(2);
      expect(result).toContain(overdue1);
      expect(result).toContain(overdue2);
      expect(overdue1.status).toBe(TaskInstanceStatus.Expired);
      expect(overdue2.status).toBe(TaskInstanceStatus.Expired);
      expect(fresh.status).toBe(TaskInstanceStatus.Pending);
      expect(completed.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should handle mixed list with no overdue instances', () => {
      const fresh = createPendingNotOverdueInstance();
      const completed = createCompletedInstance();
      const skipped = createSkippedInstance();

      const result = service.markExpiredInstances([fresh, completed, skipped]);
      expect(result).toHaveLength(0);
    });
  });

  // ─── checkAndMarkExpiration ────────────────────────────────────

  describe('checkAndMarkExpiration', () => {
    it('should return true and mark overdue Pending instance', () => {
      const instance = createPendingOverdueInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(true);
      expect(instance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should return true and mark overdue InProgress instance', () => {
      const instance = createInProgressOverdueInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(true);
      expect(instance.status).toBe(TaskInstanceStatus.Expired);
    });

    it('should return false for non-overdue Pending instance', () => {
      const instance = createPendingNotOverdueInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(false);
      expect(instance.status).toBe(TaskInstanceStatus.Pending);
    });

    it('should return false for Completed instance', () => {
      const instance = createCompletedInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(false);
      expect(instance.status).toBe(TaskInstanceStatus.Completed);
    });

    it('should return false for Skipped instance', () => {
      const instance = createSkippedInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(false);
      expect(instance.status).toBe(TaskInstanceStatus.Skipped);
    });

    it('should return false for already Expired instance', () => {
      const instance = createExpiredInstance();
      const wasExpired = service.checkAndMarkExpiration(instance);

      expect(wasExpired).toBe(false);
    });
  });

  // ─── countExpiredInstances ─────────────────────────────────────

  describe('countExpiredInstances', () => {
    it('should return 0 for empty array', () => {
      expect(service.countExpiredInstances([])).toBe(0);
    });

    it('should count only Expired status instances', () => {
      const expired1 = createExpiredInstance();
      const expired2 = createExpiredInstance();
      const pending = createPendingNotOverdueInstance();
      const completed = createCompletedInstance();

      const count = service.countExpiredInstances([expired1, expired2, pending, completed]);
      expect(count).toBe(2);
    });

    it('should return 0 when no instances are Expired', () => {
      const pending = createPendingNotOverdueInstance();
      const completed = createCompletedInstance();

      const count = service.countExpiredInstances([pending, completed]);
      expect(count).toBe(0);
    });

    it('should count instances that were just marked expired', () => {
      const overdue = createPendingOverdueInstance();

      // Before marking
      expect(service.countExpiredInstances([overdue])).toBe(0);

      // Mark it
      service.checkAndMarkExpiration(overdue);

      // After marking
      expect(service.countExpiredInstances([overdue])).toBe(1);
    });
  });
});
