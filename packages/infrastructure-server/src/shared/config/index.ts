/**
 * Shared Infrastructure Configuration
 * 共享基础设施配置
 *
 * @module Shared/Infrastructure/Config
 */

export { prisma, ensurePrismaConnected, disconnectPrisma } from './prisma';
export { env, validateEnv, getEnv } from './env';
export { DataSourceManager } from './data-source-manager';
export type { DataSourceType, DataSourceConfig } from './data-source-manager';
export type { PrismaClient } from '@prisma/client';
