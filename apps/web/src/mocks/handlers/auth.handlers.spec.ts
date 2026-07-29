import {
  authHandlers,
  authMockRoutes,
  createMockCurrentUserResponse,
  createMockSessionListResponse,
} from './auth.handlers';
import {
  createHttpClientSpy,
  expectSchemaSuccess,
  successResult,
} from './_shared/contract-test-helpers';
import { describe, expect, it } from 'vitest';
import {
  AuthResponseSchema,
  ChangePasswordSchema,
  CurrentUserResponseSchema,
  ForgotPasswordSchema,
  LoginByEmailSchema,
  RefreshTokenSchema,
  ResetPasswordSchema,
  RevokeSessionSchema,
  SessionListResponseSchema,
} from '@memoflow/contracts/authentication';
import { createMockAuthResponse } from '@memoflow/contracts/mocks';

type MockHandler = {
  info?: { path?: string; method?: string };
  run(args: {
    request: Request;
    requestId: string;
    resolutionContext?: { baseUrl?: string };
  }): Promise<{ response: Response } | null>;
};

function getHandler(path: string, method: string): MockHandler {
  const handler = authHandlers.find((candidate) => {
    const info = candidate as MockHandler;
    return info.info?.path === path && info.info?.method === method;
  }) as MockHandler | undefined;

  expect(handler).toBeDefined();
  return handler!;
}

describe('auth handlers contracts', () => {
  it('uses the current auth adapter route prefixes', () => {
    expect(authMockRoutes.base).toMatch(/\/auth$/);
    expect(authMockRoutes.login).toMatch(/\/auth\/login$/);
    expect(authMockRoutes.me).toMatch(/\/auth\/me$/);
    expect(authMockRoutes.sessions).toMatch(/\/auth\/sessions$/);
  });

  it('keeps auth, current-user, and session-list response shapes aligned with contracts', () => {
    expectSchemaSuccess(AuthResponseSchema, createMockAuthResponse());
    expectSchemaSuccess(CurrentUserResponseSchema, createMockCurrentUserResponse());
    expectSchemaSuccess(SessionListResponseSchema, createMockSessionListResponse());
  });

  it('aligns forgot/reset mock responses with the implemented server capabilities', async () => {
    const forgotHandler = getHandler(authMockRoutes.forgotPassword, 'POST');
    const resetHandler = getHandler(authMockRoutes.resetPassword, 'POST');

    const forgotResult = await forgotHandler.run({
      request: new Request(new URL(authMockRoutes.forgotPassword, 'http://localhost'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
      requestId: 'forgot-password',
      resolutionContext: { baseUrl: 'http://localhost' },
    });
    const resetResult = await resetHandler.run({
      request: new Request(new URL(authMockRoutes.resetPassword, 'http://localhost'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          code: '123456',
          newPassword: 'new-password123',
        }),
      }),
      requestId: 'reset-password',
      resolutionContext: { baseUrl: 'http://localhost' },
    });

    expect(forgotResult?.response.status).toBe(200);
    await expect(forgotResult?.response.json()).resolves.toMatchObject({
      ok: true,
      code: 200,
      data: null,
    });

    expect(resetResult?.response.status).toBe(200);
    await expect(resetResult?.response.json()).resolves.toMatchObject({
      ok: true,
      code: 200,
      data: null,
    });
  });

  it('uses the current auth adapter routes and request schemas', async () => {
    const { AuthHttpAdapter } = await import('@memoflow/authentication/client');
    const httpClient = createHttpClientSpy();
    const adapter = new AuthHttpAdapter(httpClient);
    const authResponse = createMockAuthResponse();
    const currentUserResponse = createMockCurrentUserResponse();
    const sessionListResponse = createMockSessionListResponse();

    httpClient.post
      .mockResolvedValueOnce(successResult(authResponse))
      .mockResolvedValueOnce(successResult(authResponse))
      .mockResolvedValueOnce(successResult(null))
      .mockResolvedValueOnce(successResult(null))
      .mockResolvedValueOnce(successResult(null))
      .mockResolvedValueOnce(successResult(null));
    httpClient.get
      .mockResolvedValueOnce(successResult(currentUserResponse))
      .mockResolvedValueOnce(successResult(sessionListResponse));

    const loginPayload = expectSchemaSuccess(LoginByEmailSchema, {
      email: 'user@example.com',
      password: 'password123',
    });
    const refreshPayload = expectSchemaSuccess(RefreshTokenSchema, {
      refreshToken: authResponse.refreshToken,
    });
    const revokePayload = expectSchemaSuccess(RevokeSessionSchema, {
      sessionId: authResponse.session.id,
    });
    const changePasswordPayload = expectSchemaSuccess(ChangePasswordSchema, {
      oldPassword: 'password123',
      newPassword: 'new-password123',
    });
    const forgotPasswordPayload = expectSchemaSuccess(ForgotPasswordSchema, {
      email: 'user@example.com',
    });
    const resetPasswordPayload = expectSchemaSuccess(ResetPasswordSchema, {
      email: 'user@example.com',
      code: '123456',
      newPassword: 'new-password123',
    });

    await adapter.loginByEmail(loginPayload);
    await adapter.refreshToken(refreshPayload);
    await adapter.getCurrentUser();
    await adapter.listSessions();
    await adapter.revokeSession(revokePayload);
    await adapter.changePassword(changePasswordPayload);
    await adapter.forgotPassword(forgotPasswordPayload);
    await adapter.resetPassword(resetPasswordPayload);

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/auth/login', loginPayload);
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/auth/refresh', refreshPayload);
    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/auth/me');
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/auth/sessions');
    expect(httpClient.post).toHaveBeenNthCalledWith(3, '/auth/sessions/revoke', revokePayload);
    expect(httpClient.post).toHaveBeenNthCalledWith(
      4,
      '/auth/password/change',
      changePasswordPayload,
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      5,
      '/auth/password/forgot',
      forgotPasswordPayload,
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      6,
      '/auth/password/reset',
      resetPasswordPayload,
    );
  });
});
