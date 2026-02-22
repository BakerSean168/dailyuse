/**
 * MSW Handlers - Task Module
 *
 * Intercepts HTTP requests to the Task API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockTaskTemplate, createMockTaskTemplateList } from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/task-templates`;

export const taskHandlers = [
  // GET /api/v1/task-templates — list templates
  http.get(BASE, () => {
    const templates = createMockTaskTemplateList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: {
        templates,
        total: templates.length,
      },
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/task-templates/:id — get single template
  http.get(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-templates — create template
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockTaskTemplate({ name: body.name as string }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  // PUT /api/v1/task-templates/:id — update template
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockTaskTemplate({
        id: params.id as string,
        ...(body as object),
      }),
      timestamp: Date.now(),
    });
  }),

  // DELETE /api/v1/task-templates/:id — delete template
  http.delete(`${BASE}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-templates/:id/activate
  http.post(`${BASE}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Activated',
      data: createMockTaskTemplate({
        id: params.id as string,
        status: 'Active',
      }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-templates/:id/pause
  http.post(`${BASE}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockTaskTemplate({
        id: params.id as string,
        status: 'Paused',
      }),
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-templates/:id/archive
  http.post(`${BASE}/:id/archive`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Archived',
      data: createMockTaskTemplate({
        id: params.id as string,
        status: 'Deleted',
      }),
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/task-templates/folders — list folders
  http.get(`${BASE}/folders`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: Array.from({ length: 3 }, (_, i) => ({
        id: `folder-${i}`,
        name: `任务文件夹 ${i + 1}`,
        identityId: 'mock-identity-id',
        sortOrder: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      total: 3,
      timestamp: Date.now(),
    });
  }),

  // GET /api/v1/task-templates/:id/instances — list instances
  http.get(`${BASE}/:id/instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: Array.from({ length: 5 }, (_, i) => ({
        id: `instance-${i}`,
        templateId: params.id,
        name: `任务实例 ${i + 1}`,
        status: i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'Pending' : 'InProgress',
        scheduledDate: Date.now() + i * 86400000,
        createdAt: Date.now() - i * 86400000,
      })),
      total: 5,
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-instances/:id/start
  http.post(`${API_BASE}/task-instances/:id/start`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Started',
      data: {
        id: params.id as string,
        status: 'InProgress',
        startedAt: Date.now(),
      },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-instances/:id/complete
  http.post(`${API_BASE}/task-instances/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: {
        id: params.id as string,
        status: 'Completed',
        completedAt: Date.now(),
      },
      timestamp: Date.now(),
    });
  }),

  // POST /api/v1/task-instances/:id/skip
  http.post(`${API_BASE}/task-instances/:id/skip`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Skipped',
      data: {
        id: params.id as string,
        status: 'Skipped',
        skippedAt: Date.now(),
      },
      timestamp: Date.now(),
    });
  }),
];
