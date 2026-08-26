import { describe, expect, it } from 'vitest';
import { PrismaGoalMapper } from './prisma-goal-mapper';

describe('PrismaGoalMapper key result progress mapping', () => {
  it('maps physical startingValue to canonical startingValue', () => {
    const dto = PrismaGoalMapper.mapKeyResult({
      id: 'kr-1',
      goalId: 'goal-1',
      identityId: 'identity-1',
      title: 'KR 1',
      description: null,
      aggregationMethod: 'Sum',
      startingValue: 0,
      progressBaselineValue: null,
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

  it('maps canonical progress directly to canonical physical fields', () => {
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

    expect(progress.startingValue).toBe(0);
    expect(progress.progressBaselineValue).toBeNull();
    expect('valueType' in progress).toBe(false);
    expect('initialValue' in progress).toBe(false);
    expect(progress.currentValue).toBe(91);
  });
});
