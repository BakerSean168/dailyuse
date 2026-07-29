/**
 * Shared helpers for module importers.
 */

import { newId } from '@memoflow/utils';
import { ResultCode, ResultErrorException } from '@memoflow/contracts/result';
import type { ImportContext } from '../../portable-runtime';
import type { DataPortabilityImportTx } from '../../import-store/data-portability-import-store';

export type TxClient = DataPortabilityImportTx;

export function jsonStringify(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function inc(ctx: ImportContext, key: string, count = 1): void {
  ctx.created[key] = (ctx.created[key] ?? 0) + count;
}

export function incSingleton(ctx: ImportContext, key: string): void {
  ctx.updatedSingletons[key] = (ctx.updatedSingletons[key] ?? 0) + 1;
}

export function resolveRef(ref: string, ctx: ImportContext): string {
  const id = ctx.refMap.get(ref);
  if (!id) throwValidationError(`Unresolvable reference "${ref}"`);
  return id;
}

export function optRef(ref: string | null | undefined, ctx: ImportContext): string | null {
  if (!ref) return null;
  return resolveRef(ref, ctx);
}

export function allocateId(ctx: ImportContext, ref: string): string {
  const id = newId();
  ctx.refMap.set(ref, id);
  return id;
}

/** Cast a typed portable DTO to a mutable record for field access */
export function rec<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

export function timestamps(record: Record<string, unknown>): {
  createdAt?: string;
  updatedAt?: string;
} {
  const result: { createdAt?: string; updatedAt?: string } = {};
  if (typeof record.createdAt === 'string') result.createdAt = record.createdAt;
  if (typeof record.updatedAt === 'string') result.updatedAt = record.updatedAt;
  return result;
}

export function createdTimestamp(record: Record<string, unknown>): { createdAt?: string } {
  return typeof record.createdAt === 'string' ? { createdAt: record.createdAt } : {};
}

export function throwValidationError(message: string): never {
  throw new ResultErrorException(message, ResultCode.VALIDATION_ERROR);
}
