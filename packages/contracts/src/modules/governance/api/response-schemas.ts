/**
 * Governance response schemas.
 * 治理模块响应体 Zod Schema。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId, RuleId, RuleRevisionId } from '../../../primitives';
import { RuleSeverity } from '../value-objects/rule-severity';
import { RuleStatus } from '../value-objects/rule-status';
import { ChangeType } from '../value-objects/change-type';
import { CodeSnippetDTOSchema } from '../value-objects/code-snippet';
import { RuleTagDTOSchema } from '../value-objects/rule-tag';
import type { RuleClientDTO } from '../aggregates/rule-client';
import type { RuleRevisionClientDTO } from '../entities/rule-revision-client';

// Residual 731: CodeSnippetDTOSchema / RuleTagDTOSchema owned by value-objects
// (re-exported for OpenAPI nested response consumers).
export { CodeSnippetDTOSchema, RuleTagDTOSchema };

export const RuleClientDTOSchema: z.ZodType<RuleClientDTO> = z.object({
  id: brandedId<RuleId>(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(RuleSeverity),
  status: z.enum(RuleStatus),
  deprecationReason: z.string().nullable(),
  replacementRuleId: brandedId<RuleId>().nullable(),
  liveReferenceLocation: z.string().nullable(),
  tags: z.array(RuleTagDTOSchema),
  goodExamples: z.array(CodeSnippetDTOSchema),
  badExamples: z.array(CodeSnippetDTOSchema),
  authorId: brandedId<IdentityId>(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const RuleRevisionClientDTOSchema: z.ZodType<RuleRevisionClientDTO> = z.object({
  id: brandedId<RuleRevisionId>(),
  ruleId: brandedId<RuleId>(),
  revisionNumber: z.number(),
  authorId: brandedId<IdentityId>(),
  changedFields: z.array(z.string()),
  previousValues: z.record(z.string(), z.unknown()),
  newValues: z.record(z.string(), z.unknown()),
  changeType: z.enum(ChangeType),
  createdAt: z.number(),
});

// Residual 783: list/search/revisions Res duals retired — sole ResSchema + z.infer.
export const ListRulesResSchema = z.object({
  items: z.array(RuleClientDTOSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type ListRulesRes = z.infer<typeof ListRulesResSchema>;

export const SearchRulesResSchema = z.object({
  items: z.array(RuleClientDTOSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  searchTime: z.number(),
});
export type SearchRulesRes = z.infer<typeof SearchRulesResSchema>;

export const GetRuleRevisionsResSchema = z.object({
  items: z.array(RuleRevisionClientDTOSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type GetRuleRevisionsRes = z.infer<typeof GetRuleRevisionsResSchema>;

