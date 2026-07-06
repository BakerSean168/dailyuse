import { describe, expect, it } from 'vitest';
import { RuleId } from '../rule-id';

describe('RuleId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = RuleId.generate();

    expect(RuleId.is(value)).toBe(true);
    expect(RuleId.of(value)).toBe(value);
  });
});
