import { describe, expect, it } from 'vitest';
import { SidebarActiveTab } from '../sidebar-active-tab';

describe('SidebarActiveTab', () => {
  it('validates type', () => {
    expect(SidebarActiveTab.isValid('Files')).toBe(true);
    expect(SidebarActiveTab.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(SidebarActiveTab.of('Tags')).toBe('Tags');
  });

  it('throws on invalid value', () => {
    expect(() => SidebarActiveTab.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(SidebarActiveTab.getAll()).toEqual(['Files', 'Tags', 'Search', 'Outline', 'Resources']);
  });

  it('checks type category', () => {
    expect(SidebarActiveTab.isNavigational(SidebarActiveTab.Files)).toBe(true);
    expect(SidebarActiveTab.isNavigational(SidebarActiveTab.Tags)).toBe(true);
    expect(SidebarActiveTab.isNavigational(SidebarActiveTab.Search)).toBe(false);
    expect(SidebarActiveTab.isUtility(SidebarActiveTab.Outline)).toBe(true);
    expect(SidebarActiveTab.isUtility(SidebarActiveTab.Search)).toBe(true);
    expect(SidebarActiveTab.isUtility(SidebarActiveTab.Files)).toBe(false);
  });
});
