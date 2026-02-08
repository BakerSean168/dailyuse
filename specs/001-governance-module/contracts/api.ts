// Governance Module API Contracts - Requests and Responses
// Following Protocol → API → DTOs layering

import { z } from 'zod';
import type { RuleId, RuleStatus, RuleSeverity } from '../value-objects';

// ==================== Zod Schemas ====================

/**
 * Schema: Create Rule Request
 */
export const CreateRuleSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z]+-[0-9]+$/, 'Code must match pattern: PREFIX-NUMBER (e.g., DDD-001)'),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  severity: z.enum(['Mandatory', 'Recommended']),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  goodExamples: z.array(z.object({
    language: z.enum(['TypeScript', 'JSON', 'YAML', 'Prisma']),
    content: z.string().min(1).max(10240),
    caption: z.string().max(200).optional(),
  })).min(1, 'At least one GoodExample required'),
  badExamples: z.array(z.object({
    language: z.enum(['TypeScript', 'JSON', 'YAML', 'Prisma']),
    content: z.string().min(1).max(10240),
    caption: z.string().max(200).optional(),
  })).min(1, 'At least one BadExample required'),
  liveReferenceLocation: z.string().optional(),
});

/**
 * Schema: Update Rule Request
 */
export const UpdateRuleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  severity: z.enum(['Mandatory', 'Recommended']).optional(),
  tags: z.array(z.string()).min(1).optional(),
  liveReferenceLocation: z.string().optional(),
  // Code snippets updated via separate operations (addSnippet, removeSnippet)
});

/**
 * Schema: Search Rules Query
 */
export const SearchRulesQuerySchema = z.object({
  keyword: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Draft', 'Active', 'Deprecated']).optional(),
  severity: z.enum(['Mandatory', 'Recommended']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(10).max(100).default(20),
});

/**
 * Schema: Deprecate Rule Request
 */
export const DeprecateRuleSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  replacementRuleId: z.string().uuid().optional(),
});

// ==================== Request Types ====================

/**
 * Request: Create Rule
 */
export type CreateRuleReq = z.infer<typeof CreateRuleSchema>;

/**
 * Request: Update Rule
 */
export type UpdateRuleReq = z.infer<typeof UpdateRuleSchema>;

/**
 * Request: Get Rule
 */
export interface GetRuleReq {
  id: RuleId;
}

/**
 * Request: Delete Rule
 */
export interface DeleteRuleReq {
  id: RuleId;
}

/**
 * Request: List Rules
 */
export interface ListRulesReq {
  page?: number;
  pageSize?: number;
  status?: RuleStatus;
}

/**
 * Request: Search Rules
 */
export type SearchRulesReq = z.infer<typeof SearchRulesQuerySchema>;

/**
 * Request: Filter Rules by Tag
 */
export interface FilterRulesByTagReq {
  tag: string;
  page?: number;
  pageSize?: number;
}

/**
 * Request: Filter Rules by Status
 */
export interface FilterRulesByStatusReq {
  status: RuleStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Request: Get Rule Revisions
 */
export interface GetRuleRevisionsReq {
  ruleId: RuleId;
  page?: number;
  pageSize?: number;
}

/**
 * Request: Deprecate Rule
 */
export type DeprecateRuleReq = z.infer<typeof DeprecateRuleSchema>;

/**
 * Request: Reactivate Rule
 */
export interface ReactivateRuleReq {
  id: RuleId;
}

// ==================== Response Types ====================

/**
 * Code Snippet DTO (embedded in Rule responses)
 */
export interface CodeSnippetDTO {
  id: string;
  language: 'TypeScript' | 'JSON' | 'YAML' | 'Prisma';
  content: string;
  type: 'GoodExample' | 'BadExample';
  caption?: string;
}

/**
 * Rule DTO (base response type)
 */
export interface RuleDTO {
  id: RuleId;
  code: string;
  title: string;
  description: string; // Markdown
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason?: string;
  replacementRuleId?: RuleId;
  liveReferenceLocation?: string;
  tags: string[];
  codeSnippets: CodeSnippetDTO[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rule Revision DTO (audit history)
 */
export interface RuleRevisionDTO {
  id: string;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: Date;
}

/**
 * Response: Create Rule
 */
export interface CreateRuleRes {
  rule: RuleDTO;
}

/**
 * Response: Update Rule
 */
export interface UpdateRuleRes {
  rule: RuleDTO;
}

/**
 * Response: Get Rule
 */
export interface GetRuleRes {
  rule: RuleDTO;
}

/**
 * Response: Delete Rule
 */
export interface DeleteRuleRes {
  success: boolean;
}

/**
 * Response: List Rules
 */
export interface ListRulesRes {
  rules: RuleDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response: Search Rules
 */
export interface SearchRulesRes {
  rules: RuleDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response: Filter Rules by Tag
 */
export interface FilterRulesByTagRes {
  rules: RuleDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response: Filter Rules by Status
 */
export interface FilterRulesByStatusRes {
  rules: RuleDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response: Get Rule Revisions
 */
export interface GetRuleRevisionsRes {
  revisions: RuleRevisionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response: Deprecate Rule
 */
export interface DeprecateRuleRes {
  rule: RuleDTO;
}

/**
 * Response: Reactivate Rule
 */
export interface ReactivateRuleRes {
  rule: RuleDTO;
}

// ==================== Barrel Export ====================

export * from './governance-rpc-map';
export * from './governance-event-map';
