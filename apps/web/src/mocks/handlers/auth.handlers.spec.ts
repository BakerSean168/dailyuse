import {
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
import { AuthHttpAdapter } from '@dailyuse/authentication/infrastructure-client';
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
} from '@dailyuse/contracts/authentication';
import { createMockAuthResponse } from '@dailyuse/contracts/mocks';

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

  it('uses the current auth adapter routes and request schemas', async () => {
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
