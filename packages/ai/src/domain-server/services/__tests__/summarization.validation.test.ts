import { describe, it, expect } from 'vitest';
import { AIGenerationValidationService } from '../AIGenerationValidationService';

describe('AIGenerationService.validateSummaryOutput', () => {
  const service = new AIGenerationValidationService();

  function makeSummary(overrides: Partial<any> = {}) {
    return {
      core: 'word '.repeat(60).trim(),
      keyPoints: [
        'point words '.repeat(8).trim(),
        'another point words '.repeat(8).trim(),
        'third point words '.repeat(8).trim(),
      ],
      actionItems: ['Do something', 'Prepare list'],
      ...overrides,
    };
  }

  it('valid summary passes', () => {
    expect(() => service.validateSummaryOutput(makeSummary(), true)).not.toThrow();
  });

  it('rejects core too short', () => {
    const s = makeSummary({ core: 'too short' });
    expect(() => service.validateSummaryOutput(s, true)).toThrow();
  });

  it('rejects wrong keyPoints count', () => {
    const s = makeSummary({ keyPoints: ['only one'] });
    expect(() => service.validateSummaryOutput(s, true)).toThrow();
  });

  it('rejects actionItems present when includeActions=false', () => {
    const s = makeSummary();
    expect(() => service.validateSummaryOutput(s, false)).toThrow();
  });
});
