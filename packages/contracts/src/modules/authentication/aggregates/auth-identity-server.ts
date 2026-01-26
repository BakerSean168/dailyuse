/**
 * AuthIdentity Entity - Server Interface
 * 认证实体 - 服务端接口
 */

import type { PasswordCredentialServer } from '../entities/PasswordCredentialServer';
import type { ApiKeyCredentialServer } from '../entities/ApiKeyCredentialServer';
import type { RememberMeTokenServer } from '../entities/RememberMeTokenServer';
import type { CredentialHistoryServer } from '../entities/CredentialHistoryServer';
import type { AuthIdentityClientDTO } from './AuthIdentityClient';

// ============ 实体接口 ============

export interface AuthIdentityServer {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialServer | null;
  apiKeyCredentials: ApiKeyCredentialServer[];
  rememberMeTokens: RememberMeTokenServer[];
  twoFactor?: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: Date | null;
  } | null;
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: Date | null;
  } | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: Date | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: Date | null;
    lockedUntil?: Date | null;
    lastPasswordChangeAt?: Date | null;
  };
  history: CredentialHistoryServer[];
  createdAt: Date;
  updatedAt: Date;

  // Password methods
  setPassword(hashedPassword: string): void;
  verifyPassword(hashedPassword: string): boolean;
  requirePasswordChange(): void;

  // Remember-Me Token methods
  generateRememberMeToken(deviceInfo: any, expiresInDays?: number): RememberMeTokenServer;
  verifyRememberMeToken(token: string, deviceFingerprint: string): RememberMeTokenServer | null;
  refreshRememberMeToken(oldToken: string, deviceFingerprint: string): RememberMeTokenServer | null;
  revokeRememberMeToken(tokenUuid: string): void;
  revokeAllRememberMeTokens(): void;
  revokeRememberMeTokensByDevice(deviceId: string): void;
  cleanupExpiredRememberMeTokens(): void;

  // API Key methods
  generateApiKey(name: string, expiresInDays?: number): ApiKeyCredentialServer;
  revokeApiKey(keyUuid: string): void;

  // Two-Factor methods
  enableTwoFactor(method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP'): string;
  disableTwoFactor(): void;
  verifyTwoFactorCode(code: string): boolean;
  generateBackupCodes(): string[];
  useBackupCode(code: string): boolean;

  // Biometric methods
  enrollBiometric(type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID', deviceId: string): void;
  revokeBiometric(): void;

  // Security methods
  recordFailedLogin(): void;
  resetFailedAttempts(): void;
  isLocked(): boolean;
  suspend(): void;
  activate(): void;
  revoke(): void;

  toServerDTO(): AuthIdentityServerDTO;
  toClientDTO(): AuthIdentityClientDTO;
  toPersistenceDTO(): AuthIdentityPersistenceDTO;
}

export interface AuthIdentityServerStatic {
  create(params: {
    accountUuid: string;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    hashedPassword?: string;
  }): AuthIdentityServer;
  fromServerDTO(dto: AuthIdentityServerDTO): AuthIdentityServer;
  fromPersistenceDTO(dto: AuthIdentityPersistenceDTO): AuthIdentityServer;
}

// ============ DTO 定义 ============

/**
 * AuthIdentity Server DTO
 */
export interface AuthIdentityServerDTO {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialServer | null;
  apiKeyCredentials: ApiKeyCredentialServer[];
  rememberMeTokens: RememberMeTokenServer[];
  twoFactor?: {
    enabled: boolean;
    secret?: string | null;
    backupCodes: string[];
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null;
  } | null;
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: Date | null;
  } | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: Date | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: Date | null;
    lockedUntil?: Date | null;
    lastPasswordChangeAt?: Date | null;
  };
  history: CredentialHistoryServer[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AuthIdentity Persistence DTO
 */
export interface AuthIdentityPersistenceDTO {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  password_credential?: string | null; // JSON
  api_key_credentials: string; // JSON
  remember_me_tokens: string; // JSON
  two_factor?: string | null; // JSON
  biometric?: string | null; // JSON
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: string; // JSON
  history: string; // JSON
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  lastUsedAt?: number | null;
  revokedAt?: Date | null;
}