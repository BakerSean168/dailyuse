/**
 * Governance Module - OpenAPI Registration
 */

import { z } from 'zod';
import { registry, successResponse, errorResponse } from '../registry';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  ListRulesQuerySchema,
} from '@dailyuse/governance/contracts';

// ============================================================================
// Schemas
// ============================================================================

const GovernanceRuleResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isEnabled: z.boolean(),
  severity: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const RuleRevisionResponseSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string().uuid(),
  version: z.number(),
  changes: z.record(z.unknown()),
  createdAt: z.number(),
});

registry.register('GovernanceRule', GovernanceRuleResponseSchema);
registry.register('RuleRevision', RuleRevisionResponseSchema);

// ============================================================================
// Paths
// ============================================================================

registry.registerPath({
  method: 'post',
  path: '/api/v1/governance/rules',
  tags: ['Governance'],
  summary: '创建治理规则',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateRuleSchema } } } },
  responses: {
    201: successResponse(GovernanceRuleResponseSchema, '创建成功'),
    400: errorResponse('参数错误'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/governance/rules/{id}',
  tags: ['Governance'],
  summary: '更新治理规则',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateRuleSchema } } },
  },
  responses: {
    200: successResponse(GovernanceRuleResponseSchema, '更新成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/governance/rules/{id}',
  tags: ['Governance'],
  summary: '删除治理规则',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.null(), '删除成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/by-code/{code}',
  tags: ['Governance'],
  summary: '按编码获取规则',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ code: z.string() }) },
  responses: {
    200: successResponse(GovernanceRuleResponseSchema, '获取成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/{id}',
  tags: ['Governance'],
  summary: '获取规则详情',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(GovernanceRuleResponseSchema, '获取成功'),
    404: errorResponse('规则不存在'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules',
  tags: ['Governance'],
  summary: '获取规则列表',
  security: [{ bearerAuth: [] }],
  request: { query: ListRulesQuerySchema },
  responses: {
    200: successResponse(z.array(GovernanceRuleResponseSchema), '获取成功'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/governance/rules/{id}/revisions',
  tags: ['Governance'],
  summary: '获取规则修订历史',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: successResponse(z.array(RuleRevisionResponseSchema), '获取成功'),
    404: errorResponse('规则不存在'),
  },
});
