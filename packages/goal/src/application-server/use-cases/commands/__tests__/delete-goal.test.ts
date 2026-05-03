import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/domain-server';
import { DeleteGoalUseCase } from '../delete-goal.use-case';

// ============================================================
// Helpers
// ============================================================

function createTestGoal(name = 'Test Goal'): Goal {
  return Goal.create({
    identityId: 'test-identity-id' as any,
    name,
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

function createCompletedGoal(name = 'Completed Goal'): Goal {
  const goal = createTestGoal(name);
  goal.markAsCompleted();
  return goal;
}

describe('DeleteGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: DeleteGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new DeleteGoalUseCase(goalRepo, new GoalPolicy());
  });

  describe('execute()', () => {
    it('should return NOT_FOUND when goal does not exist', async () => {
      vi.mocked(goalRepo.findById).mockResolvedValue(null);

      const result = await useCase.execute('non-existent');

      expect(result).toBeErrorWithCode('NOT_FOUND');
      expect(goalRepo.save).not.toHaveBeenCalled();
    });

    it('should soft delete a completed goal', async () => {
      const goal = createCompletedGoal();
      vi.mocked(goalRepo.findById).mockResolvedValue(goal);

      const result = await useCase.execute(goal.id);

      expect(result).toBeOk();
      expect(goal.deletedAt).not.toBeNull();
      expect(goalRepo.save).toHaveBeenCalledWith(goal);
    });

    it('should soft delete an active goal', async () => {
      const goal = createTestGoal();
      vi.mocked(goalRepo.findById).mockResolvedValue(goal);

      const result = await useCase.execute(goal.id);

      expect(result).toBeOk();
      expect(goal.deletedAt).not.toBeNull();
    });

    it('should return the DTO after deleting', async () => {
      const goal = createCompletedGoal('My Goal');
      vi.mocked(goalRepo.findById).mockResolvedValue(goal);

      const result = await useCase.execute(goal.id);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.name).toBe('My Goal');
        expect(result.data.deletedAt).not.toBeNull();
      }
    });
  });

  describe('checkDependencies()', () => {
    it('should return NOT_FOUND when goal does not exist', async () => {
      vi.mocked(goalRepo.findById).mockResolvedValue(null);

      const result = await useCase.checkDependencies('non-existent');

      expect(result).toBeErrorWithCode('NOT_FOUND');
    });

    it('should return dependency info for goal with no children', async () => {
      const goal = createTestGoal();
      vi.mocked(goalRepo.findById).mockResolvedValue(goal);

      const result = await useCase.checkDependencies(goal.id);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.hasKeyResults).toBe(false);
        expect(result.data.keyResultCount).toBe(0);
        expect(result.data.hasReviews).toBe(false);
        expect(result.data.reviewCount).toBe(0);
        expect(result.data.canDelete).toBe(true);
        expect(result.data.warnings).toHaveLength(0);
      }
    });

    it('should report key results when they exist', async () => {
      const goal = createTestGoal();
      goal.createAndAddKeyResult({
        title: 'KR1',
        valueType: 'NUMERIC',
        targetValue: 100,
        weight: 3,
      });
      vi.mocked(goalRepo.findById).mockResolvedValue(goal);

      const result = await useCase.checkDependencies(goal.id);

      expect(result).toBeOk();
      if (result.ok) {
        expect(result.data.hasKeyResults).toBe(true);
        expect(result.data.keyResultCount).toBe(1);
        expect(result.data.warnings).toHaveLength(1);
      }
    });
  });
});
