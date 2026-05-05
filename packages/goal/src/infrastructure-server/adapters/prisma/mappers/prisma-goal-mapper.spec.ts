import { describe, expect, it } from 'vitest';
import { PrismaGoalMapper } from './prisma-goal-mapper';

describe('PrismaGoalMapper key result progress mapping', () => {
  it('maps initialValue from persistence columns', () => {
    const dto = PrismaGoalMapper.mapKeyResult({
      id: 'kr-1',
      goalId: 'goal-1',
      identityId: 'identity-1',
      title: 'KR 1',
      description: null,
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      initialValue: 0,
      targetValue: 100,
      currentValue: 90,
      unit: null,
      weight: 1,
      order: 0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    expect(dto.progress.initialValue).toBe(0);
    expect(dto.progress.currentValue).toBe(90);
  });

  it('parses initialValue back into persistence payload', () => {
    const progress = PrismaGoalMapper.parseKeyResultProgress({
      id: 'kr-1',
      goalId: 'goal-1',
      title: 'KR 1',
      description: null,
      progress: {
        initialValue: 0,
        currentValue: 91,
        targetValue: 100,
        valueType: 'Incremental',
        aggregationMethod: 'Sum',
        unit: null,
      },
      weight: 1,
      sortOrder: 0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);

    expect(progress.initialValue).toBe(0);
    expect(progress.currentValue).toBe(91);
  });
});
