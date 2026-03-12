import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { GoalController } from '../../controllers/goal.controller';
import { registerGoalCrudRoutes } from './goal.routes';

type RegisteredRoute = {
  method: string;
  path: string;
  request?: Record<string, unknown>;
};

class TestOpenApiRegistry implements OpenApiRegistryLike {
  readonly paths: RegisteredRoute[] = [];

  registerPath(route: Record<string, unknown>): void {
    this.paths.push(route as RegisteredRoute);
  }

  register(): void {}
}

const authMiddleware = ((_, __, next) => next()) as RequestHandler;

function createGoalControllerStub(): GoalController {
  return {
    create: vi.fn(),
    list: vi.fn(),
    search: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    archive: vi.fn(),
    activate: vi.fn(),
    complete: vi.fn(),
    getAggregate: vi.fn(),
    getProgressBreakdown: vi.fn(),
    cloneGoal: vi.fn(),
    batchUpdateKeyResultWeights: vi.fn(),
  } as unknown as GoalController;
}

function getRegisteredRoute(
  registry: TestOpenApiRegistry,
  method: string,
  path: string,
): RegisteredRoute {
  const route = registry.paths.find((candidate) => candidate.method === method && candidate.path === path);

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

function getQuerySchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return route.request?.query as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

describe('goal route contracts', () => {
  it('registers name-only create, update, and clone body schemas', () => {
    const registry = new TestOpenApiRegistry();

    registerGoalCrudRoutes(
      createGoalControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const createSchema = getJsonBodySchema(getRegisteredRoute(registry, 'post', '/api/v1/goals'));
    const updateSchema = getJsonBodySchema(
      getRegisteredRoute(registry, 'put', '/api/v1/goals/{id}'),
    );
    const cloneSchema = getJsonBodySchema(
      getRegisteredRoute(registry, 'post', '/api/v1/goals/{id}/clone'),
    );

    expect(
      createSchema.safeParse({ name: 'Ship architecture fixes', importance: 'Moderate' }).success,
    ).toBe(true);
    expect(createSchema.safeParse({ title: 'Legacy title', importance: 'Moderate' }).success).toBe(
      false,
    );

    expect(updateSchema.safeParse({ name: 'Ship architecture fixes v2' }).success).toBe(true);
    expect(updateSchema.safeParse({ title: 'Legacy title' }).success).toBe(false);
    expect(cloneSchema.safeParse({ name: 'Ship architecture fixes (copy)' }).success).toBe(true);
    expect(cloneSchema.safeParse({ title: 'Legacy clone title' }).success).toBe(false);
  });

  it('registers search query schema with query as the only formal search field', () => {
    const registry = new TestOpenApiRegistry();

    registerGoalCrudRoutes(
      createGoalControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const searchSchema = getQuerySchema(
      getRegisteredRoute(registry, 'get', '/api/v1/goals/search'),
    );

    expect(searchSchema.safeParse({ query: 'contracts' }).success).toBe(true);
    expect(searchSchema.safeParse({ q: 'contracts' }).success).toBe(false);
  });
});
