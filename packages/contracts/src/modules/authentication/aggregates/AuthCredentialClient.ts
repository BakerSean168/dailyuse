/**
 * AuthCredential Entity - Client Interface
 * 认证凭证实体 - 客户端接口
 */

import type {
  PasswordCredentialClient,
  PasswordCredentialClientDTO,
} from '../entities/PasswordCredentialClient';
import type {
  ApiKeyCredentialClient,
  ApiKeyCredentialClientDTO,
} from '../entities/ApiKeyCredentialClient';
import type {
  RememberMeTokenClient,
  RememberMeTokenClientDTO,
} from '../entities/RememberMeTokenClient';
import type {
  CredentialHistoryClient,
  CredentialHistoryClientDTO,
} from '../entities/CredentialHistoryClient';

// ============ DTO 定义 ============

/**
 * AuthCredential Client DTO
 */
export interface AuthCredentialClientDTO {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialClientDTO | null;
  apiKeyCredentials: ApiKeyCredentialClientDTO[];
  rememberMeTokens: RememberMeTokenClientDTO[];
  twoFactor?: {
    enabled: boolean;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
    verifiedAt?: number | null;
  } | null;
  biometric?: {
    enabled: boolean;
    type: 'FINGERPRINT' | 'FACE_ID' | 'TOUCH_ID';
    deviceId?: string | null;
    enrolledAt?: number | null;
  } | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  security: {
    requirePasswordChange: boolean;
    passwordExpiresAt?: number | null;
    failedLoginAttempts: number;
    lastFailedLoginAt?: number | null;
    lockedUntil?: number | null;
    lastPasswordChangeAt?: number | null;
  };
  history: CredentialHistoryClientDTO[];
  createdAt: number;
  updatedAt: number;
}

// ============ 实体接口 ============

export interface AuthCredentialClient {
  uuid: string;
  accountUuid: string;
  type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
  passwordCredential?: PasswordCredentialClient | null;
  apiKeyCredentials: ApiKeyCredentialClient[];
  rememberMeTokens: RememberMeTokenClient[];
  twoFactor?: {
    enabled: boolean;
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
  history: CredentialHistoryClient[];
  createdAt: Date;
  updatedAt: Date;

  toClientDTO(): AuthCredentialClientDTO;
}

export interface AuthCredentialClientStatic {
  fromClientDTO(dto: AuthCredentialClientDTO): AuthCredentialClient;
}
