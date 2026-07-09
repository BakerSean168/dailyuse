import { SidebarActiveTab as SidebarActiveTabContract, type SidebarActiveTab as ISidebarActiveTab } from '@dailyuse/contracts/editor';

/**
 * SidebarActiveTab 枚举类型
 */

export type SidebarActiveTab = ISidebarActiveTab & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ISidebarActiveTab[] = Object.values(SidebarActiveTabContract);

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
