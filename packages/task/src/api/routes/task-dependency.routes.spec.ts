import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { TaskDependencyController } from '../../controllers/task-dependency.controller';
import { registerTaskDependencyRoutes } from './task-dependency.routes';

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

function createControllerStub(): TaskDependencyController {
  return {
    createDependency: vi.fn(),
    getDependencies: vi.fn(),
    getDependents: vi.fn(),
    getDependencyChain: vi.fn(),
    validateDependency: vi.fn(),
    deleteDependency: vi.fn(),
    updateDependency: vi.fn(),
  } as unknown as TaskDependencyController;
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
  _def?: { typeName?: string };
} {
  const responses = route.responses as Record<string, { content?: Record<string, unknown> }> | undefined;
  const response = responses?.[String(status)];
  const schema = (response?.content as Record<string, unknown> | undefined)?.[
    'application/json'
  ] as { schema?: { safeParse: (value: unknown) => { success: boolean }; _def?: { typeName?: string } } } | undefined;
  return schema?.schema ?? (response as unknown as { safeParse: (value: unknown) => { success: boolean } });
}

function getParamsSchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return route.request?.params as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

const BASE = '/api/v1/tasks';

function registerAll(registry: TestOpenApiRegistry) {
  return registerTaskDependencyRoutes(
    createControllerStub(),
    { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
    registry,
  );
}

describe('task-dependency route contracts', () => {
  it('POST /{taskId}/dependencies uses CreateDependencyBodySchema and TaskDependencyResponseSchema', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'post', `${BASE}/{taskId}/dependencies`);
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 201);
    const paramsSchema = getParamsSchema(route);

    expect(bodySchema).toBeDefined();
    expect(responseSchema).toBeDefined();
    expect(paramsSchema).toBeDefined();
    // brandedId rejects bare strings
    expect(paramsSchema.safeParse({ taskId: 'bare-string' }).success).toBe(false);
  });

  it('GET /{taskId}/dependencies returns z.array(TaskDependencyResponseSchema)', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependencies`);
    const responseSchema = getResponseSchema(route, 200);

    expect(responseSchema).toBeDefined();
    // Array should pass
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: [],
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    // Non-array should fail
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: { uuid: 'abc' },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });

  it('GET /{taskId}/dependents returns z.array(TaskDependencyResponseSchema)', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependents`);
    const responseSchema = getResponseSchema(route, 200);
    expect(responseSchema).toBeDefined();
  });

  it('GET /{taskId}/dependency-chain uses DependencyChainResponseSchema', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependency-chain`);
    const responseSchema = getResponseSchema(route, 200);
    expect(responseSchema).toBeDefined();
  });

  it('POST /dependencies/validate uses ValidateDependencyBodySchema', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'post', `${BASE}/dependencies/validate`);
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(bodySchema).toBeDefined();
    expect(responseSchema).toBeDefined();
  });

  it('DELETE /dependencies/{id} returns z.null() data', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'delete', `${BASE}/dependencies/{id}`);
    const responseSchema = getResponseSchema(route, 200);

    expect(responseSchema).toBeDefined();
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: null,
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: { something: 'else' },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });

  it('PUT /dependencies/{id} uses UpdateDependencyBodySchema', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    const route = getRegisteredRoute(registry, 'put', `${BASE}/dependencies/{id}`);
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(bodySchema).toBeDefined();
    expect(responseSchema).toBeDefined();
  });

  it('all param schemas use branded IDs', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    // taskId params
    const taskIdRoutes = [
      [`${BASE}/{taskId}/dependencies`, 'post'],
      [`${BASE}/{taskId}/dependencies`, 'get'],
      [`${BASE}/{taskId}/dependents`, 'get'],
      [`${BASE}/{taskId}/dependency-chain`, 'get'],
    ] as const;

    for (const [path, method] of taskIdRoutes) {
      const route = getRegisteredRoute(registry, method, path);
      const paramsSchema = getParamsSchema(route);
      expect(paramsSchema).toBeDefined();
      expect(paramsSchema.safeParse({ taskId: 'bare-string' }).success).toBe(false);
    }

    // dependency id params
    const depIdRoutes = [
      [`${BASE}/dependencies/{id}`, 'delete'],
      [`${BASE}/dependencies/{id}`, 'put'],
    ] as const;

    for (const [path, method] of depIdRoutes) {
      const route = getRegisteredRoute(registry, method, path);
      const paramsSchema = getParamsSchema(route);
      expect(paramsSchema).toBeDefined();
      expect(paramsSchema.safeParse({ id: 'bare-string' }).success).toBe(false);
    }
  });

  it('core response schemas are defined (not passthrough)', () => {
    const registry = new TestOpenApiRegistry();
    registerAll(registry);

    // Create
    expect(getResponseSchema(getRegisteredRoute(registry, 'post', `${BASE}/{taskId}/dependencies`), 201)).toBeDefined();
    // List deps
    expect(getResponseSchema(getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependencies`), 200)).toBeDefined();
    // List dependents
    expect(getResponseSchema(getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependents`), 200)).toBeDefined();
    // Chain
    expect(getResponseSchema(getRegisteredRoute(registry, 'get', `${BASE}/{taskId}/dependency-chain`), 200)).toBeDefined();
    // Validate
    expect(getResponseSchema(getRegisteredRoute(registry, 'post', `${BASE}/dependencies/validate`), 200)).toBeDefined();
    // Delete
    expect(getResponseSchema(getRegisteredRoute(registry, 'delete', `${BASE}/dependencies/{id}`), 200)).toBeDefined();
    // Update
    expect(getResponseSchema(getRegisteredRoute(registry, 'put', `${BASE}/dependencies/{id}`), 200)).toBeDefined();
  });
});
