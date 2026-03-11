import { http, HttpResponse } from 'msw';
import {
  createMockTaskTemplate,
  createMockTaskTemplateList,
  createMockTaskInstance,
  createMockTaskInstanceList,
} from '@dailyuse/contracts/mocks';
import type {
  DependencyChainClientDTO,
  TaskDependencyClientDTO,
  ValidateDependencyResponse,
} from '@dailyuse/contracts/task';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TEMPLATES = `${API_BASE}/task-templates`;
const INSTANCES = `${API_BASE}/task-instances`;
const TASKS = `${API_BASE}/tasks`;

export const taskMockRoutes = {
  templates: TEMPLATES,
  instances: INSTANCES,
  tasks: TASKS,
};

export function createMockTaskDependency(
  overrides: Partial<TaskDependencyClientDTO> = {},
): TaskDependencyClientDTO {
  return {
    id: overrides.id ?? `dep-${Date.now()}`,
    predecessorTaskId: overrides.predecessorTaskId ?? 'task-predecessor-1',
    successorTaskId: overrides.successorTaskId ?? 'task-successor-1',
    dependencyType: overrides.dependencyType ?? 'FinishToStart',
    lagDays: overrides.lagDays ?? 0,
    version: overrides.version ?? 1,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
    deletedAt: overrides.deletedAt ?? null,
    predecessorTaskTitle: overrides.predecessorTaskTitle,
    successorTaskTitle: overrides.successorTaskTitle,
  };
}

export function createMockValidateDependencyResponse(
  overrides: Partial<ValidateDependencyResponse> = {},
): ValidateDependencyResponse {
  return {
    isValid: overrides.isValid ?? true,
    errors: overrides.errors,
    wouldCreateCycle: overrides.wouldCreateCycle ?? false,
    cyclePath: overrides.cyclePath,
    message: overrides.message ?? 'Dependency is valid.',
  };
}

export function createMockDependencyChain(
  overrides: Partial<DependencyChainClientDTO> = {},
): DependencyChainClientDTO {
  return {
    taskId: overrides.taskId ?? 'task-1',
    allPredecessors: overrides.allPredecessors ?? [],
    allSuccessors: overrides.allSuccessors ?? [],
    depth: overrides.depth ?? 0,
    isOnCriticalPath: overrides.isOnCriticalPath ?? false,
    estimatedCompletionDate: overrides.estimatedCompletionDate,
  };
}

export const taskHandlers = [
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
      data: createMockTaskTemplate({ id: params.id as string, status: 'Archived' }),
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

  http.delete(`${TEMPLATES}/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/dependencies/validate`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Valid',
      data: createMockValidateDependencyResponse(),
      timestamp: Date.now(),
    });
  }),

  http.post(`${TASKS}/:taskId/dependencies`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<TaskDependencyClientDTO>;
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Created',
        data: createMockTaskDependency({
          predecessorTaskId: body.predecessorTaskId ?? 'task-predecessor-1',
          successorTaskId: body.successorTaskId ?? (params.taskId as string),
          dependencyType: body.dependencyType,
          lagDays: body.lagDays,
        }),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.get(`${TASKS}/:taskId/dependencies`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: [
        createMockTaskDependency({
          successorTaskId: params.taskId as string,
          predecessorTaskTitle: 'Prepare inputs',
          successorTaskTitle: 'Run task',
        }),
      ],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependents`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: [
        createMockTaskDependency({
          predecessorTaskId: params.taskId as string,
          successorTaskId: 'task-dependent-1',
          predecessorTaskTitle: 'Run task',
          successorTaskTitle: 'Review output',
        }),
      ],
      timestamp: Date.now(),
    });
  }),

  http.get(`${TASKS}/:taskId/dependency-chain`, ({ params }) => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Success',
      data: createMockDependencyChain({ taskId: params.taskId as string }),
      timestamp: Date.now(),
    });
  }),

  http.put(`${TASKS}/dependencies/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<TaskDependencyClientDTO>;
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Updated',
      data: createMockTaskDependency({
        id: params.id as string,
        dependencyType: body.dependencyType,
        lagDays: body.lagDays,
      }),
      timestamp: Date.now(),
    });
  }),

  http.delete(`${TASKS}/dependencies/:id`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Deleted',
      data: null,
      timestamp: Date.now(),
    });
  }),
];
