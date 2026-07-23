/**
 * Portable projection helpers (export/import mapping).
 * Residual 1095 keep-boundary: parseJsonField accepts unknown (non-string passthrough),
 * catch returns fallback ?? original value. Intentionally not:
 * - utils parseJson/parseJsonSafe (string|null|undefined only + fixed fallback)
 * - api PowerSync parseJsonLikeString (brace/bracket-looking only)
 * - account PowerSync throw-on-invalid parseJson
 */
import type { ExportContext } from '../../portable-runtime';

// Residual 1095 keep-boundary: unknown input + non-string passthrough + fallback??value catch.
export function parseJsonField<T = unknown>(value: unknown, fallback?: T): T | unknown {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback ?? value;
  }
}

export function toDateString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

// Residual 1101 keep-boundary: unknown → number|undefined (any number + Date + Date.parse string).
// Intentionally not: AI goal-planning (positive-only), notification (string→null), app-react (0 fallback).
export function toTimestamp(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

// Residual 1113 keep-boundary: always boolean (fallback); numbers + case-insensitive 1/0/true/false.
// Intentionally not query parseBoolean family (utils/schedule/goal → boolean|undefined, no fallback).
export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (value === '1' || value.toLowerCase() === 'true') return true;
    if (value === '0' || value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

// Residual 1109 keep-boundary: parseJsonField then typeof string filter (JSON strings ok; no trim).
// Soft residual 1109: AI knowledge-index keep-empty + goal-planning trim/non-empty (no force-merge).
export function toStringArray(value: unknown): string[] {
  const parsed = parseJsonField(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === 'string');
}

// Residual 1099 keep-boundary: parseJsonField then plain-object or undefined (not {} / null).
// Soft residual 1099: AI asRecord null + schedule.importer asRecord {} keep-boundaries (no force-merge).
export function toRecord(value: unknown): Record<string, unknown> | undefined {
  const parsed = parseJsonField(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Residual 1003 / Residual 1017: sole export ref resolvers for task/reminder/repository
 * and goal/editor projections.
 * entityLabel selects the dual warning / throw message domain word.
 */

export function resolveExportRef(
  id: string | null | undefined,
  ctx: ExportContext,
  entityLabel: string,
): string | null {
  if (!id) return null;
  const ref = ctx.refToIdMap.get(id);
  if (ref) return ref;
  ctx.warnings.push(`Unresolved ${entityLabel} reference to ${id}`);
  return null;
}

export function resolveExportRefOrThrow(
  id: string,
  ctx: ExportContext,
  entityLabel: string,
): string {
  const ref = ctx.refToIdMap.get(id);
  if (ref) return ref;
  throw new Error(`EXPORT_VALIDATION_ERROR: Unresolved ${entityLabel} reference to ${id}`);
}
