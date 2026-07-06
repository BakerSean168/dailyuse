import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { GovernanceApplicationPort } from '../../server/application';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { registerGovernanceRoutes } from './index';

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

function createUseCaseStub(): GovernanceApplicationPort {
  return {
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    getRule: vi.fn(),
    listRules: vi.fn(),
    searchRules: vi.fn(),
    getRevisions: vi.fn(),
  } as GovernanceApplicationPort;
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

describe('governance route contracts', () => {
  it('registers resource-first rule and revision routes explicitly', () => {
    const registry = new TestOpenApiRegistry();

    registerGovernanceRoutes(
      createUseCaseStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    expect(
      registry.paths.some(
        (route) => route.method === 'get' && route.path === '/api/v1/governance/rules/search',
      ),
    ).toBe(true);
    expect(
      registry.paths.some(
        (route) =>
          route.method === 'get' && route.path === '/api/v1/governance/rules/{id}/revisions',
      ),
    ).toBe(true);
    expect(
      registry.paths.some(
        (route) => route.method === 'get' && route.path === '/api/v1/governance/rules/{id}',
      ),
    ).toBe(true);
  });

  it('keeps q alias out of OpenAPI while the canonical query schema still requires query', () => {
    const registry = new TestOpenApiRegistry();

    registerGovernanceRoutes(
      createUseCaseStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const searchRoute = getRegisteredRoute(registry, 'get', '/api/v1/governance/rules/search');
    const searchQuerySchema = searchRoute.request?.query as {
      safeParse: (value: unknown) => { success: boolean };
    };

    expect(searchQuerySchema.safeParse({ query: 'ddd' }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: 'ddd' }).success).toBe(false);
  });

  it('registers create rule schema as the canonical rule resource payload', () => {
    const registry = new TestOpenApiRegistry();

    registerGovernanceRoutes(
      createUseCaseStub(),
      { auth: authMiddleware, requireRole: vi.fn(() => authMiddleware) },
      registry,
    );

    const createSchema = getJsonBodySchema(
      getRegisteredRoute(registry, 'post', '/api/v1/governance/rules'),
    );

    expect(
      createSchema.safeParse({
        code: 'DDD-001',
        title: 'Rule title',
        description: 'This is a valid description for governance rule testing.',
        severity: 'Mandatory',
        tags: ['ddd'],
        goodExamples: [
          {
            language: 'TypeScript',
            content: 'class Example {}',
          },
        ],
        badExamples: [
          {
            language: 'TypeScript',
            content: 'const broken = true',
          },
        ],
        authorId: 'user-1',
      }).success,
    ).toBe(true);
  });
});