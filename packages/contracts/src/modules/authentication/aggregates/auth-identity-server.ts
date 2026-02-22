/**
 * AuthIdentity Aggregate Root - Server Interface
 * 认证身份聚合根 - 服务端接口
 *
 * 核心职责:
 * 1. 管理标识符集合 (邮箱、手机号等 VO)
 * 2. 管理 OAuth 绑定集合 (Entity 形式的标识符)
 * 3. 管理凭证集合 (仅密码凭证)
 * 4. 协调生命周期 (添加、删除、更新)
 * 5. 实施业务规则 (至少保留一个登录途径、登录失败锁定等)
 */

import type { AuthCredentialServer, AuthCredentialServerDTO } from '../entities/auth-credential-server';
import type { AuthIdentifierDTO, AuthIdentifierPersistenceDTO } from '../value-objects';
import type { OAuthBindingServerDTO, OAuthBindingPersistenceDTO } from '../entities/oauth-binding';
import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { AuthIdentityStatus } from '../value-objects/auth-identity-status';
import type { IdentityId } from '@/primitives';


// ============ 聚合根接口 ============

/**
 * Server 端身份聚合根
 * 持有完整的标识符、绑定、凭证和敏感信息
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
   * 标识符集合 (邮箱/手机号 VO)
   * 解决"如何找到用户"
   */
  identifiers: AuthIdentifierDTO[];

  /**
   * OAuth 绑定集合 (Entity 形式的标识符)
   * 解决"通过第三方如何找到用户"
   */
  oauthBindings: OAuthBindingServerDTO[];

  /**
   * 凭证列表 (仅 PasswordCredential)
   * 解决"如何验证用户"
   * 业务规则: 至少保留一个登录途径
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

  /**
   * 同步版本号
   */
  version: number;

  /**
   * 软删除时间
   */
  deletedAt: DomainDate | null;
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
  identifiers: AuthIdentifierDTO[];
  oauthBindings: OAuthBindingServerDTO[];
  credentials: AuthCredentialServerDTO[];
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
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
  identifiers: AuthIdentifierPersistenceDTO[];
  oauthBindings: OAuthBindingPersistenceDTO[];
  credentials: AuthCredentialServer[];
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
