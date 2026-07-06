/**
 * Shared route helpers for the governance HTTP seam.
 * 治理 HTTP seam 的共享路由辅助。
 */

import type { RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import {
  GetRuleRevisionsResSchema,
  ListRulesResSchema,
  RuleClientDTOSchema,
  RuleRevisionClientDTOSchema,
  SearchRulesResSchema,
} from '@dailyuse/contracts/governance';

export interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export type GovernanceOpenApiRegistry = OpenApiRegistryLike | null | undefined;

export const RuleResponseSchema = RuleClientDTOSchema;
export const RuleRevisionResponseSchema = RuleRevisionClientDTOSchema;
export const GovernanceListRulesResponseSchema = ListRulesResSchema;
export const GovernanceSearchRulesResponseSchema = SearchRulesResSchema;
export const GovernanceRuleRevisionsResponseSchema = GetRuleRevisionsResSchema;

/**
 * Parses an unknown query value into a single string.
 * 将未知 query 值解析为单个字符串。
 * @param value - Raw query value from the HTTP seam.
 * @returns Normalized string value, or undefined when absent.
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
 * Parses an unknown query value into a finite number.
 * 将未知 query 值解析为有限数字。
 * @param value - Raw query value from the HTTP seam.
 * @returns Parsed finite number, or undefined when invalid.
 */
export function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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
