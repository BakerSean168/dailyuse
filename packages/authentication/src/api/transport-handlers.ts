/**
 * Authentication transport handler mapping.
 * Authentication 传输层处理器映射。
 *
 * Bridges the transport-neutral AuthenticationApplicationPort (ExecutionContext)
 * to the controller port (Context). Passes through all parameters.
 */

import type { Context } from '@dailyuse/contracts/shared';
import type { AuthenticationUseCases } from '../controllers/auth.controller';
import type { AuthenticationApplicationPort } from '../infrastructure-server';

export function createAuthenticationTransportHandlers(
  api: AuthenticationApplicationPort,
): AuthenticationUseCases {
  return {
    register: (data, cx: Context, deviceId: string) =>
      api.register(data, cx, deviceId),
    registerByPhone: (data, cx: Context) => api.registerByPhone(data, cx),
    login: (data, cx: Context, deviceId: string) =>
      api.login(data, cx, deviceId),
    loginByPhone: (data, cx: Context) => api.loginByPhone(data, cx),
    sendSmsCode: (data) => api.sendSmsCode(data),
    logout: (cx: Context) => api.logout(cx),
    refreshToken: (data, cx: Context) => api.refreshToken(data, cx),
    getCurrentUser: (cx: Context, sessionId?: string) =>
      api.getCurrentUser(cx, sessionId),
    listSessions: (cx: Context, sessionId?: string) =>
      api.listSessions(cx, sessionId),
    revokeSession: (data, cx: Context) => api.revokeSession(data, cx),
    changePassword: (data, cx: Context) => api.changePassword(data, cx),
    forgotPassword: (data) => api.forgotPassword(data),
    resetPassword: (data) => api.resetPassword(data),
  };
}
