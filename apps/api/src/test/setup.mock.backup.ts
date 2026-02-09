/**
 * API 测试环境配置
 * @description 为 API 层提供测试环境初始化，包括数据库和 Express 应用模拟
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { mockPrismaClient, resetMockData } from './mocks/prismaMock';

// Mock Prisma config module (unified config after cleanup)
vi.mock('../shared/infrastructure/config/prisma.js', () => ({
  prisma: mockPrismaClient,
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

// Mock PrismaClient 构造函数
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}));

beforeEach(async () => {
  // 重置所有模拟函数
  vi.clearAllMocks();

  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.DATABASE_URL = 'file:./test.db';

  // 重置Mock数据
  resetMockData();

  // 设置时区为 UTC
  process.env.TZ = 'UTC';

  // 重置日期模拟
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['Date'],
  });
});

afterEach(async () => {
  // 清理模拟
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// API 测试工具函数
export const ApiTestHelpers = {
  /**
   * 创建测试用的 Express 应用
   */
  createTestApp: async () => {
    const { createApp } = await import('./app-factory');
    return createApp();
  },

  /**
   * 创建测试用的认证 Token
   */
  createTestToken: async (payload = { accountUuid: 'test-user-123' }) => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key';
    return jwt.default.sign(payload, secret, { expiresIn: '1h' });
  },

  /**
   * 创建测试用的请求头
   */
  createAuthHeaders: (token?: string) => ({
    Authorization: `Bearer ${token || ApiTestHelpers.createTestToken()}`,
    'Content-Type': 'application/json',
  }),

  /**
   * 模拟数据库响应
   */
  mockDatabaseResponse: <T>(data: T) => {
    return Promise.resolve(data);
  },

  /**
   * CRUD 测试助手
   */
  crud: {
    /**
     * 测试 POST 创建接口
     */
    testCreate: async (
      request: any,
      endpoint: string,
      authToken: string,
      data: any,
      expectedStatus = 201,
    ) => {
      const response = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)
        .expect(expectedStatus);

      return response.body;
    },

    /**
     * 测试 GET 查询接口
     */
    testRead: async (request: any, endpoint: string, authToken: string, expectedStatus = 200) => {
      const response = await request
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(expectedStatus);

      return response.body;
    },

    /**
     * 测试 PUT 更新接口
     */
    testUpdate: async (
      request: any,
      endpoint: string,
      authToken: string,
      data: any,
      expectedStatus = 200,
    ) => {
      const response = await request
        .put(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)
        .expect(expectedStatus);

      return response.body;
    },

    /**
     * 测试 DELETE 删除接口
     */
    testDelete: async (request: any, endpoint: string, authToken: string, expectedStatus = 200) => {
      const response = await request
        .delete(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(expectedStatus);

      return response.body;
    },
  },

  /**
   * 业务逻辑测试助手
   */
  business: {
    /**
     * 测试数据验证
     */
    testValidation: async (request: any, endpoint: string, authToken: string, invalidData: any) => {
      const response = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      return response.body;
    },

    /**
     * 测试权限验证
     */
    testUnauthorized: async (request: any, endpoint: string, method = 'get') => {
      const response = await request[method](endpoint).expect(401);
      return response.body;
    },

    /**
     * 测试资源不存在
     */
    testNotFound: async (request: any, endpoint: string, authToken: string, method = 'get') => {
      const response = await request[method](endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      return response.body;
    },

    /**
     * 测试业务逻辑规则
     */
    testBusinessRule: async (request: any, endpoint: string, authToken: string, data: any) => {
      const response = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)
        .expect(400);

      return response.body;
    },
  },

  /**
   * 性能测试助手
   */
  performance: {
    /**
     * 测试接口响应时间
     */
    testResponseTime: async (request: any, endpoint: string, authToken: string) => {
      const start = Date.now();
      await request.get(endpoint).set('Authorization', `Bearer ${authToken}`).expect(200);
      const duration = Date.now() - start;
      return duration;
    },

    /**
     * 测试并发处理
     */
    testConcurrency: async (
      request: any,
      endpoint: string,
      authToken: string,
      concurrency = 10,
    ) => {
      const promises = Array(concurrency)
        .fill(null)
        .map(() => request.get(endpoint).set('Authorization', `Bearer ${authToken}`).expect(200));

      const results = await Promise.all(promises);
      return results;
    },
  },

  /**
   * 创建测试数据
   */
  createTestData: {
    user: (overrides = {}) => ({
      uuid: 'test-user-123',
      email: 'test@example.com',
      name: '测试用户',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    goal: (overrides = {}) => ({
      uuid: 'test-goal-123',
      accountUuid: 'test-account-123',
      name: '测试目标',
      description: '测试目标描述',
      color: '#FF5733',
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    task: (overrides = {}) => ({
      uuid: 'test-task-123',
      accountUuid: 'test-account-123',
      title: '测试任务',
      description: '测试任务描述',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),
  },
};

// 导出测试常量
export const API_TEST_CONSTANTS = {
  // 测试端口
  TEST_PORT: 0, // 使用随机端口

  // 测试数据库
  TEST_DATABASE_URL: 'file:./test.db',

  // JWT 密钥
  TEST_JWT_SECRET: 'test-jwt-secret-key',

  // API 路径
  API_PATHS: {
    AUTH: '/api/auth',
    GOALS: '/api/goals',
    TASKS: '/api/tasks',
    REMINDERS: '/api/reminders',
    THEMES: '/api/themes',
  },

  // 测试账户
  TEST_ACCOUNT: {
    uuid: 'test-account-123',
    email: 'test@example.com',
    name: '测试账户',
  },
} as const;

// 导出模拟的 Prisma 客户端
export { mockPrismaClient as mockPrisma };
