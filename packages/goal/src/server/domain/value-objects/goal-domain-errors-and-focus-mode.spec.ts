import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  GoalArchivedError,
  GoalDeletedError,
  GoalInvalidDateModificationError,
  GoalInvalidDateRangeError,
  GoalKeyResultNotFoundError,
  GoalNameRequiredError,
  GoalNameTooLongError,
  GoalReviewNotFoundError,
  GoalReviewRatingInvalidError,
  GoalTargetDateNotSetError,
  KeyResultNotFoundInGoalError,
  KeyResultWeightExceededError,
  KeyResultWeightInvalidError,
} from './errors';
import { FocusMode } from './focus-mode';
import { HiddenGoalsMode } from './hidden-goals-mode';

describe('goal server value objects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds stable domain errors', () => {
    expect(new GoalNameRequiredError()).toMatchObject({
      code: 'goal_name_required',
      message: '目标名称不能为空',
    });
    expect(
      new GoalInvalidDateRangeError(
        new Date('2026-04-27T00:00:00.000Z'),
        new Date('2026-04-26T00:00:00.000Z'),
      ),
    ).toMatchObject({
      code: 'goal_invalid_date_range',
    });
    expect(new GoalInvalidDateModificationError('Extend', 0).message).toContain('无效的日期延长操作');
    expect(new GoalTargetDateNotSetError().code).toBe('goal_target_date_not_set');
    expect(new GoalKeyResultNotFoundError('kr-1').message).toContain('kr-1');
    expect(new GoalReviewNotFoundError('review-1').message).toContain('review-1');
    expect(new KeyResultNotFoundInGoalError('kr-2', 'goal-1' as never).message).toContain('goal-1');
    expect(new GoalDeletedError('goal-2').message).toContain('goal-2');
    expect(new GoalArchivedError().message).toContain('目标已归档');
    expect(new GoalNameTooLongError().code).toBe('goal_name_too_long');
    expect(new KeyResultWeightInvalidError(9).message).toContain('9');
    expect(new KeyResultWeightExceededError(7, 2).message).toContain('当前总计 7');
    expect(new GoalReviewRatingInvalidError(6).message).toContain('6');
  });

  it('supports focus mode lifecycle and serialization', () => {
    const focusMode = FocusMode.create(
      'IFocusModeId_550e8400-e29b-41d4-a716-446655440001',
      'IdentityId_1',
      ['GoalId_1', 'GoalId_2'],
      Date.UTC(2026, 3, 26, 0, 0, 0),
      Date.UTC(2026, 3, 28, 0, 0, 0),
      HiddenGoalsMode.Dim,
    );

    expect(focusMode.id).toBe('IFocusModeId_550e8400-e29b-41d4-a716-446655440001');
    expect(focusMode.identityId).toBe('IdentityId_1');
    expect(focusMode.focusedGoalIds).toEqual(['GoalId_1', 'GoalId_2']);
    expect(focusMode.hiddenGoalsMode).toBe(HiddenGoalsMode.Dim);
    expect(focusMode.isActive).toBe(true);
    expect(focusMode.getRemainingDays()).toBe(2);
    expect(focusMode.toDTO()).toMatchObject({
      isActive: true,
      hiddenGoalsMode: HiddenGoalsMode.Dim,
    });

    const extended = focusMode.extend(Date.UTC(2026, 3, 29, 0, 0, 0));
    expect(extended.endTime.toISOString()).toBe('2026-04-29T00:00:00.000Z');

    const deactivated = extended.deactivate();
    expect(deactivated.isActive).toBe(false);
    expect(deactivated.actualEndTime).not.toBeNull();

    expect(FocusMode.fromDTO(focusMode.toDTO()).toDTO()).toEqual(focusMode.toDTO());

    expect(() =>
      FocusMode.create(
        'FocusModeId_2',
        'IdentityId_1',
        [],
        Date.UTC(2026, 3, 26, 0, 0, 0),
        Date.UTC(2026, 3, 25, 0, 0, 0),
      ),
    ).toThrow('Focus mode end time must be later than start time');
    expect(() => focusMode.extend(Date.UTC(2026, 3, 26, 12, 0, 0))).toThrow(
      'New end time must be later than current end time',
    );
    expect(() => deactivated.extend(Date.UTC(2026, 3, 30, 0, 0, 0))).toThrow(
      'Cannot extend an inactive focus mode',
    );
  });
});
