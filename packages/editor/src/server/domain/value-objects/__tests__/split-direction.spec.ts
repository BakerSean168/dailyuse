import { describe, expect, it } from 'vitest';
import { SplitDirection } from '../split-direction';

describe('SplitDirection', () => {
  it('validates type', () => {
    expect(SplitDirection.isValid('Horizontal')).toBe(true);
    expect(SplitDirection.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(SplitDirection.of('Vertical')).toBe('Vertical');
  });

  it('throws on invalid value', () => {
    expect(() => SplitDirection.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(SplitDirection.getAll()).toEqual(['Horizontal', 'Vertical']);
  });

  it('checks type category', () => {
    expect(SplitDirection.isHorizontal(SplitDirection.Horizontal)).toBe(true);
    expect(SplitDirection.isHorizontal(SplitDirection.Vertical)).toBe(false);
    expect(SplitDirection.isVertical(SplitDirection.Vertical)).toBe(true);
    expect(SplitDirection.isVertical(SplitDirection.Horizontal)).toBe(false);
  });
});
