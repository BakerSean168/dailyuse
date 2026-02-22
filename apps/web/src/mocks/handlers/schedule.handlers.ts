/**
 * MSW Handlers - Schedule Module
 *
 * Intercepts HTTP requests to the Schedule API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import {
  createMockScheduleTask,
  createMockScheduleTaskList,
  createMockScheduleExecution,
  createMockScheduleExecutionList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/schedule-tasks`;

export const scheduleHandlers = [
  // GET /api/v1/schedule-tasks — list tasks
  http.get(BASE, () => {
    const tasks = createMockScheduleTaskList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        tasks,
        total: tasks.length,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/schedule-tasks/:id — get single task
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockScheduleTask({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/schedule-tasks — create task
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockScheduleTask({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // PUT /api/v1/schedule-tasks/:id — update task
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockScheduleTask({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/schedule-tasks/:id — delete task
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/schedule-tasks/:id/pause
  http.post(`${BASE}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockScheduleTask({
        id: params.id as string,
        status: 'Paused',
        enabled: false,
      }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/schedule-tasks/:id/resume
  http.post(`${BASE}/:id/resume`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Resumed',
      data: createMockScheduleTask({
        id: params.id as string,
        status: 'Active',
        enabled: true,
      }),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/schedule-tasks/:id/executions — list executions
  http.get(`${BASE}/:id/executions`, ({ params }) => {
    const executions = createMockScheduleExecutionList(10, {
      scheduleTaskId: params.id as string,
    });
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        data: executions,
        total: executions.length,
      },
      timestamp: Date.now(),
    });
  }),
];
