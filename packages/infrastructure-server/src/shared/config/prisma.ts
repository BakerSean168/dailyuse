/**
 * Prisma Client Singleton
 * 单一 Prisma 客户端实�?
 *
 * 职责�?
 * - 提供全局 PrismaClient 单例
 * - 确保整个应用只有一个数据库连接
 *
 * @module Shared/Infrastructure
 */

import type {  PrismaClient  } from "@prisma/client";

/**
 * 全局 Prisma 客户端实�?
 */
export const prisma = new PrismaClient();

/**
 * 确保 Prisma 客户端已连接
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
 * 优雅断开 Prisma 连接
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export type { PrismaClient } from '@prisma/client';
