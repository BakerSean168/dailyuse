/**
 * 外部链接对象
 */
export interface ExternalLink {
  url: string;
  title: string;
  source: 'YOUTUBE' | 'ARTICLE' | 'OTHER';
  snapshotUrl?: string; // 网页快照或截图
}

export interface ExternalLinkDTO {
  url: string;
  title: string;
  source: 'YOUTUBE' | 'ARTICLE' | 'OTHER';
  snapshotUrl?: string;
}