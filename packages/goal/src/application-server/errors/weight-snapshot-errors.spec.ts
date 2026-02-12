import { describe, it, expect } from 'vitest';
import { GoalNotFoundError, KeyResultNotFoundError } from './weight-snapshot-errors';

describe('WeightSnapshotErrors', () => {
  it('GoalNotFoundError should have correct properties', () => {
    const error = new GoalNotFoundError('goal-1');
    expect(error.code).toBe('GOAL_NOT_FOUND');
    expect(error.message).toContain('goal-1');
    expect(error.details).toEqual({ goalUuid: 'goal-1' });
    expect(error.statusCode).toBe(404);
  });

  it('KeyResultNotFoundError should have correct properties', () => {
    const error = new KeyResultNotFoundError('kr-1', 'goal-1');
    expect(error.code).toBe('KEY_RESULT_NOT_FOUND');
    expect(error.message).toContain('kr-1');
    expect(error.details).toEqual({ krUuid: 'kr-1', goalUuid: 'goal-1' });
    expect(error.statusCode).toBe(404);
  });
});
