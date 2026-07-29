/**
 * FocusSessionPolicy Domain Service Tests
 *
 * Pure domain tests for cross-aggregate validation rules
 * governing focus session workflows.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FocusSession } from '../../aggregates/focus-session';
import { Goal } from '../../aggregates/goal';
import { FocusSessionPolicy } from '../focus-session-policy.service';
import { IdentityId } from '@memoflow/domain-shared';

// ============================================================
// Helpers
// ============================================================

const TEST_IDENTITY = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
const OTHER_IDENTITY = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440002');

function createActiveFocusSession(): FocusSession {
  return FocusSession.create({
    identityId: TEST_IDENTITY,
    durationMinutes: 25,
    description: 'Test session',
  });
}

function createCompletedFocusSession(): FocusSession {
  const session = FocusSession.create({
    identityId: TEST_IDENTITY,
    durationMinutes: 25,
  });
  session.complete();
  return session;
}

function createCancelledFocusSession(): FocusSession {
  const session = FocusSession.create({
    identityId: TEST_IDENTITY,
    durationMinutes: 25,
  });
  session.cancel();
  return session;
}

function createTestGoal(identityId: IdentityId = TEST_IDENTITY): Goal {
  return Goal.create({
    identityId,
    name: 'Test Goal',
    description: null,
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'Moderate' as any,
    category: null,
    tags: [],
    startDate: null,
    targetDate: null,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
}

function createArchivedGoal(): Goal {
  const goal = createTestGoal();
  goal.markAsCompleted();
  goal.archive();
  return goal;
}

describe('FocusSessionPolicy', () => {
  let policy: FocusSessionPolicy;

  beforeEach(() => {
    policy = new FocusSessionPolicy();
  });

  // ============================================================
  // ensureNoActiveSession
  // ============================================================

  describe('ensureNoActiveSession()', () => {
    it('should pass for an empty array', () => {
      expect(() => policy.ensureNoActiveSession([])).not.toThrow();
    });

    it('should pass when all sessions are completed', () => {
      const sessions = [createCompletedFocusSession(), createCompletedFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).not.toThrow();
    });

    it('should pass when all sessions are cancelled', () => {
      const sessions = [createCancelledFocusSession(), createCancelledFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).not.toThrow();
    });

    it('should pass when all sessions are inactive (mix of completed/cancelled)', () => {
      const sessions = [createCompletedFocusSession(), createCancelledFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).not.toThrow();
    });

    it('should throw if any active session exists', () => {
      const sessions = [createCompletedFocusSession(), createActiveFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).toThrow();
    });

    it('should throw with a single active session', () => {
      const sessions = [createActiveFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).toThrow();
    });

    it('should throw a descriptive error message', () => {
      const sessions = [createActiveFocusSession()];

      expect(() => policy.ensureNoActiveSession(sessions)).toThrow('正在进行的专注周期');
    });
  });

  // ============================================================
  // ensureGoalIsValid
  // ============================================================

  describe('ensureGoalIsValid()', () => {
    it('should throw if goal is null', () => {
      expect(() => policy.ensureGoalIsValid(null, TEST_IDENTITY)).toThrow('目标不存在');
    });

    it('should throw if goal identityId does not match', () => {
      const goal = createTestGoal(TEST_IDENTITY);

      expect(() => policy.ensureGoalIsValid(goal, OTHER_IDENTITY)).toThrow('无权关联此目标');
    });

    it('should throw if goal is archived', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalIsValid(goal, TEST_IDENTITY)).toThrow(
        '不能关联已归档或已删除的目标',
      );
    });

    it('should pass for a valid active goal belonging to the user', () => {
      const goal = createTestGoal(TEST_IDENTITY);

      expect(() => policy.ensureGoalIsValid(goal, TEST_IDENTITY)).not.toThrow();
    });

    it('should reject a completed goal because it is auto-archived', () => {
      const goal = createTestGoal(TEST_IDENTITY);
      goal.markAsCompleted();

      expect(() => policy.ensureGoalIsValid(goal, TEST_IDENTITY)).toThrow(
        '不能关联已归档或已删除的目标',
      );
    });
  });
});
