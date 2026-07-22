/**
 * ============================================================================
 * Governance Module - Rule Revisions API
 * 规则治理模块 - 规则修订记录查询
 * ============================================================================
 *
 * 【设计说明】
 * 规则修订记录是只读的审计数据，仅提供查询接口，不提供创建/更新/删除接口
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { RuleId, RuleRevisionId } from '../primitives/ids';
import type { RuleRevisionClientDTO } from '../entities/rule-revision-client';
import { PaginationSchema } from './rules';

// ============================================================================
// GET Operation - 获取修订记录历史
// ============================================================================

/**
 * 获取规则修订历史查询 Schema
 *
 * 【查询参数】
 * - ruleId: 规则 ID（必填）
 * - page: 页码（从1开始）
 * - pageSize: 每页数量（默认20）
 */
export const GetRuleRevisionsQuerySchema = z
  .object({
    ruleId: brandedId<RuleId>(),
  })
  .merge(PaginationSchema);

export type GetRuleRevisionsQuery = z.infer<typeof GetRuleRevisionsQuerySchema>;

/**
 * Revisions query input type (before Zod defaults are applied). page/pageSize are optional.
 * 修订查询输入类型（Zod 默认值应用前）。page/pageSize 为可选。
 */
export type GetRuleRevisionsQueryInput = z.input<typeof GetRuleRevisionsQuerySchema>;

export type GetRuleRevisionsRes = {
  items: RuleRevisionClientDTO[];
  total: number;
  page: number;
  pageSize: number;
};

// ============================================================================
// GET SINGLE Operation - 获取单个修订记录详情
// ============================================================================

/**
 * 获取单个修订记录查询 Schema
 */
export const GetRuleRevisionSchema = z.object({
  id: brandedId<RuleRevisionId>(),
});

export type GetRuleRevisionReq = z.infer<typeof GetRuleRevisionSchema>;

