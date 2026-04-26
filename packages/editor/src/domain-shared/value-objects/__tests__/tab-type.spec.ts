import { describe, expect, it } from 'vitest';
import { TabType } from '../tab-type';

describe('TabType', () => {
  it('validates type', () => {
    expect(TabType.isValid('Resource')).toBe(true);
    expect(TabType.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(TabType.of('Preview')).toBe('Preview');
  });

  it('throws on invalid value', () => {
    expect(() => TabType.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(TabType.getAll()).toEqual(['Resource', 'Preview', 'Diff', 'Settings', 'Search', 'Welcome']);
  });

  it('checks type category', () => {
    expect(TabType.isContent(TabType.Resource)).toBe(true);
    expect(TabType.isContent(TabType.Preview)).toBe(true);
    expect(TabType.isContent(TabType.Settings)).toBe(false);
    expect(TabType.isUtility(TabType.Search)).toBe(true);
    expect(TabType.isUtility(TabType.Settings)).toBe(true);
    expect(TabType.isUtility(TabType.Welcome)).toBe(false);
  });
});
