import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalRepository } from '@/domain-server';
import { ListGoals } from '../list-goals';

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

// ============================================================
// Tests
// ============================================================

describe('ListGoals', () => {
  it('should return a paginated list of goals', async () => {
    const goal1 = createGoalFixture({ id: 'goal-1', name: 'Goal One' });
    const goal2 = createGoalFixture({ id: 'goal-2', name: 'Goal Two' });
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([goal1, goal2]),
    });
    const useCase = new ListGoals(goalRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.data).toHaveLength(2);
    expect(result.data.pagination.total).toBe(2);
    expect(result.data.pagination.hasMore).toBe(false);
    expect(goal1.toClientDTO).toHaveBeenCalledWith(false);
    expect(goal2.toClientDTO).toHaveBeenCalledWith(false);
  });

  it('should return empty list when no goals exist', async () => {
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });
    const useCase = new ListGoals(goalRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.data).toHaveLength(0);
    expect(result.data.pagination.total).toBe(0);
    expect(result.data.pagination.hasMore).toBe(false);
    expect(result.data.pagination.totalPages).toBe(0);
  });

  it('should pass filter options to repository', async () => {
    const findByIdentityId = vi.fn().mockResolvedValue([]);
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId,
    });
    const useCase = new ListGoals(goalRepo);

    await useCase.execute({
      identityId: 'identity-1',
      includeKeyResults: true,
      systemView: 'completed',
      status: ['IN_PROGRESS'],
      folderId: 'folder-1',
    });

    expect(findByIdentityId).toHaveBeenCalledWith('identity-1', {
      includeChildren: true,
      systemView: 'completed',
      status: 'IN_PROGRESS',
      folderId: 'folder-1',
    });
  });

  it('should calculate pagination with custom page and pageSize', async () => {
    const goals = Array.from({ length: 5 }, (_, i) => createGoalFixture({ id: `goal-${i}` }));
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(goals),
    });
    const useCase = new ListGoals(goalRepo);

    const result = await useCase.execute({
      identityId: 'identity-1',
      page: 1,
      pageSize: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.pagination.page).toBe(1);
    expect(result.data.pagination.pageSize).toBe(2);
    expect(result.data.pagination.total).toBe(5);
    expect(result.data.pagination.hasMore).toBe(true);
    expect(result.data.pagination.totalPages).toBe(3);
  });

  it('should default page to 1 and pageSize to total when not provided', async () => {
    const goals = [createGoalFixture({ id: 'goal-1' }), createGoalFixture({ id: 'goal-2' })];
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(goals),
    });
    const useCase = new ListGoals(goalRepo);

    const result = await useCase.execute({ identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.pagination.page).toBe(1);
    expect(result.data.pagination.pageSize).toBe(2);
    expect(result.data.pagination.hasMore).toBe(false);
  });

  it('should set hasMore to false when on the last page', async () => {
    const goals = Array.from({ length: 4 }, (_, i) => createGoalFixture({ id: `goal-${i}` }));
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(goals),
    });
    const useCase = new ListGoals(goalRepo);

    const result = await useCase.execute({
      identityId: 'identity-1',
      page: 2,
      pageSize: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.pagination.hasMore).toBe(false);
    expect(result.data.pagination.totalPages).toBe(2);
  });
});
