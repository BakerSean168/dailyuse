import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { RepositoryController } from '../../server/transport/repository.controller';
import { registerRepositoryCrudRoutes } from './repository.routes';

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

function createRepositoryControllerStub(): RepositoryController {
  return {
    createRepository: vi.fn(),
    listRepositories: vi.fn(),
    getCurrentRepository: vi.fn(),
    getRepository: vi.fn(),
    updateRepository: vi.fn(),
    deleteRepository: vi.fn(),
    archiveRepository: vi.fn(),
    activateRepository: vi.fn(),
    createResource: vi.fn(),
    listResources: vi.fn(),
    getResource: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
    uploadResources: vi.fn(),
    listResourceBookmarks: vi.fn(),
    createResourceBookmark: vi.fn(),
    updateResourceBookmark: vi.fn(),
    reorderResourceBookmarks: vi.fn(),
    deleteResourceBookmark: vi.fn(),
  } as unknown as RepositoryController;
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
  return (
    (
      (route.request?.body as Record<string, unknown> | undefined)?.content as
        | Record<string, unknown>
        | undefined
    )?.['application/json'] as Record<string, unknown> | undefined
  )?.schema as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

function getMultipartBodySchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return (
    (
      (route.request?.body as Record<string, unknown> | undefined)?.content as
        | Record<string, unknown>
        | undefined
    )?.['multipart/form-data'] as Record<string, unknown> | undefined
  )?.schema as {
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

describe('repository route contracts', () => {
  it('registers an explicit current-repository boundary for repository workspace bootstrapping', () => {
    const registry = new TestOpenApiRegistry();

    registerRepositoryCrudRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    expect(
      registry.paths.some(
        (route) => route.method === 'get' && route.path === '/api/v1/repositories/current',
      ),
    ).toBe(true);
  });

  it('registers bookmark reorder schema with bookmarkIds as the canonical payload key', () => {
    const registry = new TestOpenApiRegistry();

    registerRepositoryCrudRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const reorderSchema = getJsonBodySchema(
      getRegisteredRoute(registry, 'post', '/api/v1/repositories/{repoId}/bookmarks/reorder'),
    );

    expect(reorderSchema.safeParse({ bookmarkIds: ['bookmark-1', 'bookmark-2'] }).success).toBe(
      true,
    );
    expect(reorderSchema.safeParse({ ids: ['bookmark-1', 'bookmark-2'] }).success).toBe(false);
  });

  it('documents upload authorization failures with the standard unauthorized response', () => {
    const registry = new TestOpenApiRegistry();

    registerRepositoryCrudRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const uploadRoute = getRegisteredRoute(
      registry,
      'post',
      '/api/v1/repositories/{repoId}/resources/upload',
    );

    expect(uploadRoute.responses).toMatchObject({
      401: {
        description: '未授权，请登录',
      },
    });
  });

  it('uses UploadResourcesMultipartSchema for multipart uploads', () => {
    const registry = new TestOpenApiRegistry();

    registerRepositoryCrudRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const uploadSchema = getMultipartBodySchema(
      getRegisteredRoute(registry, 'post', '/api/v1/repositories/{repoId}/resources/upload'),
    );

    expect(uploadSchema.safeParse({ files: [{ name: 'a.txt' }] }).success).toBe(true);
    expect(uploadSchema.safeParse({}).success).toBe(false);
  });

  it('documents delete bookmark with the named result contract', () => {
    const registry = new TestOpenApiRegistry();

    registerRepositoryCrudRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const responseSchema = getResponseSchema(
      getRegisteredRoute(registry, 'delete', '/api/v1/repositories/{repoId}/bookmarks/{bookmarkId}'),
      200,
    );

    expect(responseSchema.safeParse({ ok: true, code: 200, message: 'ok', data: { ok: true }, timestamp: Date.now() }).success).toBe(true);
    expect(responseSchema.safeParse({ ok: true, code: 200, message: 'ok', data: null, timestamp: Date.now() }).success).toBe(false);
  });
});
