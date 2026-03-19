/**
 * 链接目标类型枚举
 */
export const LinkedTargetType = {
  Resource: 'Resource',
  Image: 'Image',
  Video: 'Video',
  Audio: 'Audio',
  Archive: 'Archive',
  ExternalUrl: 'ExternalUrl',
  Anchor: 'Anchor',
} as const;

export type LinkedTargetType = (typeof LinkedTargetType)[keyof typeof LinkedTargetType];
