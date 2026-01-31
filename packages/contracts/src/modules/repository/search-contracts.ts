/**
 * Search Contracts
 * Story 11.2: Obsidian 风格搜索
 * Story 11.6: 高级搜索功能（property 模式）
 */

/**
 * 搜索模式
 */
export type SearchMode = 'all' | 'file' | 'tag' | 'line' | 'section' | 'path' | 'property';

/**
 * 搜索请求
 */
export interface SearchRequest {
  repositoryUuid: string;
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
export type MatchType = 'filename' | 'tag' | 'content' | 'section' | 'path' | 'property';

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  // 资源信息
  resourceUuid: string;
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
