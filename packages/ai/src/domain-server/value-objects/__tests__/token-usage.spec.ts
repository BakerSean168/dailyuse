import { describe, expect, it } from 'vitest';
import { TokenUsage } from '../TokenUsage';

describe('TokenUsage', () => {
  it('computes the total token count when omitted', () => {
    const usage = TokenUsage.create({
      promptTokens: 120,
      completionTokens: 30,
    });

    expect(usage.totalTokens).toBe(150);
    expect(usage.isZero()).toBe(false);
  });

  it('merges usage snapshots and enforces token limits', () => {
    const combined = TokenUsage.zero().add(
      TokenUsage.create({
        promptTokens: 40,
        completionTokens: 20,
      }),
    );

    expect(combined.totalTokens).toBe(60);
    expect(combined.exceedsLimit(50)).toBe(true);
  });
});
