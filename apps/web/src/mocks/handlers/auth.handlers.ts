/**
 * MSW Handlers - Authentication Module
 *
 * Intercepts HTTP requests to the Auth API and returns mock data.
 * Active only in development when MSW is enabled.
 */

import { http, HttpResponse } from 'msw';
import { createMockAuthResponse } from '@dailyuse/contracts/mocks';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE = `${API_BASE}/auth`;

export const authMockRoutes = {
  base: BASE,
  login: `${BASE}/login`,
  register: `${BASE}/register`,
  loginPhone: `${BASE}/login/phone`,
  registerPhone: `${BASE}/register/phone`,
  refresh: `${BASE}/refresh`,
  me: `${BASE}/me`,
  sessions: `${BASE}/sessions`,
  revokeSession: `${BASE}/sessions/revoke`,
  changePassword: `${BASE}/password/change`,
  forgotPassword: `${BASE}/password/forgot`,
  resetPassword: `${BASE}/password/reset`,
};

export function createMockCurrentUserResponse() {
  const mockAuth = createMockAuthResponse();
  return {
    identity: mockAuth.identity,
    session: mockAuth.session,
  };
}

export function createMockSessionListResponse() {
  const mockAuth = createMockAuthResponse();
  return {
    sessions: [mockAuth.session],
  };
}

export const authHandlers = [
  http.post(`${BASE}/login`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Login successful',
      data: createMockAuthResponse(),
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/register`, () => {
    return HttpResponse.json(
      {
        ok: true,
        code: 200,
        message: 'Registration successful',
        data: createMockAuthResponse(),
        timestamp: Date.now(),
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/register/phone`, () => {
    return HttpResponse.json(
      {
        ok: false,
        code: 503,
        message: 'Phone registration is not implemented on the server yet',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Phone registration is not implemented on the server yet',
        },
        timestamp: Date.now(),
      },
      { status: 503 },
    );
  }),

  http.post(`${BASE}/refresh`, () => {
    const mockAuth = createMockAuthResponse();
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Token refreshed',
      data: mockAuth,
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/login/phone`, () => {
    return HttpResponse.json(
      {
        ok: false,
        code: 503,
        message: 'Phone login is not implemented on the server yet',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Phone login is not implemented on the server yet',
        },
        timestamp: Date.now(),
      },
      { status: 503 },
    );
  }),

  http.post(`${BASE}/sms/send`, () => {
    return HttpResponse.json(
      {
        ok: false,
        code: 503,
        message: 'SMS verification is not implemented on the server yet',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'SMS verification is not implemented on the server yet',
        },
        timestamp: Date.now(),
      },
      { status: 503 },
    );
  }),

  http.get(`${BASE}/me`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'OK',
      data: createMockCurrentUserResponse(),
      timestamp: Date.now(),
    });
  }),

  http.get(`${BASE}/sessions`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'OK',
      data: createMockSessionListResponse(),
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/sessions/revoke`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Session revoked',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/password/change`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Password changed',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/password/forgot`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Password reset request accepted',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/password/reset`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Password reset successful',
      data: null,
      timestamp: Date.now(),
    });
  }),

  http.post(`${BASE}/logout`, () => {
    return HttpResponse.json({
      ok: true,
      code: 200,
      message: 'Logged out',
      data: null,
      timestamp: Date.now(),
    });
  }),
];
