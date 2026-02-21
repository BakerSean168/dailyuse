/**
 * MSW Handlers - Authentication Module
 *
 * Intercepts HTTP requests to the Auth API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockAuthResponse } from '@dailyuse/contracts/mocks';

// 1. 读取环境变量中的基础路径 (与你的 http client 保持一致)
// 如果获取不到，默认回退到 '/api/v1' 以防万一
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// 2. 动态拼接当前模块的路径
// 结果类似于: '/api/v1/account'
const BASE = `${API_BASE}/auth`;

export const authHandlers = [
  // POST /api/v1/auth/login — email/password login
  http.post(`${BASE}/login`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Login successful',
      data: createMockAuthResponse(),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/auth/register — register new account
  http.post(`${BASE}/register`, () => {
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Registration successful',
        data: createMockAuthResponse(),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // POST /api/v1/auth/refresh — refresh access token
  http.post(`${BASE}/refresh`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Token refreshed',
      data: {
        accessToken: Math.random().toString(36).substring(2),
        refreshToken: Math.random().toString(36).substring(2),
      },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/auth/logout — logout
  http.post(`${BASE}/logout`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Logged out',
      data: null,
      timestamp: Date.now(),
    });
  }),
];
