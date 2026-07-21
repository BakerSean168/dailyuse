import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  FocusSessionStatus,
  FolderType,
  GoalMetadata,
  GoalReminderConfig,
  GoalStatus,
  GoalTimeRange,
  HiddenGoalsMode,
  KeyResultCalculationMethod,
  KeyResultProgress,
  KeyResultSnapshot,
  KeyResultValueType,
  KeyResultWeightSnapshot,
  ReminderTriggerType,
  ReviewType,
} from '..';
import { InvalidWeightError } from '../weight-errors';

describe('goal shared value objects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('covers enum helpers and simple domain errors', () => {
    expect(GoalStatus.getAll()).toEqual([
      GoalStatus.Active,
      GoalStatus.Completed,
      GoalStatus.Archived,
    ]);
    expect(GoalStatus.of('Active')).toBe(GoalStatus.Active);
    expect(GoalStatus.isTerminal(GoalStatus.Completed)).toBe(true);
    expect(() => GoalStatus.of('Bad')).toThrow('Invalid GoalStatus');

    expect(FolderType.getAll()).toEqual([FolderType.System, FolderType.User]);
    expect(FolderType.of('User')).toBe(FolderType.User);
    expect(FolderType.isSystem(FolderType.System)).toBe(true);
    expect(FolderType.isUser(FolderType.User)).toBe(true);

    expect(FocusSessionStatus.getAll()).toContain(FocusSessionStatus.Cancelled);
    expect(FocusSessionStatus.of('Completed')).toBe(FocusSessionStatus.Completed);
    expect(FocusSessionStatus.isTerminal(FocusSessionStatus.Cancelled)).toBe(true);

    expect(HiddenGoalsMode.getAll()).toContain(HiddenGoalsMode.Collapse);
    expect(HiddenGoalsMode.of('Dim')).toBe(HiddenGoalsMode.Dim);
    expect(HiddenGoalsMode.isHide(HiddenGoalsMode.Hide)).toBe(true);
    expect(HiddenGoalsMode.isDim(HiddenGoalsMode.Dim)).toBe(true);
    expect(HiddenGoalsMode.isCollapse(HiddenGoalsMode.Collapse)).toBe(true);

    expect(ReviewType.getAll()).toContain(ReviewType.Final);
    expect(ReviewType.of('Weekly')).toBe(ReviewType.Weekly);
    expect(ReviewType.isPeriodic(ReviewType.Monthly)).toBe(true);
    expect(ReviewType.isFinal(ReviewType.Final)).toBe(true);

    expect(ReminderTriggerType.getAll()).toEqual([
      ReminderTriggerType.TimeProgressPercentage,
      ReminderTriggerType.RemainingDays,
    ]);
    expect(ReminderTriggerType.of('RemainingDays')).toBe(ReminderTriggerType.RemainingDays);
    expect(ReminderTriggerType.isTimeProgress(ReminderTriggerType.TimeProgressPercentage)).toBe(
      true,
    );
    expect(ReminderTriggerType.isRemainingDays(ReminderTriggerType.RemainingDays)).toBe(true);

    expect(KeyResultValueType.getAll()).toContain(KeyResultValueType.Binary);
    expect(KeyResultValueType.of('Percentage')).toBe(KeyResultValueType.Percentage);
    expect(KeyResultValueType.isIncremental(KeyResultValueType.Incremental)).toBe(true);
    expect(KeyResultValueType.isAbsolute(KeyResultValueType.Absolute)).toBe(true);
    expect(KeyResultValueType.isPercentage(KeyResultValueType.Percentage)).toBe(true);
    expect(KeyResultValueType.isBinary(KeyResultValueType.Binary)).toBe(true);
    expect(KeyResultValueType.requiresMetric(KeyResultValueType.Absolute)).toBe(true);
    expect(KeyResultValueType.requiresMetric(KeyResultValueType.Binary)).toBe(false);

    expect(KeyResultCalculationMethod.getAll()).toContain(KeyResultCalculationMethod.Last);
    expect(KeyResultCalculationMethod.of('Sum')).toBe(KeyResultCalculationMethod.Sum);
    expect(KeyResultCalculationMethod.isAggregation(KeyResultCalculationMethod.Average)).toBe(
      true,
    );
    expect(KeyResultCalculationMethod.isAggregation(KeyResultCalculationMethod.Last)).toBe(false);

    const invalidWeight = new InvalidWeightError('progress', 120);
    expect(invalidWeight.code).toBe('VALIDATION_ERROR');
    expect(invalidWeight.message).toContain('progress');
    expect(invalidWeight.message).toContain('120');
  });

  it('covers goal metadata and reminder config mutations', () => {
    const metadata = GoalMetadata.createDefault()
      .updateImportance('Important')
      .updateCategory('Work')
      .updateTags(['launch'])
      .addTag('q2');

    expect(metadata.importance).toBe('Important');
    expect(metadata.category).toBe('Work');
    expect(metadata.tags).toEqual(['launch', 'q2']);
    expect(metadata.hasCategory).toBe(true);
    expect(metadata.hasTags).toBe(true);
    expect(metadata.removeTag('launch').tags).toEqual(['q2']);
    expect(GoalMetadata.fromDTO(metadata.toDTO()).toDTO()).toEqual(metadata.toDTO());
    expect(() =>
      GoalMetadata.create({
        importance: 'Moderate',
        category: 'x'.repeat(51),
        tags: [],
      }),
    ).toThrow('Category too long');
    expect(() =>
      GoalMetadata.create({
        importance: 'Moderate',
        category: null,
        tags: Array.from({ length: 11 }, (_, i) => `t${i}`),
      }),
    ).toThrow('Too many tags');
    expect(() =>
      GoalMetadata.create({
        importance: 'Moderate',
        category: null,
        tags: ['x'.repeat(21)],
      }),
    ).toThrow('Tag too long');

    const reminder = GoalReminderConfig.createDefault()
      .setEnabled(true)
      .addTrigger({ type: 'RemainingDays', value: 3, enabled: true })
      .addTrigger({ type: 'TimeProgressPercentage', value: 50, enabled: false });

    expect(reminder.enabled).toBe(true);
    expect(reminder.hasEnabledTriggers).toBe(true);
    expect(reminder.enabledTriggersCount).toBe(1);
    expect(reminder.getEnabledTriggers()).toEqual([
      { type: 'RemainingDays', value: 3, enabled: true },
    ]);
    expect(
      reminder.updateTriggerEnabled('TimeProgressPercentage', 50, true).enabledTriggersCount,
    ).toBe(2);
    expect(reminder.removeTrigger('RemainingDays', 3).triggers).toHaveLength(1);
    expect(reminder.clearTriggers().triggers).toEqual([]);
    expect(GoalReminderConfig.fromDTO(reminder.toDTO()).toDTO()).toEqual(reminder.toDTO());
    expect(() => GoalReminderConfig.create({ enabled: true, triggers: 'bad' as never })).toThrow(
      'Triggers must be an array',
    );
    expect(() =>
      GoalReminderConfig.create({
        enabled: true,
        triggers: Array.from({ length: 11 }, () => ({
          type: 'RemainingDays',
          value: 1,
          enabled: true,
        })),
      }),
    ).toThrow('Too many triggers');
    expect(() =>
      GoalReminderConfig.create({
        enabled: true,
        triggers: [{ type: 'TimeProgressPercentage', value: -1, enabled: true }],
      }),
    ).toThrow('Trigger value must be non-negative');
    expect(() =>
      GoalReminderConfig.create({
        enabled: true,
        triggers: [{ type: 'TimeProgressPercentage', value: 101, enabled: true }],
      }),
    ).toThrow('Trigger value must be between 0-100 for percentage triggers');
  });

  it('covers time ranges and key result snapshot helpers', () => {
    const start = new Date('2026-04-01T00:00:00.000Z');
    const target = new Date('2026-05-01T00:00:00.000Z');
    const completed = new Date('2026-05-02T00:00:00.000Z');
    const archived = new Date('2026-04-22T00:00:00.000Z');

    const range = GoalTimeRange.createDefault(start).setTargetDate(target);
    expect(range.startDate?.toISOString()).toBe(start.toISOString());
    expect(range.targetDate?.toISOString()).toBe(target.toISOString());
    expect(range.getPlannedDays()).toBe(30);
    expect(range.getElapsedDays()).toBe(25);
    expect(range.getDaysToTargetDate()).toBe(5);
    expect(range.isCompleted).toBe(false);
    expect(range.isArchived).toBe(false);
    expect(range.isTerminal).toBe(false);
    expect(range.isOverdue).toBe(false);

    const completedRange = range.markAsCompleted(completed);
    expect(completedRange.completedAt?.toISOString()).toBe(completed.toISOString());
    expect(completedRange.isCompleted).toBe(true);
    expect(completedRange.isTerminal).toBe(true);
    expect(completedRange.unmarkAsCompleted().completedAt).toBeNull();

    const archivedRange = range.markAsArchived(archived);
    expect(archivedRange.archivedAt?.toISOString()).toBe(archived.toISOString());
    expect(archivedRange.isArchived).toBe(true);
    expect(archivedRange.unmarkAsArchived().archivedAt).toBeNull();
    expect(GoalTimeRange.fromDTO(range.toDTO()).toDTO()).toEqual(range.toDTO());
    expect(() =>
      GoalTimeRange.create({
        startDate: target.getTime(),
        targetDate: start.getTime(),
        completedAt: null,
        archivedAt: null,
      }),
    ).toThrow('Start date must be before or equal to target date');
    expect(() =>
      GoalTimeRange.create({
        startDate: start.getTime(),
        targetDate: target.getTime(),
        completedAt: completed.getTime(),
        archivedAt: archived.getTime(),
      }),
    ).toThrow('Goal cannot be both completed and archived');

    const snapshot = KeyResultSnapshot.create({
      keyResultId: 'KeyResultId_1' as never,
      title: 'Launch',
      targetValue: 100,
      currentValue: 60,
      progressPercentage: 60,
    });
    expect(snapshot.isCompleted).toBe(false);
    expect(snapshot.getRemainingValue()).toBe(40);
    expect(snapshot.getProgressLevel()).toBe('in-progress');
    expect(snapshot.getDisplayText()).toContain('Launch: 60/100');
    expect(KeyResultSnapshot.fromDTO(snapshot.toDTO()).toDTO()).toEqual(snapshot.toDTO());
    expect(
      KeyResultSnapshot.create({
        keyResultId: 'KeyResultId_1' as never,
        title: 'Done',
        targetValue: 100,
        currentValue: 100,
        progressPercentage: 100,
      }).getProgressLevel(),
    ).toBe('completed');
    expect(
      KeyResultSnapshot.create({
        keyResultId: 'KeyResultId_1' as never,
        title: 'Idle',
        targetValue: 100,
        currentValue: 0,
        progressPercentage: 0,
      }).getProgressLevel(),
    ).toBe('not-started');
    expect(() =>
      KeyResultSnapshot.create({
        keyResultId: 'KeyResultId_1' as never,
        title: '',
        targetValue: 100,
        currentValue: 1,
        progressPercentage: 1,
      }),
    ).toThrow('Title cannot be empty');
    expect(() =>
      KeyResultSnapshot.create({
        keyResultId: 'KeyResultId_1' as never,
        title: 'x'.repeat(201),
        targetValue: 100,
        currentValue: 1,
        progressPercentage: 1,
      }),
    ).toThrow('Title too long');
    expect(() =>
      KeyResultSnapshot.create({
        keyResultId: 'KeyResultId_1' as never,
        title: 'Bad',
        targetValue: 0,
        currentValue: 1,
        progressPercentage: 1,
      }),
    ).toThrow('Target value must be positive');
  });

  it('covers progress calculation and weight snapshots', () => {
    const progress = KeyResultProgress.create({
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      initialValue: 10,
      targetValue: 100,
      currentValue: 40,
      unit: 'points',
    });

    expect(progress.increment(5).currentValue).toBe(45);
    expect(progress.decrement(10).currentValue).toBe(30);
    expect(progress.reset().currentValue).toBe(10);
    expect(progress.setToTarget().currentValue).toBe(100);
    expect(progress.calculateAggregatedValue([])).toBe(10);
    expect(progress.calculateAggregatedValue([5, 15])).toBe(30);
    expect(progress.recalculateFromHistory([5, 15]).currentValue).toBe(30);
    expect(progress.getAggregationMethodDescription()).toContain('求和');
    expect(progress.getProgressPercentage()).toBeCloseTo(33.3333333333);
    expect(progress.isCompleted).toBe(false);
    expect(progress.getRemainingValue()).toBe(60);
    expect(progress.getCompletedValue()).toBe(30);
    expect(progress.getDirection()).toBe('up');
    expect(
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Average',
        initialValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: null,
      }).calculateAggregatedValue([10, 20, 30]),
    ).toBe(20);
    expect(
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Max',
        initialValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: null,
      }).calculateAggregatedValue([10, 20, 30]),
    ).toBe(30);
    expect(
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Min',
        initialValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: null,
      }).calculateAggregatedValue([10, 20, 30]),
    ).toBe(10);
    expect(
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Last',
        initialValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: null,
      }).calculateAggregatedValue([10, 20, 30]),
    ).toBe(30);
    expect(
      KeyResultProgress.create({
        valueType: 'Percentage',
        aggregationMethod: 'Sum',
        initialValue: 0,
        targetValue: 100,
        currentValue: 80,
        unit: '%',
      }).isCompleted,
    ).toBe(false);
    expect(
      KeyResultProgress.create({
        valueType: 'Absolute',
        aggregationMethod: 'Sum',
        initialValue: 100,
        targetValue: 0,
        currentValue: 20,
        unit: null,
      }).getDirection(),
    ).toBe('down');
    expect(
      KeyResultProgress.create({
        valueType: 'Absolute',
        aggregationMethod: 'Sum',
        initialValue: 100,
        targetValue: 0,
        currentValue: 0,
        unit: null,
      }).isCompleted,
    ).toBe(true);
    expect(KeyResultProgress.fromDTO(progress.toDTO()).toDTO()).toEqual(progress.toDTO());
    expect(() =>
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Sum',
        initialValue: 1,
        targetValue: 1,
        currentValue: 1,
        unit: null,
      }),
    ).toThrow('Target value must be different from initial value');
    expect(() =>
      KeyResultProgress.create({
        valueType: 'Percentage',
        aggregationMethod: 'Sum',
        initialValue: -1,
        targetValue: 50,
        currentValue: 10,
        unit: '%',
      }),
    ).toThrow('Percentage initial value must be between 0-100');
    expect(() =>
      KeyResultProgress.create({
        valueType: 'Percentage',
        aggregationMethod: 'Sum',
        initialValue: 0,
        targetValue: 101,
        currentValue: 10,
        unit: '%',
      }),
    ).toThrow('Percentage target value must be between 0-100');
    expect(() =>
      KeyResultProgress.create({
        valueType: 'Percentage',
        aggregationMethod: 'Sum',
        initialValue: 0,
        targetValue: 100,
        currentValue: 101,
        unit: '%',
      }),
    ).toThrow('Percentage current value must be between 0-100');
    expect(() =>
      KeyResultProgress.create({
        valueType: 'Incremental',
        aggregationMethod: 'Sum',
        initialValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: 'x'.repeat(21),
      }),
    ).toThrow('Unit too long');

    const snapshot = KeyResultWeightSnapshot.create({
      id: 'KeyResultWeightSnapshotId_1' as never,
      goalId: 'GoalId_1' as never,
      keyResultId: 'KeyResultId_1' as never,
      identityId: 'IdentityId_1' as never,
      oldWeight: 2,
      newWeight: 4,
      weightDelta: 2,
      snapshotTime: Date.UTC(2026, 3, 25, 0, 0, 0),
      trigger: 'Manual',
      reason: 'reprioritized',
      operatorId: 'IdentityId_1' as never,
      createdAt: Date.UTC(2026, 3, 25, 0, 5, 0),
    });
    expect(snapshot.isIncreased).toBe(true);
    expect(snapshot.isDecreased).toBe(false);
    expect(snapshot.isUnchanged).toBe(false);
    expect(snapshot.getPercentageChange()).toBe(100);
    expect(snapshot.isManual).toBe(true);
    expect(snapshot.isAuto).toBe(false);
    expect(snapshot.isRestore).toBe(false);
    expect(snapshot.isImport).toBe(false);
    expect(snapshot.hasReason).toBe(true);
    expect(snapshot.getTriggerDisplayText()).toBe('手动调整');
    expect(snapshot.getDisplayText()).toContain('2 → 4');
    expect(snapshot.getAgeInSeconds()).toBe(86100);
    expect(KeyResultWeightSnapshot.fromDTO(snapshot.toDTO()).toDTO()).toEqual(snapshot.toDTO());

    const constructed = new KeyResultWeightSnapshot(
      'KeyResultWeightSnapshotId_2' as never,
      'GoalId_2' as never,
      'KeyResultId_2' as never,
      'IdentityId_2' as never,
      4,
      2,
      Date.UTC(2026, 3, 25, 0, 0, 0),
      'Import',
      'IdentityId_2' as never,
      null,
      Date.UTC(2026, 3, 25, 0, 1, 0),
    );
    expect(constructed.isDecreased).toBe(true);
    expect(constructed.isImport).toBe(true);
    expect(constructed.hasReason).toBe(false);

    expect(() =>
      KeyResultWeightSnapshot.create({
        ...snapshot.toDTO(),
        oldWeight: 0,
      }),
    ).toThrow('Old weight must be an integer between 1-5');
    expect(() =>
      KeyResultWeightSnapshot.create({
        ...snapshot.toDTO(),
        newWeight: 6,
      }),
    ).toThrow('New weight must be an integer between 1-5');
    expect(() =>
      KeyResultWeightSnapshot.create({
        ...snapshot.toDTO(),
        weightDelta: 99,
      }),
    ).toThrow('Weight delta does not match');
    expect(() =>
      KeyResultWeightSnapshot.create({
        ...snapshot.toDTO(),
        snapshotTime: snapshot.createdAt + 1,
      }),
    ).toThrow('Snapshot time must be before or equal to created time');
    expect(() =>
      KeyResultWeightSnapshot.create({
        ...snapshot.toDTO(),
        reason: 'x'.repeat(501),
      }),
    ).toThrow('Reason too long');
  });
});
