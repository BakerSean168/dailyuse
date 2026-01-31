/**
 * 项目类型枚举
 */
export const ProjectType = {
  Markdown: 'Markdown',
  Code: 'Code',
  Mixed: 'Mixed',
  Other: 'Other',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];
