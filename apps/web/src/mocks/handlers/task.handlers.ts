import { http, HttpResponse } from 'msw';
import {
  createMockTaskTemplate,
  createMockTaskTemplateList,
  createMockTaskInstance,
  createMockTaskInstanceList,
} from '@memoflow/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES = `${API_BASE}/task-templates`;
const INSTANCES = `${API_BASE}/task-instances`;

export const taskMockRoutes = {
  templates: TEMPLATES,
  instances: INSTANCES,
};

type MockTaskTemplateOverrides = NonNullable<Parameters<typeof createMockTaskTemplate>[0]>;
type MockTaskInstanceOverrides = NonNullable<Parameters<typeof createMockTaskInstance>[0]>;
type TaskTemplateId = NonNullable<MockTaskTemplateOverrides['id']>;
type TaskInstanceId = NonNullable<MockTaskInstanceOverrides['id']>;

const toTaskTemplateId = (value: string | readonly string[] | undefined): TaskTemplateId =>
  (Array.isArray(value) ? value[0] : (value ?? '')) as TaskTemplateId;

const toTaskInstanceId = (value: string | readonly string[] | undefined): TaskInstanceId =>
  (Array.isArray(value) ? value[0] : (value ?? '')) as TaskInstanceId;
export const taskHandlers = [
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

  http.get(INSTANCES, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstanceList(8),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/start`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Started',
      data: createMockTaskInstance({ id: toTaskInstanceId(params.id), status: 'InProgress' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/complete`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Completed',
      data: createMockTaskInstance({ id: toTaskInstanceId(params.id), status: 'Completed' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/missed`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Missed',
      data: createMockTaskInstance({ id: toTaskInstanceId(params.id), status: 'Missed' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${INSTANCES}/:id/skip`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Skipped',
      data: createMockTaskInstance({ id: toTaskInstanceId(params.id), status: 'Skipped' }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${INSTANCES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstance({ id: toTaskInstanceId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${INSTANCES}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.get(`${TEMPLATES}/:id/instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskInstanceList(5, { templateId: toTaskTemplateId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/generate-instances`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Generated',
      data: createMockTaskInstanceList(3, { templateId: toTaskTemplateId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/activate`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Activated',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id), status: 'Active' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/pause`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Paused',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id), status: 'Paused' }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/archive`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Archived',
      data: createMockTaskTemplate({
        id: toTaskTemplateId(params.id),
        status: 'Active',
        archivedAt: Date.now(),
      }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/bind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Bound',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TEMPLATES}/:id/unbind-goal`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Unbound',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id), goalBinding: null }),
      timestamp: Date.now(),
    });
  }),

  http.get(`${TEMPLATES}/:id`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id) }),
      timestamp: Date.now(),
    });
  }),

  http.patch(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${TEMPLATES}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockTaskTemplate({ id: toTaskTemplateId(params.id), ...(body as object) }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TEMPLATES}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

];
