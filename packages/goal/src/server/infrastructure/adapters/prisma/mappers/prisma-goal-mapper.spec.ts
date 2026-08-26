import { describe, expect, it } from 'vitest';
import { PrismaGoalMapper } from './prisma-goal-mapper';

describe('PrismaGoalMapper key result progress mapping', () => {
  it('maps physical initialValue to canonical startingValue', () => {
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

    expect(dto.progress.startingValue).toBe(0);
    expect(dto.progress.progressBaselineValue).toBeNull();
    expect('valueType' in dto.progress).toBe(false);
    expect(dto.progress.currentValue).toBe(90);
  });

  it('maps canonical startingValue back to the temporary physical initialValue seam', () => {
    const progress = PrismaGoalMapper.parseKeyResultProgress({
      id: 'kr-1',
      goalId: 'goal-1',
      title: 'KR 1',
      description: null,
      progress: {
        startingValue: 0,
        currentValue: 91,
        targetValue: 100,
        progressBaselineValue: null,
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
    expect(progress.valueType).toBe('Incremental');
    expect(progress.currentValue).toBe(91);
  });
});
