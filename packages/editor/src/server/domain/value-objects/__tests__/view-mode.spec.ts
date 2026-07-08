import { describe, expect, it } from 'vitest';
import { ViewMode } from '../view-mode';

describe('ViewMode', () => {
  it('validates type', () => {
    expect(ViewMode.isValid('Editor')).toBe(true);
    expect(ViewMode.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(ViewMode.of('Preview')).toBe('Preview');
  });

  it('throws on invalid value', () => {
    expect(() => ViewMode.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(ViewMode.getAll()).toEqual(['Editor', 'Preview', 'SplitH', 'SplitV']);
  });

  it('checks type category', () => {
    expect(ViewMode.isSplit(ViewMode.SplitH)).toBe(true);
    expect(ViewMode.isSplit(ViewMode.SplitV)).toBe(true);
    expect(ViewMode.isSplitHorizontal(ViewMode.SplitH)).toBe(true);
    expect(ViewMode.isSplitVertical(ViewMode.SplitV)).toBe(true);
    expect(ViewMode.showsEditor(ViewMode.Editor)).toBe(true);
    expect(ViewMode.showsEditor(ViewMode.SplitH)).toBe(true);
    expect(ViewMode.showsEditor(ViewMode.SplitV)).toBe(true);
    expect(ViewMode.showsPreview(ViewMode.Preview)).toBe(true);
    expect(ViewMode.showsPreview(ViewMode.SplitH)).toBe(true);
    expect(ViewMode.showsPreview(ViewMode.SplitV)).toBe(true);
    expect(ViewMode.showsEditor(ViewMode.Preview)).toBe(false);
    expect(ViewMode.showsPreview(ViewMode.Editor)).toBe(false);
  });
});
