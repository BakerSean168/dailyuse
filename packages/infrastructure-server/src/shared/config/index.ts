/**
 * Shared Infrastructure Configuration
 * 鍏变韩鍩虹璁炬柦閰嶇疆
 *
 * @module Shared/Infrastructure/Config
 */

export { prisma, ensurePrismaConnected, disconnectPrisma } from './prisma';
export { env, validateEnv, getEnv } from './env';
export { DataSourceManager } from './data-source-manager';
export type { DataSourceType, DataSourceConfig } from './data-source-manager';
export type { PrismaClient } from '../../generated/prisma/client';
