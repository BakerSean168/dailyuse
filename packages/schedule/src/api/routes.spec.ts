import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@memoflow/utils/result';
import type { ScheduleApplicationPort } from '../server/application';
import { registerScheduleRoutes } from './routes';

type RegisteredRoute = {
  method: string;
  path: string;
  request?: Record<string, unknown>;
  responses?: Record<string, unknown>;
};

class TestOpenApiRegistry implements OpenApiRegistryLike {
  readonly paths: RegisteredRoute[] = [];

  registerPath(route: Record<string, unknown>): void {
    this.paths.push(route as RegisteredRoute);
  }

  register(): void {}
}

const authMiddleware = ((_, __, next) => next()) as RequestHandler;

function createHandlersStub(): ScheduleApplicationPort {
  return {
    createTask: vi.fn(),
    listTasks: vi.fn(),
    getTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    pauseTask: vi.fn(),
    resumeTask: vi.fn(),
    triggerTask: vi.fn(),
    completeTask: vi.fn(),
    cancelTask: vi.fn(),
    getDueTasks: vi.fn(),
    batchOperateTasks: vi.fn(),
    batchDeleteTasks: vi.fn(),
    updateTaskMetadata: vi.fn(),
  } as unknown as ScheduleApplicationPort;
}

function getRegisteredRoute(
  registry: TestOpenApiRegistry,
  method: string,
  path: string,
): RegisteredRoute {
  const route = registry.paths.find(
    (candidate) => candidate.method === method && candidate.path === path,
  );
  expect(route).toBeDefined();
  return route!;
}

function getJsonBodySchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return (((route.request?.body as Record<string, unknown> | undefined)?.content as
    | Record<string, unknown>
    | undefined)?.['application/json'] as Record<string, unknown> | undefined)?.schema as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

function getResponseSchema(
  route: RegisteredRoute,
  status: number,
): {
  safeParse: (value: unknown) => { success: boolean };
} {
  const responses = route.responses as Record<string, { content?: Record<string, unknown> }> | undefined;
  const response = responses?.[String(status)];
  const schema = (response?.content as Record<string, unknown> | undefined)?.[
    'application/json'
  ] as { schema?: { safeParse: (value: unknown) => { success: boolean } } } | undefined;
  return schema?.schema ?? (response as unknown as { safeParse: (value: unknown) => { success: boolean } });
}

function getParamsSchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return route.request?.params as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

const BASE = '/api/v1/schedules';
const UUID = '7e92ca52-b331-4cbb-9ecc-2b1f1471c370';

function registerAll(registry: TestOpenApiRegistry) {
  return registerScheduleRoutes(
    createHandlersStub(),
    { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
    registry,
  );
}

describe('schedule task route contracts', () => {
  it('POST /tasks/batch uses batch operation request schema and success summary envelope', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'post', `${BASE}/tasks/batch`);
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(bodySchema.safeParse({ taskIds: ['task-1'], operation: 'cancel' }).success).toBe(false);
    expect(bodySchema.safeParse({ taskIds: [], operation: 'pause' }).success).toBe(false);
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: {
          success: [UUID],
          failed: [{ taskId: UUID, error: 'missing' }],
          total: 2,
          successCount: 1,
          failedCount: 1,
        },
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
  });

  it('POST /tasks/batch/delete uses batch delete summary shape, not deleted-count shape', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'post', `${BASE}/tasks/batch/delete`);
    const responseSchema = getResponseSchema(route, 200);

    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: {
          success: [UUID],
          failed: [],
          total: 1,
          successCount: 1,
          failedCount: 0,
        },
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: { deleted: 1 },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });

  it('PATCH /tasks/{id}/metadata uses UpdateTaskMetadataRequestSchema and branded params', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'patch', `${BASE}/tasks/{id}/metadata`);
    const bodySchema = getJsonBodySchema(route);
    const paramsSchema = getParamsSchema(route);

    expect(paramsSchema.safeParse({ id: 'bare-string' }).success).toBe(false);
    expect(bodySchema.safeParse({ payload: { foo: 'bar' }, tags: ['ops'] }).success).toBe(true);
    expect(bodySchema.safeParse({ tags: 'ops' }).success).toBe(false);
  });

  it('GET /tasks/due returns an array envelope', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'get', `${BASE}/tasks/due`);
    const responseSchema = getResponseSchema(route, 200);

    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: [],
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: {},
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });
});
