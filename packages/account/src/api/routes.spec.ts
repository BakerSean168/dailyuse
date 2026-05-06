import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { AccountUseCases } from '../controllers/account.controller';
import { registerAccountRoutes } from './routes';

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

function createAccountUseCasesStub(): AccountUseCases {
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateSettings: vi.fn(),
    checkAvailability: vi.fn(),
    closeAccount: vi.fn(),
  };
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

function getJsonBodySchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return (((route.request?.body as Record<string, unknown> | undefined)?.content as
    | Record<string, unknown>
    | undefined)?.['application/json'] as Record<string, unknown> | undefined)?.schema as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

const BASE = '/api/v1/accounts';

describe('account route contracts', () => {
  it('GET /me is registered with correct path', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'get', `${BASE}/me`);
    expect(route).toBeDefined();
  });

  it('GET /me has a 200 response schema', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'get', `${BASE}/me`);
    const responseSchema = getResponseSchema(route, 200);
    expect(responseSchema).toBeDefined();
    expect(responseSchema.safeParse).toBeDefined();
  });

  it('PUT /me is registered with correct path', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'put', `${BASE}/me`);
    expect(route).toBeDefined();
  });

  it('PUT /me has a body schema', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'put', `${BASE}/me`);
    const bodySchema = getJsonBodySchema(route);
    expect(bodySchema).toBeDefined();
  });

  it('POST /availability is registered with correct path', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'post', `${BASE}/availability`);
    expect(route).toBeDefined();
  });

  it('POST /availability has a body schema', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'post', `${BASE}/availability`);
    const bodySchema = getJsonBodySchema(route);
    expect(bodySchema).toBeDefined();
  });

  it('POST /availability has a 200 response schema', () => {
    const registry = new TestOpenApiRegistry();

    registerAccountRoutes(
      createAccountUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'post', `${BASE}/availability`);
    const responseSchema = getResponseSchema(route, 200);
    expect(responseSchema).toBeDefined();
  });
});
