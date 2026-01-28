/**
 * AuthIdentity Entity - Server Interface
 * 认证实体 - 服务端接口
 */

import type { PasswordCredentialServer } from '../entities/PasswordCredentialServer';
import type { ApiKeyCredentialServer } from '../entities/ApiKeyCredentialServer';
import type { RememberMeTokenServer } from '../entities/RememberMeTokenServer';
import type { CredentialHistoryServer } from '../entities/CredentialHistoryServer';
import type { AuthIdentityClientDTO } from './auth-identity-client';
import type { PlainPassword } from './../value-objects/plain-password';
import type { OAuthCredential } from '../entities/oauth-credential-server';
// =========== 相关类型 ============

import type { IdentityId } from '../value-objects/identity-id';
import type { IdentityStatus } from '../value-objects/auth-identity-status';
import type { AuthCredential } from '../types/auth-credential';
import type { DomainDate } from '@/primitives';
import type { TransferDate } from '@/primitives';
import type { PersistenceDate } from '@/primitives';
// ============ 实体接口 ============

export interface AuthIdentityServer {
  readonly id: IdentityId;
  status: IdentityStatus;
  accountUuid: string;

  // 失败计数 (业务核心)
  failedLoginAttempts: number;
  lastFailedAttempt?: DomainDate;
  lockedUntil?: DomainDate;

  // 内部持有的凭证列表
  readonly credentials: AuthCredential[];

  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;


  // --- Behaviors (业务行为) ---
  
  /**
   * 核心认证逻辑
   * @throws IdentityLockedException, InvalidCredentialsException
   */
  authenticate(
    identifier: string, 
    plainPassword: PlainPassword, 
    encryptionService: any
  ): Promise<void>;

  /**
   * 修改密码
   * 1. 检查是否存在 Password 类型的凭证 (没有则报错或创建)
   * 2. 调用 encryptionService.hash()
   * 3. 更新 credential 状态
   */
  changePassword(
    newPassword: PlainPassword, 
    encryptionService: any
  ): Promise<void>;

  /**
   * 绑定第三方账号
   * 1. 查重 (防止同一个微信绑定两个号)
   * 2. push 到 credentials 列表
   */
  bindOAuth(credential: OAuthCredential): void;

  /**
   * 解锁账号 (通常由管理员或时间过期触发)
   */
  unlock(): void;

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
  id: IdentityId;
  status: IdentityStatus;
  accountUuid: string;
  failedLoginAttempts: number;
  lastFailedAttempt?: TransferDate;
  lockedUntil?: TransferDate;
  credentials: AuthCredential[];
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * AuthIdentity Persistence DTO
 */
export interface AuthIdentityPersistenceDTO {
  id: IdentityId;
  status: IdentityStatus;
  accountUuid: string;
  failedLoginAttempts: number;
  lastFailedAttempt?: PersistenceDate;
  lockedUntil?: PersistenceDate;
  credentials: AuthCredential[];
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}