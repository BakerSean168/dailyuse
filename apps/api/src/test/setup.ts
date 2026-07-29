/**
 * API fast-test setup
 * @description 默认 `api:test` 只负责快反馈测试，不在这里绑定真实数据库生命周期。
 */

import { registerFastTestHooks } from '@dailyuse/test-utils';
import type { Request, Response, NextFunction } from 'express';

registerFastTestHooks({
  env: {
    // Must satisfy env.schema JWT_SECRET min(32); short values poison
    // process.env under vitest isolate:false and break later suite imports
    // after loadAllEnvFiles switched to override:false (process.env wins).
    JWT_SECRET: 'test-jwt-secret-not-for-production',
  },
});

// API test helper utilities. Fast tests should inject a fake db when constructing
// a full app instance; smoke/integration suites own real boundary setup separately.
export const ApiTestHelpers = {
  /**
   * Create a test Express app.
   * Pass a fake db into app-factory callers when a fast test must avoid real Prisma.
   */
  createTestApp: async () => {
    const { createApp } = await import('./app-factory');
    return createApp();
  },

  /**
   * 创建测试用的认证 Token
   */
  createTestToken: async (payload = { identityId: 'test-user-123' }) => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-not-for-production';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  },

  /**
   * Mock auth middleware for isolated HTTP tests.
   */
  mockAuth: (identityId = 'test-user-123') => {
    return (req: Request, res: Response, next: NextFunction) => {
      (req as unknown as Record<string, unknown>).user = { identityId };
      next();
    };
  },
};
