/**
 * Governance Module - Client Types
 *
 * 本地类型定义，镜像 API 响应结构。
 * 避免直接依赖 @dailyuse/governance 包的构建产物。
 */

// ============ Value Objects ============

export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Deprecated: 'Deprecated',
} as const;
export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

export const RuleSeverity = {
  Mandatory: 'Mandatory',
  Recommended: 'Recommended',
} as const;
export type RuleSeverity = (typeof RuleSeverity)[keyof typeof RuleSeverity];

export const Language = {
  TypeScript: 'TypeScript',
  JSON: 'JSON',
  YAML: 'YAML',
  Prisma: 'Prisma',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const SnippetType = {
  GoodExample: 'GoodExample',
  BadExample: 'BadExample',
} as const;
export type SnippetType = (typeof SnippetType)[keyof typeof SnippetType];

// ============ DTOs ============

export interface CodeSnippetDTO {
  id: string;
  language: Language;
  content: string;
  type: SnippetType;
  caption: string | null;
}

export interface RuleClientDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: string | null;
  liveReferenceLocation: string | null;
  tags: string[];
  goodExamples: CodeSnippetDTO[];
  badExamples: CodeSnippetDTO[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleRevisionClientDTO {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: string;
}

// ============ API Requests ============

export interface CreateRuleReq {
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  tags: string[];
  goodExamples: { language: string; content: string; caption?: string }[];
  badExamples: { language: string; content: string; caption?: string }[];
  liveReferenceLocation?: string;
}

export interface UpdateRuleReq {
  title?: string;
  description?: string;
  tags?: string[];
  liveReferenceLocation?: string | null;
}

export interface ListRulesQuery {
  status?: RuleStatus;
  tags?: string[];
  severity?: RuleSeverity;
  page?: number;
  pageSize?: number;
}

export interface SearchRulesQuery {
  query: string;
  status?: RuleStatus;
  tags?: string[];
  severity?: RuleSeverity;
  page?: number;
  pageSize?: number;
}

// ============ API Responses ============

export interface ListRulesRes {
  items: RuleClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchRulesRes {
  items: RuleClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  searchTime: number;
}
