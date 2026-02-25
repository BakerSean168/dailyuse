/**
 * MSW Handlers - Task Module
 *
 * Intercepts HTTP requests to the Task API and returns mock data.
 * Paths match the actual HTTP adapters:
 *   - TaskTemplateHttpAdapter: /tasks/templates
 *   - TaskInstanceHttpAdapter: /tasks/templates/instances
 *   - TaskDependencyHttpAdapter: /tasks
 */

import { http, HttpResponse } from 'msw';
import { createMockTaskTemplate, createMockTaskTemplateList } from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES = `${API_BASE}/tasks/templates`;
const INSTANCES = `${TEMPLATES}/instances`;
const TASKS = `${API_BASE}/tasks`;

export const taskHandlers = [
  // ============ Templates ============

  http.get(`${TEMPLATES}/by-priority`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockTaskTemplateList(10),
      timestamp: Date.now(),
    });
  }),

  http.get(TEMPLATES, () => {
    const templates = createMockTaskTemplateList(10);
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { templates, total: templates.length },
      timestamp: Date.now(),
    });
  }),

  http.post(TEMPLATES, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: createMockTaskTemplate({ name: body.name as string }), timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${TEMPLATES}/:id/instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: Array.from({ length: 5 }, (_, i) => ({
        id: `instance-${i}`, templateId: params.id,
        name: `任务实例 ${i + 1}`,
        status: ['Completed', 'Pending', 'InProgress'][i % 3],
        scheduledDate: Date.now() + i * 86400000,
        createdAt: Date.now() - i * 86400000,
      })),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/generate-instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Generated',
      data: Array.from({ length: 3 }, (_, i) => ({
        id: `gen-instance-${i}`, templateId: params.id,
        status: 'Pending', scheduledDate: Date.now() + i * 86400000,
      })),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Activated',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Active' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Paused',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Paused' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/archive`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Archived',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Deleted' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/bind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Bound',
      data: createMockTaskTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/unbind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Unbound',
      data: createMockTaskTemplate({ id: params.id as string, goalBinding: null }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: createMockTaskTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: createMockTaskTemplate({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Instances ============

  http.get(INSTANCES, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: Array.from({ length: 8 }, (_, i) => ({
        id: `instance-${i}`, templateId: `template-${i % 3}`,
        name: `任务实例 ${i + 1}`,
        status: ['Completed', 'Pending', 'InProgress'][i % 3],
        scheduledDate: Date.now() + i * 86400000,
        createdAt: Date.now() - i * 86400000,
      })),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/check-expired`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Checked',
      data: { expiredCount: 0 },
      timestamp: Date.now(),
    });
  }),

  http.get(`${INSTANCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { id: params.id, templateId: 'template-1', status: 'Pending', scheduledDate: Date.now() },
      timestamp: Date.now(),
    });
  }),

  http.delete(`${INSTANCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/start`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Started',
      data: { id: params.id as string, status: 'InProgress', startedAt: Date.now() },
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Completed',
      data: { id: params.id as string, status: 'Completed', completedAt: Date.now() },
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/skip`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Skipped',
      data: { id: params.id as string, status: 'Skipped', skippedAt: Date.now() },
      timestamp: Date.now(),
    });
  }),

  // ============ Dependencies ============

  http.post(`${TASKS}/dependencies/validate`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Valid',
      data: { valid: true, cycles: [] },
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/dependencies`, ({ params }) => {
    return HttpResponse.json(
      { ok: true, code: 200, message: 'Created', data: { id: `dep-${Date.now()}`, sourceTaskId: params.taskId, targetTaskId: 'target-id', type: 'FinishToStart' }, timestamp: Date.now() },
      { status: 201 },
    );
  }),

  http.get(`${TASKS}/:taskId/dependencies`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: [],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependents`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: [],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependency-chain`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Success',
      data: { chain: [], hasCycle: false },
      timestamp: Date.now(),
    });
  }),

  http.put(`${TASKS}/dependencies/:id`, () => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Updated',
      data: {},
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TASKS}/dependencies/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true, code: 200, message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),
];
