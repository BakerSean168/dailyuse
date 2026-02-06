/**
 * Prisma Client Singleton
 * Single Prisma Client Instance
 *
 * Responsibilities:
 * - Provide global PrismaClient singleton
 * - Ensure only one database connection in the application
 *
 * @module Shared/Infrastructure
 */

import { PrismaClient } from "../../generated/prisma/client";

/**
 * Global Prisma Client Instance
 */
export const prisma = new PrismaClient();

/**
 * Ensure Prisma Client is connected
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
 * Gracefully disconnect Prisma connection
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export type { PrismaClient } from '../../generated/prisma/client';
