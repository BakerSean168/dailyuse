/**
 * Residual 979: sole toPrismaJson helper for AI Prisma adapters.
 * Agent-checkpoint + knowledge-index Prisma adapters import this; local duals retired.
 * Soft residual: account package toPrismaJson keeps DTO→InputJsonObject cast shape — keep-boundary.
 * Residual 1159 keep-boundary: AI deep-clone InputJsonValue vs account typed DTO cast InputJsonObject (no force-merge).
 */

import { Prisma } from '@memoflow/database/prisma';

/** Deep-clone value into a Prisma InputJsonValue-safe structure. */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
