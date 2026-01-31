/**
 * 内容类型枚举（用于 LinkedContent）
 */
export const ContentType = {
  Article: 'Article',
  Video: 'Video',
  Image: 'Image',
  Document: 'Document',
  Other: 'Other',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];
