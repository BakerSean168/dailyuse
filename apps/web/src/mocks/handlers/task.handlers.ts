/**
 * MSW Handlers - Task Module
 *
 * Intercepts HTTP requests to the Task API and returns mock data.
 * Paths match the actual HTTP adapters:
 *   - TaskTemplateHttpAdapter: /tasks/templates
 *   - TaskInstanceHttpAdapter: /tasks/templates/instances
 *   - TaskDependencyHttpAdapter: /tasks
 *
 * IMPORTANT: Handler order matters in MSW. More-specific paths must come
 * before catch-all param routes. INSTANCES and TEMPLATES sub-resource handlers
 * must appear before TEMPLATES/:id, because TEMPLATES/:id would otherwise
 * match /tasks/templates/instances with id="instances".
 */

import { http, HttpResponse } from 'msw';
import {
  createMockTaskTemplate,
  createMockTaskTemplateList,
  createMockTaskInstance,
  createMockTaskInstanceList,
} from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES = `${API_BASE}/tasks/templates`;
const INSTANCES = `${TEMPLATES}/instances`;
const TASKS = `${API_BASE}/tasks`;

export const taskHandlers = [
  // ============ Templates (exact paths) ============

  http.get(`${TEMPLATES}/by-priority`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskTemplateList(10),
      timestamp: Date.now(),
    });
  }),

  http.get(TEMPLATES, () => {
    const templates = createMockTaskTemplateList(10);
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { templates, total: templates.length },
      timestamp: Date.now(),
    });
  }),

  http.post(TEMPLATES, async ({ request }) => {
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

  // ============ Instances (must be before TEMPLATES/:id) ============
  // TEMPLATES/:id would match /tasks/templates/instances with id="instances"
  // so all INSTANCES routes must be registered first.

  http.get(INSTANCES, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstanceList(8),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/check-expired`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Checked',
      data: { count: 0, instances: [] },
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/start`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Started',
      data: createMockTaskInstance({ id: params.id as string, status: 'InProgress' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: createMockTaskInstance({ id: params.id as string, status: 'Completed' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/skip`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Skipped',
      data: createMockTaskInstance({ id: params.id as string, status: 'Skipped' }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${INSTANCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstance({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${INSTANCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Template sub-resources (must be before TEMPLATES/:id) ============

  http.get(`${TEMPLATES}/:id/instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstanceList(5, { templateId: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/generate-instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Generated',
      data: createMockTaskInstanceList(3, { templateId: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Activated',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Active' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Paused' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/archive`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Archived',
      data: createMockTaskTemplate({ id: params.id as string, status: 'Deleted' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/bind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Bound',
      data: createMockTaskTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/unbind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Unbound',
      data: createMockTaskTemplate({ id: params.id as string, goalBinding: null }),
      timestamp: Date.now(),
    });
  }),

  // ============ Template CRUD catch-all (last among TEMPLATES routes) ============

  http.get(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskTemplate({ id: params.id as string }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockTaskTemplate({ id: params.id as string, ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),

  // ============ Dependencies ============

  http.post(`${TASKS}/dependencies/validate`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Valid',
      data: { valid: true, cycles: [] },
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/dependencies`, ({ params }) => {
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: {
          id: `dep-${Date.now()}`,
          sourceTaskId: params.taskId,
          targetTaskId: 'target-id',
          type: 'FinishToStart',
        },
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${TASKS}/:taskId/dependencies`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: [],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependents`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: [],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependency-chain`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: { chain: [], hasCycle: false },
      timestamp: Date.now(),
    });
  }),

  http.put(`${TASKS}/dependencies/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: {
        id: params.id as string,
        predecessorTaskId: 'predecessor-1',
        successorTaskId: 'successor-1',
        dependencyType: 'FinishToStart',
        lagDays: 0,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      },
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TASKS}/dependencies/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: { id: params.id },
      timestamp: Date.now(),
    });
  }),
];
