import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/domain-server';
import { UpdateGoal } from '../update-goal';

// ============================================================
// Helpers
// ============================================================

function createTestGoal(name = 'Original Goal'): Goal {
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

describe('UpdateGoal', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: UpdateGoal;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateGoal(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', { title: 'Updated' });

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should update the goal title', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, { title: 'Updated Title' });

    expect(result).toBeOk();
    expect(goal.name).toBe('Updated Title');
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should update tags when provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, { tags: ['new-tag'] });

    expect(result).toBeOk();
    expect(goal.tags).toEqual(['new-tag']);
  });

  it('should update time range when dates provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);
    const targetDate = new Date('2026-12-31').toISOString();

    const result = await useCase.execute(goal.id, { targetDate });

    expect(result).toBeOk();
    expect(goal.targetDate).toBeDefined();
  });

  it('should update folder when folderId provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, { folderId: 'folder-123' as any });

    expect(result).toBeOk();
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, { title: 'Should fail' })).rejects.toThrow();
  });

  it('should save the goal after update', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await useCase.execute(goal.id, { title: 'New Name' });

    expect(goalRepo.save).toHaveBeenCalledWith(goal);
  });
});
