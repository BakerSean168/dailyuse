/**
 * 侧边栏激活标签枚举
 */
export const SidebarActiveTab = {
  Files: 'Files',
  Tags: 'Tags',
  Search: 'Search',
  Outline: 'Outline',
  Resources: 'Resources',
} as const;

export type SidebarActiveTab = (typeof SidebarActiveTab)[keyof typeof SidebarActiveTab];
