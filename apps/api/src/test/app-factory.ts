/**
 * API Test App Factory
 * 提供测试用的 Express 应用实例
 */

import type { Express } from 'express';
import { prisma } from '@memoflow/database';
import type { DatabaseClient } from '../shared/contracts/api-module';
import { ApiBootstrapper } from '../bootstrap';
import { createCloudAuthStub } from './cloud-auth.stub';

/**
 * 创建测试用的 Express 应用
 * @param db - 可选的数据库客户端实例（用于注入测试数据库）
 * @returns Express 应用实例
 */
export async function createApp(db?: DatabaseClient): Promise<Express> {
  // 使用新的 ApiBootstrapper 创建测试应用
  // 传入 db 或使用默认的 prisma 实例
  const bootstrapper = new ApiBootstrapper(db ?? prisma, createCloudAuthStub());
  return bootstrapper.init();
}
