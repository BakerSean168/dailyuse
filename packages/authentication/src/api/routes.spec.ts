import type { RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import { z } from 'zod';
import {
  AuthResponseSchema,
  CurrentUserResponseSchema,
  ForgotPasswordSchema,
  LoginByEmailSchema,
  OAuthCallbackSchema,
  RefreshTokenSchema,
  RegisterByEmailSchema,
  ResetPasswordSchema,
  SessionListResponseSchema,
} from '@dailyuse/contracts/authentication';
import { registerAuthenticationRoutes } from './routes';
import type { AuthenticationApplicationPort } from '../server/application';

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

function getRegisteredRoute(
  registry: TestOpenApiRegistry,
  method: string,
  path: string,
): RegisteredRoute {
  const route = registry.paths.find((candidate) => candidate.method === method && candidate.path === path);
  expect(route).toBeDefined();
  return route!;
}

function getJsonBodySchema(route: RegisteredRoute) {
  return (((route.request?.body as any)?.content as any)?.['application/json'] as any)?.schema;
}

function getResponseSchema(route: RegisteredRoute, status: number) {
  const responses = route.responses as any;
  const response = responses?.[String(status)] ?? responses?.[status];
  const wrapper = (response?.content as any)?.['application/json'] as any;
  const schema = wrapper?.schema ?? response;
  return schema?.shape?.data ?? schema;
}

function getResponseStatuses(route: RegisteredRoute): string[] {
  return Object.keys(route.responses ?? {});
}

function createStubs(): AuthenticationApplicationPort {
  return {
    register: vi.fn(),
    registerByPhone: vi.fn(),
    login: vi.fn(),
    loginByPhone: vi.fn(),
    oauthCallback: vi.fn(),
    sendSmsCode: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  };
}

describe('registerAuthenticationRoutes', () => {
  const registry = new TestOpenApiRegistry();
  const stubs = createStubs();

  registerAuthenticationRoutes(stubs, { auth: authMiddleware, requireRole: () => authMiddleware }, registry);

  it('POST /register — body uses RegisterByEmailSchema, response uses AuthResponseSchema', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/register');
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 201);

    expect(bodySchema).toBe(RegisterByEmailSchema);
    expect(responseSchema).toBe(AuthResponseSchema);
  });

  it('POST /login — body uses LoginByEmailSchema, response uses AuthResponseSchema', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/login');
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(bodySchema).toBe(LoginByEmailSchema);
    expect(responseSchema).toBe(AuthResponseSchema);
  });

  it('POST /oauth/callback — documents the OAuth callback schema and disabled-provider response', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/oauth/callback');

    expect(getJsonBodySchema(route)).toBe(OAuthCallbackSchema);
    expect(getResponseSchema(route, 200)).toBe(AuthResponseSchema);
    expect(getResponseStatuses(route)).toContain('503');
  });

  it('POST /logout — response uses z.null()', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/logout');
    const responseSchema = getResponseSchema(route, 200);

    expect(responseSchema).toBeInstanceOf(z.ZodNull);
  });

  it('POST /refresh — body uses RefreshTokenSchema', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/refresh');
    const bodySchema = getJsonBodySchema(route);
    const responseSchema = getResponseSchema(route, 200);

    expect(bodySchema).toBe(RefreshTokenSchema);
    expect(responseSchema).toBe(AuthResponseSchema);
  });

  it('GET /me — response uses CurrentUserResponseSchema', () => {
    const route = getRegisteredRoute(registry, 'get', '/api/v1/auth/me');
    const responseSchema = getResponseSchema(route, 200);

    expect(responseSchema).toBe(CurrentUserResponseSchema);
  });

  it('GET /sessions — response uses SessionListResponseSchema', () => {
    const route = getRegisteredRoute(registry, 'get', '/api/v1/auth/sessions');
    const responseSchema = getResponseSchema(route, 200);

    expect(responseSchema).toBe(SessionListResponseSchema);
  });

  it('POST /password/forgot — documents the implemented schema and no longer advertises 503', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/password/forgot');

    expect(getJsonBodySchema(route)).toBe(ForgotPasswordSchema);
    expect(getResponseSchema(route, 200)).toBeInstanceOf(z.ZodNull);
    expect(getResponseStatuses(route)).toContain('422');
    expect(getResponseStatuses(route)).not.toContain('503');
  });

  it('POST /password/reset — documents implemented reset semantics instead of 503', () => {
    const route = getRegisteredRoute(registry, 'post', '/api/v1/auth/password/reset');

    expect(getJsonBodySchema(route)).toBe(ResetPasswordSchema);
    expect(getResponseSchema(route, 200)).toBeInstanceOf(z.ZodNull);
    expect(getResponseStatuses(route)).toContain('404');
    expect(getResponseStatuses(route)).toContain('422');
    expect(getResponseStatuses(route)).not.toContain('503');
  });
});
