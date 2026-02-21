/**
 * MSW Handlers - Goal Module
 *
 * Intercepts HTTP requests to the Goal API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockGoal,
  createMockQueryGoalsRes,
  createMockGoalFolder,
} from '@dailyuse/contracts/mocks';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

// 1. 读取环境变量中的基础路径 (与你的 http client 保持一致)
// 如果获取不到，默认回退到 '/api/v1' 以防万一
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// 2. 动态拼接当前模块的路径
// 结果类似于: '/api/v1/account'
const BASE = `${API_BASE}/goals`;

// Narrow MSW path params (which can be string | readonly string[]) to a GoalId
const toGoalId = (p: string | readonly string[]) =>
  (Array.isArray(p) ? p[0] : p) as GoalClientDTO['id'];

export const goalHandlers = [
  // GET /api/v1/goals — list goals
  http.get(BASE, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockQueryGoalsRes(10),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/goals — create goal
  http.post(BASE, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    // CreateGoalSchema uses 'title' field; GoalClientDTO uses 'name'
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoal({ name: body['title'] as string | undefined }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // GET /api/v1/goals/:id — get single goal
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockGoal({ id: toGoalId(params["id"]) }),
      timestamp: Date.now(),
    });
  }),

  // PATCH /api/v1/goals/:id — update goal
  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockGoal({
        id: toGoalId(params["id"]),
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/goals/:id — delete goal
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: createMockGoal({ id: toGoalId(params["id"]) }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/goals/:id/activate
  http.post(`${BASE}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Activated',
      data: createMockGoal({
        id: toGoalId(params["id"]),
        status: 'Active',
      }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/goals/:id/complete
  http.post(`${BASE}/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: createMockGoal({
        id: toGoalId(params["id"]),
        status: 'Completed',
        completedAt: Date.now(),
      }),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/goals/folders — list folders
  http.get(`${BASE}/folders`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: Array.from({ length: 3 }, () => createMockGoalFolder()),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/goals/folders — create folder
  http.post(`${BASE}/folders`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockGoalFolder({ name: body['name'] as string | undefined }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // GET /api/v1/goals/search
  http.get(`${BASE}/search`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockQueryGoalsRes(5),
      timestamp: Date.now(),
    });
  }),
];
