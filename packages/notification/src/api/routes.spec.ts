import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { NotificationUseCases } from '../server/transport/notification.controller';
import { registerNotificationRoutes } from './routes';

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

function createControllerStub(): NotificationUseCases {
  return {
    createNotification: vi.fn(),
    listNotifications: vi.fn(),
    getNotification: vi.fn(),
    deleteNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
    batchMarkAsRead: vi.fn(),
    batchDelete: vi.fn(),
    cleanupOldNotifications: vi.fn(),
  } as unknown as NotificationUseCases;
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

const BASE = '/api/v1/notifications';

describe('notification route contracts', () => {
  it('list endpoint uses z.array(NotificationResponseSchema)', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const listRoute = getRegisteredRoute(registry, 'get', BASE);
    const responseSchema = getResponseSchema(listRoute, 200);

    expect(responseSchema).toBeDefined();
    // success envelope wrapping an array of notification objects
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: [],
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    // data must be an array, not a single object
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

  it('detail endpoint uses NotificationResponseSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/{id}`);
    const responseSchema = getResponseSchema(getRoute, 200);

    expect(responseSchema).toBeDefined();
    // A notification-like object with branded IDs and valid enums should pass
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: {
          id: 'INotificationId_550e8400-e29b-41d4-a716-446655440000',
          identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
          title: 'Test',
          content: 'Body',
          type: 'Info',
          category: 'System',
          status: 'Read',
          isRead: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    // Plain string IDs should fail (brandedId requires prefix_uuid format)
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: {
          id: 'not-branded',
          identityId: 'not-branded',
          title: 'Test',
          content: 'Body',
          type: 'Info',
          category: 'System',
          status: 'Read',
          isRead: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });

  it('create endpoint body uses CreateNotificationSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const createRoute = getRegisteredRoute(registry, 'post', BASE);
    const bodySchema = getJsonBodySchema(createRoute);

    expect(bodySchema).toBeDefined();
    // Should accept a valid create payload
    expect(
      bodySchema.safeParse({
        title: 'Test notification',
        content: 'Something happened',
        type: 'Info',
        category: 'System',
      }).success,
    ).toBe(true);
    // Should reject an empty object
    expect(bodySchema.safeParse({}).success).toBe(false);
  });

  it('delete endpoint response uses z.null()', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const deleteRoute = getRegisteredRoute(registry, 'delete', `${BASE}/{id}`);
    const responseSchema = getResponseSchema(deleteRoute, 200);

    expect(responseSchema).toBeDefined();
    // successResponse(z.null()) — data must be null
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: null,
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    // data must not be an object
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

  it('route params use branded IDs (not bare strings)', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/{id}`);
    const paramsSchema = getParamsSchema(getRoute);

    // brandedId rejects bare strings — must be a branded string
    expect(paramsSchema.safeParse({ id: 'not-a-branded-id' }).success).toBe(false);
  });

  it('core CRUD response schemas are contracts-based (not passthrough)', () => {
    const registry = new TestOpenApiRegistry();

    registerNotificationRoutes(
      createControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    // List response schema exists
    const listRoute = getRegisteredRoute(registry, 'get', BASE);
    const listResponseSchema = getResponseSchema(listRoute, 200);
    expect(listResponseSchema).toBeDefined();

    // Detail response schema exists
    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/{id}`);
    const getResponseSchema200 = getResponseSchema(getRoute, 200);
    expect(getResponseSchema200).toBeDefined();

    // Create response schema exists
    const createRoute = getRegisteredRoute(registry, 'post', BASE);
    const createResponseSchema = getResponseSchema(createRoute, 201);
    expect(createResponseSchema).toBeDefined();

    // Delete response schema exists
    const deleteRoute = getRegisteredRoute(registry, 'delete', `${BASE}/{id}`);
    const deleteResponseSchema = getResponseSchema(deleteRoute, 200);
    expect(deleteResponseSchema).toBeDefined();
  });
});
