/**
 * AuthIdentity Aggregate Root - Server Interface
 * 认证身份聚合根 - 服务端接口
 *
 * 核心职责:
 * 1. 管理多种凭证 (密码、OAuth、手机等)
 * 2. 协调凭证生命周期 (添加、删除、更新)
 * 3. 实施业务规则 (至少保留一个凭证、登录失败锁定等)
 */

import type { AuthCredentialServer, AuthCredentialServerDTO } from '../entities/auth-credential-server';
import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { AuthIdentityStatus } from '../value-objects/auth-identity-status';
import type { IdentityId } from '@/primitives';


// ============ 聚合根接口 ============

/**
 * Server 端身份聚合根
 * 持有完整的凭证和敏感信息
 */
export interface AuthIdentityServer {
  /**
   * 身份 ID (强类型)
   */
  id: IdentityId;

  /**
   * 身份状态
   */
  status: AuthIdentityStatus;

  /**
   * 登录失败计数
   */
  failedLoginAttempts: number;

  /**
   * 最后失败尝试时间
   */
  lastFailedAttempt: DomainDate | null;

  /**
   * 锁定直到此时间 (null 表示未锁定)
   */
  lockedUntil: DomainDate | null;

  /**
   * ✅ 核心：持有的凭证列表
   * 业务规则: 至少保留一个凭证
   */
  credentials: AuthCredentialServer[];

  /**
   * 创建时间
   */
  createdAt: DomainDate;

  /**
   * 更新时间
   */
  updatedAt: DomainDate;
}

export interface AuthIdentityServerStatic {
  create(params: {
    accountId: IdentityId;
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY';
    hashedPassword?: string;
  }): AuthIdentityServer;
  fromServerDTO(dto: AuthIdentityServerDTO): AuthIdentityServer;
  fromPersistenceDTO(dto: AuthIdentityPersistenceDTO): AuthIdentityServer;
}

// ============ DTO 定义 ============

/**
 * Server DTO (内部构造用)
 * 使用 TransferDate (number) 时间戳
 */
export interface AuthIdentityServerDTO {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: TransferDate | null;
  lockedUntil: TransferDate | null;
  credentials: AuthCredentialServerDTO[];
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Persistence DTO (数据库存储)
 * 使用 PersistenceDate (Date 对象)
 */
export interface AuthIdentityPersistenceDTO {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: PersistenceDate | null;
  lockedUntil: PersistenceDate | null;
  credentials: AuthCredentialServer[];
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}