/**
 * GoalPolicy Domain Service Tests
 *
 * Pure domain tests — no mocks needed.
 * Tests cross-aggregate validation rules for Goal workflows.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Goal } from '../../aggregates/goal';
import { GoalPolicy } from '../goal-policy.service';
import { GoalArchivedError } from '../../value-objects';

// ============================================================
// Helper: Create a Goal aggregate for testing
// ============================================================

function createTestGoal(opts?: { name?: string }): Goal {
  return Goal.create({
    identityId: 'test-identity-id' as any,
    name: opts?.name ?? 'Test Goal',
    description: null,
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

function createArchivedGoal(): Goal {
  const goal = createTestGoal({ name: 'Archived Goal' });
  goal.markAsCompleted();
  goal.archive();
  return goal;
}

function createCompletedGoal(): Goal {
  const goal = createTestGoal({ name: 'Completed Goal' });
  goal.markAsCompleted();
  return goal;
}

describe('GoalPolicy', () => {
  let policy: GoalPolicy;

  beforeEach(() => {
    policy = new GoalPolicy();
  });

  // ============================================================
  // ensureGoalCanBeModified
  // ============================================================

  describe('ensureGoalCanBeModified()', () => {
    it('should pass for an active goal', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBeModified(goal)).not.toThrow();
    });

    it('should pass for a completed goal', () => {
      const goal = createCompletedGoal();

      expect(() => policy.ensureGoalCanBeModified(goal)).not.toThrow();
    });

    it('should throw GoalArchivedError when goal has archivedAt set', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBeModified(goal)).toThrow(GoalArchivedError);
    });

    it('should throw GoalArchivedError when goal status is Archived', () => {
      const goal = createArchivedGoal();
      // After archive(), both archivedAt and status are set to Archived
      expect(goal.status).toBe('Archived');

      expect(() => policy.ensureGoalCanBeModified(goal)).toThrow(GoalArchivedError);
    });

    it('should include goal id in the error message', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBeModified(goal)).toThrow(goal.id);
    });
  });

  // ============================================================
  // ensureGoalCanBeArchived
  // ============================================================

  describe('ensureGoalCanBeArchived()', () => {
    it('should pass for a completed goal', () => {
      const goal = createCompletedGoal();

      expect(() => policy.ensureGoalCanBeArchived(goal)).not.toThrow();
    });

    it('should throw GoalArchivedError if goal is already archived', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBeArchived(goal)).toThrow(GoalArchivedError);
    });

    it('should throw Error for active goals (must complete first)', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBeArchived(goal)).toThrow(
        'Active goals must be completed before archiving',
      );
    });

    it('should not throw for completed goal without archivedAt', () => {
      const goal = createCompletedGoal();
      expect(goal.archivedAt).toBeNull();

      expect(() => policy.ensureGoalCanBeArchived(goal)).not.toThrow();
    });
  });

  // ============================================================
  // ensureGoalCanBePermanentlyDeleted
  // ============================================================

  describe('ensureGoalCanBePermanentlyDeleted()', () => {
    it('should pass for an archived goal', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBePermanentlyDeleted(goal)).not.toThrow();
    });

    it('should throw if goal is not archived (active)', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBePermanentlyDeleted(goal)).toThrow(
        'must be archived before it can be permanently deleted',
      );
    });

    it('should throw if goal is completed but not archived', () => {
      const goal = createCompletedGoal();

      expect(() => policy.ensureGoalCanBePermanentlyDeleted(goal)).toThrow(
        'must be archived before it can be permanently deleted',
      );
    });

    it('should include goal id in the error message', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBePermanentlyDeleted(goal)).toThrow(goal.id);
    });
  });

  // ============================================================
  // ensureGoalCanBeActivated
  // ============================================================

  describe('ensureGoalCanBeActivated()', () => {
    it('should pass for an active goal', () => {
      const goal = createTestGoal();

      expect(() => policy.ensureGoalCanBeActivated(goal)).not.toThrow();
    });

    it('should pass for a completed goal', () => {
      const goal = createCompletedGoal();

      expect(() => policy.ensureGoalCanBeActivated(goal)).not.toThrow();
    });

    it('should throw GoalArchivedError if goal is archived', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBeActivated(goal)).toThrow(GoalArchivedError);
    });

    it('should include goal id in the error message', () => {
      const goal = createArchivedGoal();

      expect(() => policy.ensureGoalCanBeActivated(goal)).toThrow(goal.id);
    });
  });

  // ============================================================
  // ensureParentGoalValid
  // ============================================================

  describe('ensureParentGoalValid()', () => {
    it('should pass for null parent', () => {
      expect(() => policy.ensureParentGoalValid(null)).not.toThrow();
    });

    it('should pass for undefined parent', () => {
      expect(() => policy.ensureParentGoalValid(undefined)).not.toThrow();
    });

    it('should pass for an active parent goal', () => {
      const parent = createTestGoal({ name: 'Parent Goal' });

      expect(() => policy.ensureParentGoalValid(parent)).not.toThrow();
    });

    it('should pass for a completed parent goal', () => {
      const parent = createCompletedGoal();

      expect(() => policy.ensureParentGoalValid(parent)).not.toThrow();
    });

    it('should throw GoalArchivedError if parent is archived (by archivedAt)', () => {
      const parent = createArchivedGoal();

      expect(() => policy.ensureParentGoalValid(parent)).toThrow(GoalArchivedError);
    });

    it('should throw GoalArchivedError if parent has Archived status', () => {
      const parent = createArchivedGoal();
      expect(parent.status).toBe('Archived');

      expect(() => policy.ensureParentGoalValid(parent)).toThrow(GoalArchivedError);
    });
  });
});
