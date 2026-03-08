/**
 * 外部链接对象
 */
export const ExternalLinkSource = {
  Youtube: 'Youtube',
  Article: 'Article',
  Other: 'Other',
} as const;

export type ExternalLinkSource = (typeof ExternalLinkSource)[keyof typeof ExternalLinkSource];

export interface ExternalLink {
  url: string;
  title: string;
  source: ExternalLinkSource;
  snapshotUrl?: string; // 网页快照或截图
}

export interface ExternalLinkDTO {
  url: string;
  title: string;
  source: ExternalLinkSource;
  snapshotUrl?: string;
}
