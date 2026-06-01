/**
 * Shared route helpers for the governance HTTP seam.
 * 治理 HTTP seam 的共享路由辅助。
 *
 * Keeps query parsing and response schema registration local to the route layer
 * so individual Rule route modules stay thin and consistent.
 * 将查询解析与响应 schema 注册收敛在路由层本地，
 * 让各个 Rule 路由模块保持轻量且一致。
 */
import { z } from 'zod';
import type { RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { RuleId, RuleRevisionId } from '@dailyuse/contracts/primitives';

/** Platform middleware contract for governance routes. 治理路由的平台中间件契约。 */
export interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

/** Shared OpenAPI registry type for governance routes. 治理路由共享的 OpenAPI 注册器类型。 */
export type GovernanceOpenApiRegistry = OpenApiRegistryLike | null | undefined;

/**
 * Parses query value as a string.
 * 将查询参数解析为字符串。
  * @param value - 
  * @returns any - 
 */
export function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

/**
 * Parses query value as a finite number.
 * 将查询参数解析为有限数字。
  * @param value - 
  * @returns any - 
 */
export function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parses query value as a comma-separated string array.
 * 将查询参数解析为逗号分隔的字符串数组。
  * @param value - 
  * @returns any - 
 */
export function parseStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}

/**
 * Shared rule response schema for route registration.
 * 路由注册共享的规则响应 Schema。
 */
export const RuleResponseSchema = z.object({
  id: brandedId<RuleId>(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string(),
  status: z.string(),
  deprecationReason: z.string().nullable().optional(),
  replacementRuleId: brandedId<RuleId>().nullable().optional(),
  liveReferenceLocation: z.string().nullable().optional(),
  tags: z.array(z.string()),
  goodExamples: z
    .array(
      z.object({
        id: z.string(),
        language: z.string(),
        content: z.string(),
        caption: z.string().optional(),
      }),
    )
    .optional(),
  badExamples: z
    .array(
      z.object({
        id: z.string(),
        language: z.string(),
        content: z.string(),
        caption: z.string().optional(),
      }),
    )
    .optional(),
  authorId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Shared rule revision response schema for route registration.
 * 路由注册共享的规则修订响应 Schema。
 */
export const RuleRevisionResponseSchema = z.object({
  id: brandedId<RuleRevisionId>(),
  ruleId: brandedId<RuleId>(),
  version: z.number(),
  createdAt: z.number(),
});
