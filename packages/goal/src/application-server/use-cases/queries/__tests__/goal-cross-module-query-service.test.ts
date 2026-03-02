import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalRepository } from '@/domain-server';
import { GoalCrossModuleQueryService } from '../goal-cross-module-query-service';

vi.mock('@dailyuse/utils', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'goal-id-1',
    name: overrides?.name ?? 'Test Goal',
    description: overrides?.description ?? 'Test description',
    status: overrides?.status ?? 'IN_PROGRESS',
    title: overrides?.title ?? 'Test Goal',
    targetDate: overrides?.targetDate ?? null,
    keyResults: overrides?.keyResults ?? [],
    getOverallProgress: vi.fn().mockReturnValue(overrides?.progress ?? 50),
    toClientDTO: vi.fn().mockReturnValue({
      id: overrides?.id ?? 'goal-id-1',
      name: overrides?.name ?? 'Test Goal',
      description: overrides?.description ?? 'Test description',
      status: overrides?.status ?? 'IN_PROGRESS',
    }),
    ...overrides,
  } as any;
}

function createKeyResultFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'kr-id-1',
    title: overrides?.title ?? 'Key Result 1',
    description: overrides?.description ?? 'KR description',
    progress: overrides?.progress ?? {
      current: 30,
      target: 100,
      progressPercentage: 30,
    },
    weight: overrides?.weight ?? 1,
    ...overrides,
  } as any;
}

// ============================================================
// Tests — getGoalsForTaskBinding
// ============================================================

describe('GoalCrossModuleQueryService', () => {
  describe('getGoalsForTaskBinding', () => {
    it('should return goals filtered by default statuses', async () => {
      const goal1 = createGoalFixture({ id: 'g1', status: 'IN_PROGRESS', title: 'Active Goal' });
      const goal2 = createGoalFixture({ id: 'g2', status: 'COMPLETED', title: 'Done Goal' });
      const goal3 = createGoalFixture({ id: 'g3', status: 'NOT_STARTED', title: 'New Goal' });
      const goalRepo = createMockRepo<IGoalRepository>({
        findByIdentityId: vi.fn().mockResolvedValue([goal1, goal2, goal3]),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getGoalsForTaskBinding({ identityId: 'identity-1' });

      expect(result).toHaveLength(2);
      expect(result.map((g) => g.id)).toEqual(['g1', 'g3']);
    });

    it('should filter by custom status list', async () => {
      const goal1 = createGoalFixture({ id: 'g1', status: 'COMPLETED' });
      const goal2 = createGoalFixture({ id: 'g2', status: 'IN_PROGRESS' });
      const goalRepo = createMockRepo<IGoalRepository>({
        findByIdentityId: vi.fn().mockResolvedValue([goal1, goal2]),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getGoalsForTaskBinding({
        identityId: 'identity-1',
        status: ['COMPLETED'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g1');
    });

    it('should return empty array when no goals match status filter', async () => {
      const goal = createGoalFixture({ id: 'g1', status: 'ARCHIVED' });
      const goalRepo = createMockRepo<IGoalRepository>({
        findByIdentityId: vi.fn().mockResolvedValue([goal]),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getGoalsForTaskBinding({ identityId: 'identity-1' });

      expect(result).toHaveLength(0);
    });

    it('should map goal fields including progress', async () => {
      const goal = createGoalFixture({
        id: 'g1',
        title: 'My Goal',
        description: 'Desc',
        status: 'IN_PROGRESS',
        targetDate: 1700000000,
        progress: 75,
      });
      const goalRepo = createMockRepo<IGoalRepository>({
        findByIdentityId: vi.fn().mockResolvedValue([goal]),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getGoalsForTaskBinding({ identityId: 'identity-1' });

      expect(result[0]).toEqual({
        id: 'g1',
        title: 'My Goal',
        description: 'Desc',
        status: 'IN_PROGRESS',
        targetDate: 1700000000,
        progress: 75,
      });
      expect(goal.getOverallProgress).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Tests — getKeyResultsForTaskBinding
  // ============================================================

  describe('getKeyResultsForTaskBinding', () => {
    it('should return key results for a goal', async () => {
      const kr1 = createKeyResultFixture({ id: 'kr-1', title: 'KR One' });
      const kr2 = createKeyResultFixture({ id: 'kr-2', title: 'KR Two' });
      const goal = createGoalFixture({ id: 'goal-1', keyResults: [kr1, kr2] });
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(goal),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getKeyResultsForTaskBinding('goal-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('kr-1');
      expect(result[0].goalId).toBe('goal-1');
      expect(result[1].id).toBe('kr-2');
    });

    it('should throw when goal is not found', async () => {
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      await expect(service.getKeyResultsForTaskBinding('non-existent')).rejects.toThrow(
        'Goal not found: non-existent',
      );
    });

    it('should map key result progress fields correctly', async () => {
      const kr = createKeyResultFixture({
        id: 'kr-1',
        title: 'KR Title',
        description: 'KR Desc',
        progress: { current: 50, target: 200, progressPercentage: 25 },
        weight: 2,
      });
      const goal = createGoalFixture({ id: 'goal-1', keyResults: [kr] });
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(goal),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getKeyResultsForTaskBinding('goal-1');

      expect(result[0]).toEqual({
        id: 'kr-1',
        title: 'KR Title',
        description: 'KR Desc',
        goalId: 'goal-1',
        progress: { current: 50, target: 200, percentage: 25 },
        weight: 2,
      });
    });

    it('should return empty array when goal has no key results', async () => {
      const goal = createGoalFixture({ id: 'goal-1', keyResults: [] });
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(goal),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.getKeyResultsForTaskBinding('goal-1');

      expect(result).toHaveLength(0);
    });
  });

  // ============================================================
  // Tests — validateGoalBinding
  // ============================================================

  describe('validateGoalBinding', () => {
    it('should return valid when goal and key result exist', async () => {
      const kr = createKeyResultFixture({ id: 'kr-1' });
      const goal = createGoalFixture({ id: 'goal-1', keyResults: [kr] });
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(goal),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.validateGoalBinding('goal-1', 'kr-1');

      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when goal is not found', async () => {
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.validateGoalBinding('non-existent', 'kr-1');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Goal not found');
    });

    it('should return invalid when key result is not found in goal', async () => {
      const kr = createKeyResultFixture({ id: 'kr-1' });
      const goal = createGoalFixture({ id: 'goal-1', keyResults: [kr] });
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockResolvedValue(goal),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.validateGoalBinding('goal-1', 'kr-unknown');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('KeyResult not found in goal');
    });

    it('should catch repository errors and return invalid', async () => {
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockRejectedValue(new Error('DB connection failed')),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.validateGoalBinding('goal-1', 'kr-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('DB connection failed');
    });

    it('should handle non-Error thrown values', async () => {
      const goalRepo = createMockRepo<IGoalRepository>({
        findById: vi.fn().mockRejectedValue('string error'),
      });
      const service = new GoalCrossModuleQueryService(goalRepo);

      const result = await service.validateGoalBinding('goal-1', 'kr-1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
