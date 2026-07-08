import { describe, expect, it } from 'vitest';
import { GoalId } from '../goal-id';

describe('GoalId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = GoalId.generate();

    expect(GoalId.is(value)).toBe(true);
    expect(GoalId.of(value)).toBe(value);
  });
});
