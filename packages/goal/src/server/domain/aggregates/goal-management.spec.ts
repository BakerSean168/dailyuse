import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Goal } from './goal';
import { GoalReminderConfig } from '../../domain';

function createGoal(overrides?: Partial<Parameters<typeof Goal.create>[0]>): Goal {
  return Goal.create({
    identityId: 'IdentityId_1' as never,
    name: 'Launch Goal',
    description: ' Ship it ',
    color: '#3B82F6',
    feasibilityAnalysis: ' Feasible ',
    motivation: ' Momentum ',
    importance: 'Moderate' as never,
    category: ' Work ',
    tags: ['launch'],
    startDate: new Date('2026-04-20T00:00:00.000Z').getTime(),
    targetDate: new Date('2026-04-30T00:00:00.000Z').getTime(),
    folderId: null,
    parentGoalId: null,
    reminderConfig: GoalReminderConfig.createDefault(),
    ...overrides,
  });
}

describe('Goal aggregate management', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates creation, parent-state guards, and basic info updates', () => {
    const parent = createGoal({ name: 'Parent' });
    parent.softDelete();

    expect(() =>
      Goal.create(
        {
          identityId: 'IdentityId_2' as never,
          name: 'Child',
          description: null,
          color: '#000',
          feasibilityAnalysis: null,
          motivation: null,
          importance: 'Moderate' as never,
          category: null,
          tags: [],
          startDate: null,
          targetDate: null,
          folderId: null,
          parentGoalId: parent.id,
          reminderConfig: null,
        },
        parent,
      ),
    ).toThrow('已删除');

    const archivedParent = createGoal({ name: 'Archived Parent' });
    archivedParent.markAsCompleted();
    expect(() =>
      Goal.create(
        {
          identityId: 'IdentityId_2' as never,
          name: 'Child',
          description: null,
          color: '#000',
          feasibilityAnalysis: null,
          motivation: null,
          importance: 'Moderate' as never,
          category: null,
          tags: [],
          startDate: null,
          targetDate: null,
          folderId: null,
          parentGoalId: archivedParent.id,
          reminderConfig: null,
        },
        archivedParent,
      ),
    ).toThrow('已归档');

    expect(() =>
      Goal.create({
        identityId: 'IdentityId_2' as never,
        name: 'Child',
        description: null,
        color: '#000',
        feasibilityAnalysis: null,
        motivation: null,
        importance: 'Moderate' as never,
        category: null,
        tags: [],
        startDate: null,
        targetDate: null,
        folderId: null,
        parentGoalId: 'GoalId_missing' as never,
        reminderConfig: null,
      }),
    ).toThrow('Parent goal is required');

    const goal = createGoal();
    const originalPriority = goal.priority;
    goal.pullDomainEvents();

    goal.updateBasicInfo({
      name: ' Launch Goal v2 ',
      description: ' Refined ',
      importance: 'Vital' as never,
      category: ' Strategy ',
      color: ' #111827 ',
      feasibilityAnalysis: ' Clear ',
      motivation: ' Win ',
    });

    expect(goal.name).toBe('Launch Goal v2');
    expect(goal.description).toBe('Refined');
    expect(goal.importance).toBe('Vital');
    expect(goal.category).toBe('Strategy');
    expect(goal.color).toBe('#111827');
    expect(goal.feasibilityAnalysis).toBe('Clear');
    expect(goal.motivation).toBe('Win');
    expect(goal.priority).not.toBe(originalPriority);
    expect(goal.priorityLevel).toMatch(/Critical|High|Medium|Low/);
    expect(goal.priorityText).toBeTruthy();

    goal.updateTags(['a', 'b']);
    goal.addTag(' c ');
    goal.addTag('c');
    goal.removeTag('b');
    expect(goal.tags).toEqual(['a', 'c']);
  });

  it('updates time, status, folder, sorting, and deletion lifecycle', () => {
    const goal = createGoal();
    goal.pullDomainEvents();

    goal.updateTimeRange({
      startDate: new Date('2026-04-18T00:00:00.000Z').getTime(),
      targetDate: new Date('2026-05-05T00:00:00.000Z').getTime(),
    });
    expect(new Date(goal.startDate!).toISOString()).toBe('2026-04-18T00:00:00.000Z');
    expect(new Date(goal.targetDate!).toISOString()).toBe('2026-05-05T00:00:00.000Z');

    goal.extendTargetDate(2);
    expect(new Date(goal.targetDate!).toISOString()).toBe('2026-05-07T00:00:00.000Z');
    goal.shortenTargetDate(1);
    expect(new Date(goal.targetDate!).toISOString()).toBe('2026-05-06T00:00:00.000Z');

    goal.moveToFolder('GoalFolderId_1' as never);
    goal.updateSortOrder(7);
    expect(goal.folderId).toBe('GoalFolderId_1');
    expect(goal.sortOrder).toBe(7);

    goal.updateStatus('Completed' as never);
    goal.activate();
    expect(goal.status).toBe('Active');

    const ratio = (goal as any).calculateTimeProgressRatio();
    const resolved = (goal as any).resolveTimeRange();
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
    expect(resolved.start).toBe(goal.startDate);
    expect(resolved.end).toBe(goal.targetDate);
    expect(goal.isOverdue()).toBe(false);
    expect(goal.getRemainingDays()).toBe(10);
    expect(goal.isHighPriority()).toBe(true);

    expect(() => goal.extendTargetDate(0)).toThrow('必须为正数');
    const withoutTarget = createGoal({ targetDate: null });
    expect(() => withoutTarget.extendTargetDate(1)).toThrow('目标日期未设置');
    expect(() => withoutTarget.shortenTargetDate(1)).toThrow('目标日期未设置');
    expect(() => goal.shortenTargetDate(100)).toThrow('目标日期范围无效');
    expect(() =>
      goal.updateTimeRange({
        startDate: new Date('2026-05-10T00:00:00.000Z').getTime(),
        targetDate: new Date('2026-05-01T00:00:00.000Z').getTime(),
      }),
    ).toThrow('目标日期范围无效');

    goal.archive();
    expect(goal.canBePermanentlyDeleted()).toBe(true);
    goal.archiveAsExpired();
    goal.softDelete();
    expect(goal.deletedAt).not.toBeNull();
    expect(() => goal.updateBasicInfo({ name: 'Blocked' })).toThrow('已删除');
  });

  it('manages reminder config and key results', () => {
    const goal = createGoal();
    goal.pullDomainEvents();

    goal.updateReminderConfig({
      enabled: true,
      triggers: [{ type: 'RemainingDays', value: 3, enabled: true }],
    });
    goal.enableReminder();
    goal.addReminderTrigger({ type: 'TimeProgressPercentage', value: 50, enabled: true });
    goal.removeReminderTrigger('RemainingDays', 3);
    goal.disableReminder();
    expect(goal.reminderConfig?.enabled).toBe(false);
    expect(goal.reminderConfig?.triggers).toEqual([
      { type: 'TimeProgressPercentage', value: 50, enabled: true },
    ]);

    const withoutReminder = createGoal({ reminderConfig: null });
    expect(() => withoutReminder.addReminderTrigger({ type: 'RemainingDays', value: 1, enabled: true }))
      .toThrow('Reminder config not initialized');
    expect(() => withoutReminder.removeReminderTrigger('RemainingDays', 1)).toThrow(
      'Reminder config not initialized',
    );

    const kr1 = goal.createAndAddKeyResult({
      title: 'KR1',
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      startValue: 0,
      targetValue: 10,
      currentValue: 2,
      unit: 'pt',
      weight: 2,
    });
    const kr2 = goal.createAndAddKeyResult({
      title: 'KR2',
      valueType: 'Incremental',
      targetValue: 20,
      currentValue: 4,
      weight: 3,
    });

    goal.updateKeyResult(String(kr1.id), {
      title: 'KR1 updated',
      description: 'details',
      weight: 4,
      startValue: 1,
      currentValue: 6,
      targetValue: 12,
      unit: 'items',
    });
    goal.reorderKeyResults([String(kr2.id)]);
    expect(goal.getKeyResult(String(kr1.id))?.title).toBe('KR1 updated');
    expect(goal.getAllKeyResults()).toHaveLength(2);
    expect(goal.keyResults[0].id).toBe(kr2.id);

    const updatedKr2 = goal.updateKeyResultProgress(String(kr2.id), 20);
    expect(updatedKr2.progress.currentValue).toBe(20);
    expect(goal.areAllKeyResultsCompleted()).toBe(false);
    goal.updateKeyResultProgress(String(kr1.id), 12);
    expect(goal.areAllKeyResultsCompleted()).toBe(true);

    goal.recordWeightSnapshot(String(kr1.id), 2, 4, 'Manual', 'IdentityId_1', 'reweight');
    expect(goal.getAllWeightSnapshots()).toHaveLength(1);
    expect(goal.getWeightSnapshotsByKeyResult(String(kr1.id))).toHaveLength(1);
    expect(() =>
      goal.recordWeightSnapshot('missing', 1, 2, 'Manual', 'IdentityId_1'),
    ).toThrow('未在目标');

    const removed = goal.removeKeyResult(String(kr1.id));
    expect(removed?.id).toBe(kr1.id);
    expect(goal.removeKeyResult('missing')).toBeNull();
    expect(() => goal.updateKeyResult('missing', { title: 'x' })).toThrow('关键结果未找到');
    expect(() => goal.updateKeyResultProgress('missing', 1)).toThrow('关键结果未找到');
  });

  it('manages reviews and serializes nested children', () => {
    const goal = createGoal();
    const kr = goal.createAndAddKeyResult({
      title: 'KR1',
      valueType: 'Incremental',
      targetValue: 100,
      currentValue: 50,
      weight: 3,
    });

    const review = goal.createAndAddReview({
      title: 'Weekly',
      content: 'steady',
      reviewType: 'Weekly',
      achievements: 'A1',
      challenges: 'C1',
      nextActions: 'N1',
    });
    expect(review.rating).toBe(3);
    expect(goal.getLatestReview()?.id).toBe(review.id);

    goal.updateReview(String(review.id), {
      rating: 5,
      summary: 'better',
      achievements: 'A2',
      challenges: 'C2',
      improvements: 'N2',
    });
    expect(goal.getLatestReview()?.rating).toBe(5);
    expect(goal.getLatestReview()?.summary).toBe('better');
    expect(goal.getLatestReview()?.achievements).toContain('A1');
    expect(goal.getLatestReview()?.achievements).toContain('A2');
    expect(goal.getLatestReview()?.challenges).toContain('C1');
    expect(goal.getLatestReview()?.improvements).toContain('N2');

    const removed = goal.removeReview(String(review.id));
    expect(removed?.id).toBe(review.id);
    expect(goal.removeReview('missing')).toBeNull();
    expect(() => goal.updateReview('missing', { rating: 3 })).toThrow('目标回顾未找到');
    expect(() => goal.createAndAddReview({ title: 'Bad', content: 'x', reviewType: 'Weekly', rating: 0 }))
      .toThrow('目标回顾评分');
    expect(() => Goal.validateReviewRating(6)).toThrow('目标回顾评分');

    const dtoGoal = createGoal();
    dtoGoal.createAndAddKeyResult({
      title: 'KR1',
      valueType: 'Incremental',
      targetValue: 10,
      currentValue: 10,
      weight: 2,
    });
    dtoGoal.createAndAddReview({
      title: 'Final',
      content: 'done',
      reviewType: 'Final',
      rating: 5,
    });
    dtoGoal.recordWeightSnapshot(String(dtoGoal.keyResults[0].id), 1, 2, 'Auto', 'IdentityId_1');

    expect(dtoGoal.toServerDTO(true)).toMatchObject({
      keyResults: [expect.objectContaining({ id: dtoGoal.keyResults[0].id })],
    });
    expect(dtoGoal.toClientDTO(true)).toMatchObject({
      keyResults: [expect.any(Object)],
      reviews: [expect.any(Object)],
      totalKeyResults: 1,
      completedKeyResults: 1,
      overallProgress: 100,
    });
  });
});
