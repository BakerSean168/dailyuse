import { describe, expect, it } from 'vitest';
import { VALIDATION_RULES } from './validation';

describe('VALIDATION_RULES', () => {
  it('required rejects empty string and accepts non-empty', () => {
    const rule = VALIDATION_RULES.required('required');
    expect(rule('')).toBe('required');
    expect(rule('ok')).toBe(true);
  });

  it('email validates basic addresses', () => {
    const rule = VALIDATION_RULES.email('bad email');
    expect(rule('not-an-email')).toBe('bad email');
    expect(rule('user@example.com')).toBe(true);
  });
});
