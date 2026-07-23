/**
 * Shared persistence parsing utilities.
 *
 * Used by Prisma and PowerSync mappers for defensive parsing of database
 * values such as dates, JSON payloads, and SQL LIKE fragments.
 * Residual 1025: parseJsonSafe elevated for notification mapper dual retirement.
 * Soft residual 1081: account PowerSync private parseJson keep-boundary (throws; no force-merge).
 * Soft residual 1091: api PowerSync parseJsonLikeString keep-boundary (JSON-looking only; no force-merge).
 * Soft residual 1095: data-portability parseJsonField keep-boundary (unknown + passthrough; no force-merge).
 * Soft residual 1123: toDate always-Date+now vs toDateOrNull vs portable toDateString vs AI PowerSync Date|null.
 */

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}

export function withCause(message: string, err: unknown): string {
  return `${message} [cause: ${extractErrorMessage(err)}]`;
}

export function fromDbDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date from DB: ${String(value)}`);
  }
  return date;
}

// Residual 1123 keep-boundary: always Date; nullish/invalid → new Date() (now fallback).
// Soft residual 1123: not portable toDateString / AI PowerSync toDate (Date|null) / fromDbDate throw.
export function toDate(value: Date | number | string | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

// Residual 1123 family: nullish/invalid → null (no now invent).
export function toDateOrNull(value: Date | number | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Soft residual 1081: keep-boundary vs account PowerSync throw-on-invalid parseJson. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Residual 1025: sole null-fallback JSON parser for notification prisma/powersync mappers.
 * Equivalent to parseJson(value, null); local parseJsonSafe duals retired.
 */
export function parseJsonSafe<T>(value: string | null | undefined): T | null {
  return parseJson(value, null);
}

export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function parseRecord(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function escapeSqlLike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/"/g, '\\"');
}
