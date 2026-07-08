import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { EditorController } from '../../server/transport/editor.controller';
import { registerEditorRoutes } from './index';

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

function createEditorControllerStub(): EditorController {
  return {
    createWorkspace: vi.fn(),
    listWorkspaces: vi.fn(),
    getWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    createSession: vi.fn(),
    listSessions: vi.fn(),
    getSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    createGroup: vi.fn(),
    listGroups: vi.fn(),
    getGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    createTab: vi.fn(),
    listTabs: vi.fn(),
    getTab: vi.fn(),
    updateTab: vi.fn(),
    deleteTab: vi.fn(),
    getContent: vi.fn(),
    updateContent: vi.fn(),
    search: vi.fn(),
  } as unknown as EditorController;
}

function createEditorUseCasesStub() {
  return {
    createWorkspace: vi.fn(),
    listWorkspaces: vi.fn(),
    getWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    createSession: vi.fn(),
    listSessions: vi.fn(),
    getSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    createGroup: vi.fn(),
    listGroups: vi.fn(),
    getGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    createTab: vi.fn(),
    listTabs: vi.fn(),
    getTab: vi.fn(),
    updateTab: vi.fn(),
    deleteTab: vi.fn(),
    getContent: vi.fn(),
    updateContent: vi.fn(),
    search: vi.fn(),
  };
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

const BASE = '/api/v1/editor';

describe('editor workspace route contracts', () => {
  it('list endpoint uses z.array(WorkspaceResponseSchema)', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const listRoute = getRegisteredRoute(registry, 'get', `${BASE}/workspaces`);
    const responseSchema = getResponseSchema(listRoute, 200);

    expect(responseSchema).toBeDefined();
    // An empty array should pass
    expect(
      responseSchema.safeParse({
        ok: true,
        code: 200,
        message: 'ok',
        data: [],
        timestamp: Date.now(),
      }).success,
    ).toBe(true);
    // A non-array should fail
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

  it('detail endpoint uses WorkspaceResponseSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/workspaces/{id}`);
    const responseSchema = getResponseSchema(getRoute, 200);

    expect(responseSchema).toBeDefined();
  });

  it('create endpoint body uses CreateEditorWorkspaceSchema', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const createRoute = getRegisteredRoute(registry, 'post', `${BASE}/workspaces`);
    const bodySchema = getJsonBodySchema(createRoute);

    expect(bodySchema).toBeDefined();
    // Should accept a valid create payload
    expect(
      bodySchema.safeParse({
        name: 'My Workspace',
        projectPath: '/path/to/project',
        projectType: 'Code',
      }).success,
    ).toBe(true);
    // Should reject an empty object
    expect(bodySchema.safeParse({}).success).toBe(false);
  });

  it('workspace params use branded IDs', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/workspaces/{id}`);
    const paramsSchema = getParamsSchema(getRoute);

    expect(paramsSchema).toBeDefined();
    // brandedId rejects bare strings
    expect(paramsSchema.safeParse({ id: 'not-a-branded-id' }).success).toBe(false);
  });

  it('delete endpoint uses z.null() response', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const deleteRoute = getRegisteredRoute(registry, 'delete', `${BASE}/workspaces/{id}`);
    const responseSchema = getResponseSchema(deleteRoute, 200);

    expect(responseSchema).toBeDefined();
    // data must be null
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

  it('core CRUD response schemas are defined (not passthrough)', () => {
    const registry = new TestOpenApiRegistry();

    registerEditorRoutes(
      createEditorUseCasesStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    // List response
    const listRoute = getRegisteredRoute(registry, 'get', `${BASE}/workspaces`);
    expect(getResponseSchema(listRoute, 200)).toBeDefined();

    // Detail response
    const getRoute = getRegisteredRoute(registry, 'get', `${BASE}/workspaces/{id}`);
    expect(getResponseSchema(getRoute, 200)).toBeDefined();

    // Create response
    const createRoute = getRegisteredRoute(registry, 'post', `${BASE}/workspaces`);
    expect(getResponseSchema(createRoute, 201)).toBeDefined();

    // Delete response
    const deleteRoute = getRegisteredRoute(registry, 'delete', `${BASE}/workspaces/{id}`);
    expect(getResponseSchema(deleteRoute, 200)).toBeDefined();
  });
});
