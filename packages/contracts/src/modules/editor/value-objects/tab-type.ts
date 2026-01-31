/**
 * 标签页类型枚举
 */
export const TabType = {
  Document: 'Document',
  Preview: 'Preview',
  Diff: 'Diff',
  Settings: 'Settings',
  Search: 'Search',
  Welcome: 'Welcome',
} as const;

export type TabType = (typeof TabType)[keyof typeof TabType];
