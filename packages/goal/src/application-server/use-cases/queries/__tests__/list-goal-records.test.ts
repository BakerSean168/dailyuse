import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalRecordRepository, IGoalRepository } from '@/domain-server';
import { ListGoalRecords } from '../list-goal-records';

function createRecordFixture(overrides?: Record<string, any>) {
  const id = overrides?.id ?? 'record-1';
  const value = overrides?.value ?? 10;
  return {
    id,
    keyResultId: overrides?.keyResultId ?? 'kr-1',
    value,
    createdAt: overrides?.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    toClientDTO: vi.fn().mockReturnValue({ id, value }),
    ...overrides,
  } as any;
}

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'goal-1',
    keyResults: overrides?.keyResults ?? [],
    ...overrides,
  } as any;
}

describe('ListGoalRecords', () => {
  it('should return empty list when no goalId and no keyResultId', async () => {
    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByKeyResultId: vi.fn(),
      findByGoalId: vi.fn(),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({});

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.data).toEqual([]);
    expect(result.data.total).toBe(0);
    expect(goalRecordRepo.findByKeyResultId).not.toHaveBeenCalled();
    expect(goalRecordRepo.findByGoalId).not.toHaveBeenCalled();
    expect(goalRepo.findById).not.toHaveBeenCalled();
  });

  it('should query by keyResultId and apply offset/limit', async () => {
    const first = createRecordFixture({ id: 'record-1', value: 10 });
    const second = createRecordFixture({ id: 'record-2', value: 20 });
    const third = createRecordFixture({ id: 'record-3', value: 30 });

    const findByKeyResultId = vi.fn().mockResolvedValue([first, second, third]);
    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByKeyResultId,
      findByGoalId: vi.fn(),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({ keyResultId: 'kr-1', offset: 1, limit: 1 });

    expect(findByKeyResultId).toHaveBeenCalledWith('kr-1', { orderBy: 'desc' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.total).toBe(3);
    expect(result.data.data).toHaveLength(1);
    expect(second.toClientDTO).toHaveBeenCalledWith('', 20);
    expect(first.toClientDTO).not.toHaveBeenCalled();
    expect(third.toClientDTO).not.toHaveBeenCalled();
    expect(goalRepo.findById).not.toHaveBeenCalled();
  });

  it('should fallback to record value when goal is not found', async () => {
    const record = createRecordFixture({ id: 'record-1', value: 40, keyResultId: 'kr-1' });

    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByGoalId: vi.fn().mockResolvedValue([record]),
      findByKeyResultId: vi.fn(),
    });
    const findById = vi.fn().mockResolvedValue(null);
    const goalRepo = createMockRepo<IGoalRepository>({
      findById,
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({ goalId: 'goal-1' });

    expect(findById).toHaveBeenCalledWith('goal-1', { includeChildren: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(record.toClientDTO).toHaveBeenCalledWith('goal-1', 40);
  });

  it('should fallback to record value when keyResult does not exist on goal', async () => {
    const record = createRecordFixture({ id: 'record-1', value: 15, keyResultId: 'kr-missing' });
    const goal = createGoalFixture({
      keyResults: [
        {
          id: 'kr-1',
          progress: {
            valueType: 'Incremental',
            aggregationMethod: 'Sum',
            initialValue: 0,
            targetValue: 100,
            currentValue: 0,
            unit: null,
          },
        },
      ],
    });

    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByGoalId: vi.fn().mockResolvedValue([record]),
      findByKeyResultId: vi.fn(),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({ goalId: 'goal-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(record.toClientDTO).toHaveBeenCalledWith('goal-1', 15);
  });

  it('should calculate valueAfter using Sum aggregation with history offset', async () => {
    const recordA = createRecordFixture({
      id: 'record-a',
      value: 5,
      keyResultId: 'kr-1',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    const recordB = createRecordFixture({
      id: 'record-b',
      value: 7,
      keyResultId: 'kr-1',
      createdAt: new Date('2026-02-02T00:00:00.000Z'),
    });

    const goal = createGoalFixture({
      keyResults: [
        {
          id: 'kr-1',
          progress: {
            valueType: 'Incremental',
            aggregationMethod: 'Sum',
            initialValue: 10,
            targetValue: 200,
            currentValue: 100,
            unit: null,
          },
        },
      ],
    });

    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByGoalId: vi.fn().mockResolvedValue([recordA, recordB]),
      findByKeyResultId: vi.fn(),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({ goalId: 'goal-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(recordA.toClientDTO).toHaveBeenCalledWith('goal-1', 93);
    expect(recordB.toClientDTO).toHaveBeenCalledWith('goal-1', 100);
  });

  it('should calculate valueAfter without offset for non-Sum aggregation', async () => {
    const recordA = createRecordFixture({
      id: 'record-a',
      value: 10,
      keyResultId: 'kr-1',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    const recordB = createRecordFixture({
      id: 'record-b',
      value: 30,
      keyResultId: 'kr-1',
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    });

    const goal = createGoalFixture({
      keyResults: [
        {
          id: 'kr-1',
          progress: {
            valueType: 'Incremental',
            aggregationMethod: 'Average',
            initialValue: 0,
            targetValue: 100,
            currentValue: 999,
            unit: null,
          },
        },
      ],
    });

    const goalRecordRepo = createMockRepo<IGoalRecordRepository>({
      findByGoalId: vi.fn().mockResolvedValue([recordA, recordB]),
      findByKeyResultId: vi.fn(),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });
    const useCase = new ListGoalRecords(goalRecordRepo, goalRepo);

    const result = await useCase.execute({ goalId: 'goal-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(recordA.toClientDTO).toHaveBeenCalledWith('goal-1', 10);
    expect(recordB.toClientDTO).toHaveBeenCalledWith('goal-1', 20);
  });
});
