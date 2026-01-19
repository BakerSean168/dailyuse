/**
 * Authentication Application Service
 *
 * Smart Container + Application Service Pattern
 * Framework-agnostic orchestration layer for authentication
 *
 * @module application-client/authentication
 */

import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@dailyuse/contracts/authentication';
import {
  Login,
  Logout,
  RefreshToken,
  Register,
  ForgotPassword,
  ResetPassword,
  ChangePassword,
  Enable2FA,
  Disable2FA,
  Verify2FA,
  GetActiveSessions,
  RevokeSession,
  GetTrustedDevices,
  TrustDevice,
} from './services';

/**
 * Authentication Application Service
 *
 * @example
 * import { authenticationApplicationService } from '@dailyuse/application-client/authentication'
 * await authenticationApplicationService.login(credentials)
 */
export class AuthenticationApplicationService {
  // ===== Login Operations =====

  async login(request: LoginRequest): Promise<{ token: string; refreshToken: string }> {
    return Login.getInstance().execute(request);
  }

  async logout(): Promise<void> {
    return Logout.getInstance().execute();
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return RefreshToken.getInstance().execute(refreshToken);
  }

  // ===== Registration Operations =====

  async register(request: RegisterRequest): Promise<any> {
    return Register.getInstance().execute(request);
  }

  // ===== Password Operations =====

  async forgotPassword(email: string): Promise<void> {
    return ForgotPassword.getInstance().execute(email);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    return ResetPassword.getInstance().execute(request);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return ChangePassword.getInstance().execute(oldPassword, newPassword);
  }

  // ===== 2FA Operations =====

  async enable2FA(): Promise<{ secret: string; qrCode: string }> {
    return Enable2FA.getInstance().execute();
  }

  async disable2FA(code: string): Promise<void> {
    return Disable2FA.getInstance().execute(code);
  }

  async verify2FA(code: string): Promise<{ token: string }> {
    return Verify2FA.getInstance().execute(code);
  }

  // ===== Session Operations =====

  async getActiveSessions(): Promise<any[]> {
    return GetActiveSessions.getInstance().execute();
  }

  async revokeSession(sessionId: string): Promise<void> {
    return RevokeSession.getInstance().execute(sessionId);
  }

  // ===== Device Operations =====

  async getTrustedDevices(): Promise<any[]> {
    return GetTrustedDevices.getInstance().execute();
  }

  async trustDevice(deviceId: string): Promise<void> {
    return TrustDevice.getInstance().execute(deviceId);
  }
}

/**
 * Authentication Application Service 单例实例
 */
export const authenticationApplicationService = new AuthenticationApplicationService();
