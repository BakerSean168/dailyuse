import type { ExportContext } from '../../portable-runtime';

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

export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (value === '1' || value.toLowerCase() === 'true') return true;
    if (value === '0' || value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

export function toStringArray(value: unknown): string[] {
  const parsed = parseJsonField(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === 'string');
}

export function toRecord(value: unknown): Record<string, unknown> | undefined {
  const parsed = parseJsonField(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Residual 1003: sole export ref resolvers for task/reminder/repository projections.
 * entityLabel selects the dual warning / throw message domain word.
 * Soft residual: goal/editor keep local resolveRef (message shapes differ).
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
