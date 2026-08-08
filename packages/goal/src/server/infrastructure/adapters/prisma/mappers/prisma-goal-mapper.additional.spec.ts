import { describe, expect, it } from 'vitest';
import { PrismaGoalMapper } from './prisma-goal-mapper';

describe('PrismaGoalMapper additional coverage', () => {
  it('maps full prisma goal row with relations', () => {
    const row = {
      id: 'goal-1',
      identityId: 'identity-1',
      name: 'Goal',
      description: null,
      color: null,
      feasibilityAnalysis: null,
      motivation: null,
      status: 'InProgress',
      importance: 'Medium',
      priority: null,
      category: null,
      tags: null,
      startDate: new Date(1_000),
      targetDate: null,
      completedAt: null,
      archivedAt: null,
      folderId: null,
      parentGoalId: null,
      sortOrder: null,
      reminderConfig: JSON.stringify({ enabled: true, triggers: '[]' }),
      keyResults: [
        {
          id: 'kr-1',
          goalId: 'goal-1',
          title: 'KR',
          description: null,
          valueType: null,
          aggregationMethod: null,
          initialValue: null,
          targetValue: null,
          currentValue: null,
          unit: null,
          weight: null,
          order: null,
          version: null,
          createdAt: new Date(1_000),
          updatedAt: new Date(1_200),
          deletedAt: null,
        },
      ],
      reviews: [
        {
          id: 'review-1',
          goalId: 'goal-1',
          reviewType: 'Weekly',
          rating: null,
          content: 'summary',
          achievements: null,
          challenges: null,
          lessonsLearned: 'learned',
          createdAt: new Date(1_300),
          updatedAt: new Date(1_400),
          deletedAt: null,
          version: null,
        },
      ],
      keyResultWeightSnapshots: [
        {
          id: 'snapshot-1',
          goalId: 'goal-1',
          keyResultId: 'kr-1',
          identityId: 'identity-1',
          oldWeight: 1,
          newWeight: 2,
          weightDelta: 1,
          snapshotTime: new Date(1_500),
          trigger: 'Manual',
          reason: null,
          operatorId: 'identity-1',
          createdAt: new Date(1_600),
        },
      ],
      createdAt: new Date(900),
      updatedAt: new Date(1_700),
      deletedAt: null,
      version: null,
    } as any;

    const dto = PrismaGoalMapper.toDomainDTO(row);

    expect(dto.color).toBe('#3B82F6');
    expect(dto.priority).toBe(0);
    expect(dto.tags).toEqual([]);
    expect(dto.sortOrder).toBe(0);
    expect(dto.reminderConfig).toEqual({ enabled: true, triggers: '[]' });
    expect(dto.keyResults?.[0].weight).toBe(1);
    expect(dto.keyResults?.[0].sortOrder).toBe(0);
    expect(dto.goalReviews?.[0].rating).toBe(3);
    expect(dto.goalReviews?.[0].improvements).toBe('learned');
    expect(dto.goalReviews?.[0].keyResultSnapshots).toEqual([]);
    expect(dto.weightSnapshots?.[0].snapshotTime).toBe(1_500);
    expect(dto.weightSnapshots?.[0].createdAt).toBe(1_600);
    expect(dto.version).toBe(1);
  });

  it('maps goal without relations', () => {
    const row = {
      id: 'goal-2',
      identityId: 'identity-1',
      name: 'Goal2',
      description: 'desc',
      color: '#000',
      feasibilityAnalysis: 'f',
      motivation: 'm',
      status: 'Completed',
      importance: 'High',
      priority: 10,
      category: 'cat',
      tags: ['a'],
      startDate: null,
      targetDate: null,
      completedAt: null,
      archivedAt: null,
      folderId: 'folder-1',
      parentGoalId: 'goal-1',
      sortOrder: 2,
      reminderConfig: null,
      keyResults: undefined,
      reviews: undefined,
      keyResultWeightSnapshots: undefined,
      createdAt: new Date(1_000),
      updatedAt: new Date(2_000),
      deletedAt: new Date(3_000),
      version: 3,
    } as any;

    const dto = PrismaGoalMapper.toDomainDTO(row);

    expect(dto.keyResults).toBeNull();
    expect(dto.goalReviews).toBeNull();
    expect(dto.weightSnapshots).toBeNull();
    expect(dto.reminderConfig).toBeNull();
    expect(dto.deletedAt).toBe(3_000);
  });

  it('maps weight snapshot when time fields are numbers', () => {
    const dto = PrismaGoalMapper.mapWeightSnapshot({
      id: 'snapshot-2',
      goalId: 'goal-1',
      keyResultId: 'kr-1',
      identityId: 'identity-1',
      oldWeight: 2,
      newWeight: 3,
      weightDelta: 1,
      snapshotTime: 2_000,
      trigger: 'Auto',
      reason: 'rule',
      operatorId: 'identity-1',
      createdAt: 2_100,
    } as any);

    expect(dto.snapshotTime).toBe(2_000);
    expect(dto.createdAt).toBe(2_100);
    expect(dto.trigger).toBe('Auto');
  });

  it('parses key result progress from object with defaults', () => {
    const fromPartial = PrismaGoalMapper.parseKeyResultProgress({
      progress: { currentValue: 8 },
    } as any);
    const fromFull = PrismaGoalMapper.parseKeyResultProgress({
      progress: {
        valueType: 'Absolute',
        aggregationMethod: 'Max',
        initialValue: 2,
        targetValue: 20,
        currentValue: 10,
        unit: 'pt',
      },
    } as any);

    expect(fromPartial).toEqual({
      valueType: 'Incremental',
      aggregationMethod: 'Last',
      initialValue: 0,
      targetValue: 100,
      currentValue: 8,
      unit: null,
    });
    expect(fromFull).toEqual({
      valueType: 'Absolute',
      aggregationMethod: 'Max',
      initialValue: 2,
      targetValue: 20,
      currentValue: 10,
      unit: 'pt',
    });
  });
});

describe('PrismaGoalMapper fallback branches (R4)', () => {
  it('applies defaults for nullable columns and instants', () => {
    const row = {
      id: 'goal-1',
      identityId: 'identity-1',
      name: 'Goal',
      description: null,
      color: null,
      feasibilityAnalysis: null,
      motivation: null,
      status: 'InProgress',
      importance: 'Medium',
      priority: null,
      category: null,
      tags: null,
      startDate: Date.parse('2026-01-01T00:00:00.000Z'),
      targetDate: null,
      completedAt: null,
      archivedAt: null,
      folderId: null,
      parentGoalId: null,
      rollupPolicy: null,
      sortOrder: null,
      reminderConfig: null,
      keyResults: null,
      reviews: null,
      keyResultWeightSnapshots: null,
      createdAt: 1_000,
      updatedAt: 2_000,
      deletedAt: null,
      version: null,
    };

    const raw = PrismaGoalMapper.toDomainDTO(row as never);
    expect(raw.rollupPolicy).toBe('kr');
    expect(raw.sortOrder).toBe(0);
    expect(raw.version).toBe(1);
    expect(raw.reminderConfig).toBeNull();
    expect(raw.keyResults).toBeNull();
    expect(raw.startDate).toBe(Date.parse('2026-01-01T00:00:00.000Z'));
    expect(raw.createdAt).toBe(1_000);
    expect(raw.updatedAt).toBe(2_000);
  });

  it('parses review improvements across JSON / legacy / null inputs', () => {
    expect(PrismaGoalMapper.parseReviewImprovements(null)).toBeNull();
    expect(PrismaGoalMapper.parseReviewImprovements('["a","b"]')).toBe('["a","b"]');
    expect(PrismaGoalMapper.parseReviewImprovements('not-json')).toBe('not-json');
  });
});
