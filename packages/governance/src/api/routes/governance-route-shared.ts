/**
 * Shared route helpers for the governance HTTP seam.
 * 治理 HTTP seam 的共享路由辅助。
 */

import type { RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';

export interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export type GovernanceOpenApiRegistry = OpenApiRegistryLike | null | undefined;

// Residual 681: OpenAPI routes use contracts response schemas directly
// (RuleClientDTOSchema / ListRulesResSchema / SearchRulesResSchema / GetRuleRevisionsResSchema).
// No local *ResponseSchema name dual aliases.

// Residual 1023: parseString/parseNumber dual retired onto @dailyuse/utils/shared (residual 989 sole).
// Re-export so governance route imports from this shared module stay stable.
export { parseNumber, parseString } from '@dailyuse/utils/shared';

/**
 * Parses an unknown query value into a normalized string array.
 * 将未知 query 值解析为规范化字符串数组。
 * @param value - Raw query value from the HTTP seam.
 * @returns Trimmed string array, or undefined when no values remain.
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
