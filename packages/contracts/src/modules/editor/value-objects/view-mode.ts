/**
 * 视图模式枚举
 */
export const ViewMode = {
  Editor: 'Editor',
  Preview: 'Preview',
  SplitH: 'SplitH',
  SplitV: 'SplitV',
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];
