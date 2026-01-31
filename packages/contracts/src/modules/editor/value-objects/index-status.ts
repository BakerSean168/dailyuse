/**
 * 索引状态枚举
 */
export const IndexStatus = {
  NotIndexed: 'NotIndexed',
  Indexing: 'Indexing',
  Indexed: 'Indexed',
  Failed: 'Failed',
  Outdated: 'Outdated',
} as const;

export type IndexStatus = (typeof IndexStatus)[keyof typeof IndexStatus];
