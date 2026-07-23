/**
 * Residual 979: sole toPrismaJson helper for AI Prisma adapters.
 * Agent-checkpoint + knowledge-index Prisma adapters import this; local duals retired.
 * Soft residual: account package toPrismaJson keeps DTO→InputJsonObject cast shape — keep-boundary.
 */

import { Prisma } from '@dailyuse/database/prisma';

/** Deep-clone value into a Prisma InputJsonValue-safe structure. */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
