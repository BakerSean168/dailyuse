import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/domain-server';
import { ArchiveGoal } from '../archive-goal';

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

describe('ArchiveGoal', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: ArchiveGoal;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ArchiveGoal(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should archive a completed goal', async () => {
    const goal = createCompletedGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id);

    expect(result).toBeOk();
    expect(goal.archivedAt).not.toBeNull();
    expect(goal.status).toBe('Archived');
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
  });

  it('should throw when trying to archive an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id)).rejects.toThrow(
      'Active goals must be completed before archiving',
    );
  });

  it('should throw when goal is already archived', async () => {
    const goal = createCompletedGoal();
    goal.archive();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id)).rejects.toThrow();
  });

  it('should return the goal DTO on success', async () => {
    const goal = createCompletedGoal('Archive Me');
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('Archive Me');
      expect(result.data.id).toBe(goal.id);
    }
  });
});
