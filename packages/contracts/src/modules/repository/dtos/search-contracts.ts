/**
 * Search Contracts
 * Story 11.2: Obsidian 风格搜索
 * Story 11.6: 高级搜索功能（property 模式）
 */

/**
 * 搜索模式
 */
export const SearchMode = {
  All: 'all',
  File: 'file',
  Tag: 'tag',
  Line: 'line',
  Section: 'section',
  Path: 'path',
  Property: 'property',
} as const;

export type SearchMode = (typeof SearchMode)[keyof typeof SearchMode];

/**
 * 搜索请求
 */
export interface SearchRequest {
  repositoryId: string;
  query: string;
  mode: SearchMode;
  caseSensitive?: boolean;
  useRegex?: boolean;
  wholeWord?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 搜索匹配项
 */
export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  startIndex: number;
  endIndex: number;
  beforeContext?: string;
  afterContext?: string;
}

/**
 * 匹配类型
 */
export const MatchType = {
  Filename: 'filename',
  Tag: 'tag',
  Content: 'content',
  Section: 'section',
  Path: 'path',
  Property: 'property',
} as const;

export type MatchType = (typeof MatchType)[keyof typeof MatchType];

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  // 资源信息
  resourceId: string;
  resourceName: string;
  resourcePath: string;
  resourceType: string;
  
  // 匹配信息
  matchType: MatchType;
  matches: SearchMatch[];
  matchCount: number;
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  size?: number;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  results: SearchResultItem[];
  totalResults: number;
  totalMatches: number;
  searchTime: number; // 毫秒
  query: string;
  mode: SearchMode;
}
