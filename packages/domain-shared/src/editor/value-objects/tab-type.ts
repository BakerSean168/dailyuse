import type { TabType as ITabType } from '@dailyuse/contracts/editor';

/**
 * TabType 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type TabType = ITabType & { readonly __brand: unique symbol };

const VALUES: ITabType[] = ['Document', 'Preview', 'Diff', 'Settings', 'Search', 'Welcome'];

export const TabType = {
  Document: 'Document' as TabType,
  Preview: 'Preview' as TabType,
  Diff: 'Diff' as TabType,
  Settings: 'Settings' as TabType,
  Search: 'Search' as TabType,
  Welcome: 'Welcome' as TabType,

  of(value: string): TabType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TabType: ${value}`);
    }
    return value as TabType;
  },

  isValid(value: string): value is TabType {
    return VALUES.includes(value as ITabType);
  },

  getAll(): TabType[] {
    return VALUES as TabType[];
  },

  isContent(type: TabType): boolean {
    return type === this.Document || type === this.Preview;
  },

  isUtility(type: TabType): boolean {
    return type === this.Settings || type === this.Search;
  },
};
