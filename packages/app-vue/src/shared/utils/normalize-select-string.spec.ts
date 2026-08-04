import { describe, expect, it } from 'vitest';
import { normalizeSelectString } from './normalize-select-string';

describe('normalizeSelectString', () => {
  it('keeps string selections', () => {
    expect(normalizeSelectString('Asia/Shanghai')).toBe('Asia/Shanghai');
    expect(normalizeSelectString('')).toBe('');
  });

  it.each([undefined, null, true, 1, { value: 'x' }])(
    'maps non-string Select value %o to no selection',
    (value) => {
      expect(normalizeSelectString(value)).toBeNull();
    },
  );
});
