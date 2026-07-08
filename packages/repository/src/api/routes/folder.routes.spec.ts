import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { RepositoryController } from '../../server/transport/repository.controller';
import { registerNestedFolderRoutes, registerStandaloneFolderRoutes } from './folder.routes';

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
    createFolder: vi.fn(),
    getFolderTree: vi.fn(),
    getFolder: vi.fn(),
    renameFolder: vi.fn(),
    moveFolder: vi.fn(),
    deleteFolder: vi.fn(),
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

function getParamsSchema(route: RegisteredRoute): {
  safeParse: (value: unknown) => { success: boolean };
} {
  return route.request?.params as {
    safeParse: (value: unknown) => { success: boolean };
  };
}

describe('repository folder route contracts', () => {
  it('nested create folder uses CreateFolderSchema and FolderResponseSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerNestedFolderRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'post', '/api/v1/repositories/{repoId}/folders');
    const bodySchema = getJsonBodySchema(route);
    const paramsSchema = getParamsSchema(route);
    const responseSchema = getResponseSchema(route, 201);

    expect(bodySchema.safeParse({ name: 'Inbox' }).success).toBe(true);
    expect(bodySchema.safeParse({}).success).toBe(false);
    expect(paramsSchema.safeParse({ repoId: 'bare-string' }).success).toBe(false);
    expect(responseSchema).toBeDefined();
  });

  it('nested folder tree returns an array of FolderResponseSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerNestedFolderRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const responseSchema = getResponseSchema(
      getRegisteredRoute(registry, 'get', '/api/v1/repositories/{repoId}/folders'),
      200,
    );

    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: [],
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
  });

  it('standalone folder detail uses FolderResponseSchema with branded params', () => {
    const registry = new TestOpenApiRegistry();

    registerStandaloneFolderRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const route = getRegisteredRoute(registry, 'get', '/api/v1/folders/{id}');
    const paramsSchema = getParamsSchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(paramsSchema.safeParse({ id: 'bare-string' }).success).toBe(false);
    expect(responseSchema).toBeDefined();
  });

  it('rename and move use named contracts from repository DTOs', () => {
    const registry = new TestOpenApiRegistry();

    registerStandaloneFolderRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const renameBody = getJsonBodySchema(
      getRegisteredRoute(registry, 'put', '/api/v1/folders/{id}/rename'),
    );
    const moveBody = getJsonBodySchema(
      getRegisteredRoute(registry, 'put', '/api/v1/folders/{id}/move'),
    );

    expect(renameBody.safeParse({ name: 'Archive' }).success).toBe(true);
    expect(renameBody.safeParse({}).success).toBe(false);
    expect(moveBody.safeParse({ parentId: null }).success).toBe(true);
  });

  it('delete folder uses null success payload', () => {
    const registry = new TestOpenApiRegistry();

    registerStandaloneFolderRoutes(
      createRepositoryControllerStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const responseSchema = getResponseSchema(
      getRegisteredRoute(registry, 'delete', '/api/v1/folders/{id}'),
      200,
    );

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
        data: { deleted: true },
        timestamp: Date.now(),
      }).success,
    ).toBe(false);
  });
});
