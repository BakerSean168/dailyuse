import type { SidebarActiveTab as ISidebarActiveTab } from '@dailyuse/contracts/editor';

/**
 * SidebarActiveTab 枚举类型
 */

export type SidebarActiveTab = ISidebarActiveTab & { readonly __brand: unique symbol };

const VALUES: ISidebarActiveTab[] = ['Files', 'Tags', 'Search', 'Outline', 'Resources'];

export const SidebarActiveTab = {
  Files: 'Files' as SidebarActiveTab,
  Tags: 'Tags' as SidebarActiveTab,
  Search: 'Search' as SidebarActiveTab,
  Outline: 'Outline' as SidebarActiveTab,
  Resources: 'Resources' as SidebarActiveTab,

  of(value: string): SidebarActiveTab {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SidebarActiveTab: ${value}`);
    }
    return value as SidebarActiveTab;
  },

  isValid(value: string): value is SidebarActiveTab {
    return VALUES.includes(value as ISidebarActiveTab);
  },

  getAll(): SidebarActiveTab[] {
    return VALUES as SidebarActiveTab[];
  },

  isNavigational(tab: SidebarActiveTab): boolean {
    return tab === this.Files || tab === this.Tags;
  },

  isUtility(tab: SidebarActiveTab): boolean {
    return tab === this.Search || tab === this.Outline;
  },
};
