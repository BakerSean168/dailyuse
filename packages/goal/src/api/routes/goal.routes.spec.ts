import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@memoflow/utils/result';
import type { GoalController } from '../../server/transport/goal.controller';
import { registerGoalRoutes } from './index';
import { registerGoalCrudRoutes } from './goal.routes';

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

function getParamsSchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return route.request?.params as {
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
  return schema?.schema as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

function createGoalUseCasesStub(): Parameters<typeof registerGoalRoutes>[0] {
  return {
    createGoal: vi.fn(),
    getGoal: vi.fn(),
    listGoals: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    archiveExpiredGoals: vi.fn(),
    archiveGoal: vi.fn(),
    activateGoal: vi.fn(),
    completeGoal: vi.fn(),
    searchGoals: vi.fn(),
    addKeyResult: vi.fn(),
    updateKeyResult: vi.fn(),
    updateKeyResultProgress: vi.fn(),
    deleteKeyResult: vi.fn(),
    addReview: vi.fn(),
    listReviews: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    createRecord: vi.fn(),
    listRecords: vi.fn(),
    deleteRecord: vi.fn(),
    activateFocusMode: vi.fn(),
    deactivateFocusMode: vi.fn(),
    extendFocusMode: vi.fn(),
    getCurrentFocusMode: vi.fn(),
    getGoalAggregate: vi.fn(),
    getGoalProgressBreakdown: vi.fn(),
    cloneGoal: vi.fn(),
    batchUpdateKeyResultWeights: vi.fn(),
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

  it('registers focus mode routes before the dynamic goal id route', () => {
    const router = registerGoalRoutes(
      createGoalUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      null,
    );

    const layers = (router as unknown as {
      stack: Array<{ handle?: { stack?: Array<{ route?: { path: string } }> } }>;
    }).stack;

    const firstRouterPaths = layers[0]?.handle?.stack?.map((layer) => layer.route?.path) ?? [];
    const secondRouterPaths = layers[1]?.handle?.stack?.map((layer) => layer.route?.path) ?? [];

    expect(firstRouterPaths).toContain('/focus-mode');
    expect(secondRouterPaths).toContain('/:id');
  });

  it('documents focus mode endpoints with contracts-backed response schemas', () => {
    const registry = new TestOpenApiRegistry();

    registerGoalRoutes(
      createGoalUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const currentRoute = getRegisteredRoute(registry, 'get', '/api/v1/goals/focus-mode');
    const activateRoute = getRegisteredRoute(registry, 'post', '/api/v1/goals/focus-mode/activate');
    const activateBody = getJsonBodySchema(activateRoute);

    expect(getResponseSchema(currentRoute, 200)).toBeDefined();
    expect(getResponseSchema(activateRoute, 200)).toBeDefined();
    expect(
      activateBody.safeParse({
        focusedGoalIds: ['IGoalId_550e8400-e29b-41d4-a716-446655440000'],
        hiddenGoalsMode: 'Hide',
      }).success,
    ).toBe(true);
  });

  it('documents key-result routes with named list and detail contracts', () => {
    const registry = new TestOpenApiRegistry();

    registerGoalRoutes(
      createGoalUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const listRoute = getRegisteredRoute(registry, 'get', '/api/v1/goals/{id}/key-results');
    const detailMutationRoute = getRegisteredRoute(
      registry,
      'put',
      '/api/v1/goals/{id}/key-results/{krId}',
    );

    expect(getResponseSchema(listRoute, 200)).toBeDefined();
    expect(getResponseSchema(detailMutationRoute, 200)).toBeDefined();
    expect(getParamsSchema(detailMutationRoute).safeParse({ id: 'bare', krId: 'bare' }).success).toBe(
      false,
    );
  });

  it('documents review delete with z.null() void success (no DeleteSuccess dual-track)', () => {
    const registry = new TestOpenApiRegistry();

    registerGoalRoutes(
      createGoalUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'delete', '/api/v1/goals/{id}/reviews/{reviewId}');
    const responseSchema = getResponseSchema(route, 200);

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
        data: { success: true },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });
});
