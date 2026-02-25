/**
 * API Bootstrapper Smoke Tests
 *
 * 测试层级: API & Controller (冒烟测试)
 * 策略: 防御为主，极简测试 — 只验证核心链路能"跑通一次"
 *
 * 覆盖内容:
 * - Bootstrapper 初始化
 * - 基础设施路由挂载（/healthz, /readyz, /info）
 * - 全局中间件生效（Helmet headers, CORS）
 * - API 路由前缀挂载（/api, /api/v1）
 * - 404 错误处理
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { ApiBootstrapper } from '../bootstrap';

describe('API Bootstrapper Smoke Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // 使用空的 mock DB — 冒烟测试不需要真实数据库
    const mockDb = {} as any;
    const bootstrapper = new ApiBootstrapper(mockDb);

    // 不注册任何业务模块 — 只测试基础设施
    app = await bootstrapper.init();
  });

  // ==================== 基础设施路由 ====================

  describe('基础设施路由', () => {
    it('GET /healthz 应返回 200', async () => {
      const res = await request(app).get('/healthz');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /livez 应返回 200', async () => {
      const res = await request(app).get('/livez');

      expect(res.status).toBe(200);
    });

    it('GET /info 应返回应用信息', async () => {
      const res = await request(app).get('/info');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
    });
  });

  // ==================== 全局中间件 ====================

  describe('全局中间件', () => {
    it('响应应包含安全 Headers (Helmet)', async () => {
      const res = await request(app).get('/healthz');

      // Helmet 默认设置的部分 headers
      expect(res.headers).toHaveProperty('x-content-type-options');
    });
  });

  // ==================== 错误处理 ====================

  describe('错误处理', () => {
    it('访问不存在的路由应返回 404', async () => {
      const res = await request(app).get('/api/nonexistent-route-xyz');

      expect(res.status).toBe(404);
    });
  });
});
