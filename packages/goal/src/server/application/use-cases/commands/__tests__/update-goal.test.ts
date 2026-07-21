import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/server/domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/server/domain';
import { UpdateGoalUseCase } from '../update-goal.use-case';

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

describe('UpdateGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: UpdateGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1', { name: 'Updated' });

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should update the goal name', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', { name: 'Updated Title' });

    expect(result).toBeOk();
    expect(goal.name).toBe('Updated Title');
    expect(goalRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should update tags when provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', { tags: ['new-tag'] });

    expect(result).toBeOk();
    expect(goal.tags).toEqual(['new-tag']);
  });

  it('should update time range when dates provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);
    const targetDate = Date.parse('2026-12-31T00:00:00.000Z');

    const result = await useCase.execute(goal.id, 'identity-1', { targetDate });

    expect(result).toBeOk();
    expect(goal.targetDate).toBeDefined();
  });

  it('should update folder when folderId provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', { folderId: 'folder-123' as any });

    expect(result).toBeOk();
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, 'identity-1', { name: 'Should fail' })).rejects.toThrow();
  });

  it('should save the goal after update', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await useCase.execute(goal.id, 'identity-1', { name: 'New Name' });

    expect(goalRepo.save).toHaveBeenCalledWith(goal);
  });
});
