/**
 * 链接来源类型枚举
 */
export const LinkedSourceType = {
  MarkdownLink: 'MarkdownLink',
  MarkdownImage: 'MarkdownImage',
  HtmlAnchor: 'HtmlAnchor',
  HtmlImage: 'HtmlImage',
  WikiLink: 'WikiLink',
  Reference: 'Reference',
} as const;

export type LinkedSourceType = (typeof LinkedSourceType)[keyof typeof LinkedSourceType];
