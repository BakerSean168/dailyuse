/**
 * Prisma Client Singleton
 * 鍗曚竴 Prisma 瀹㈡埛绔疄锟?
 *
 * 鑱岃矗锟?
 * - 鎻愪緵鍏ㄥ眬 PrismaClient 鍗曚緥
 * - 纭繚鏁翠釜搴旂敤鍙湁涓€涓暟鎹簱杩炴帴
 *
 * @module Shared/Infrastructure
 */

import { PrismaClient } from "@prisma/client";

/**
 * 鍏ㄥ眬 Prisma 瀹㈡埛绔疄锟?
 */
export const prisma = new PrismaClient();

/**
 * 纭繚 Prisma 瀹㈡埛绔凡杩炴帴
 */
export async function ensurePrismaConnected(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to Prisma:', error);
    throw error;
  }
}

/**
 * 浼橀泤鏂紑 Prisma 杩炴帴
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export type { PrismaClient } from '@prisma/client';
