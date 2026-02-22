/**
 * AuthIdentity Aggregate Root - Client Interface
 * 认证身份聚合根 - 客户端接口
 *
 * Client 端看到的身份是脱敏的
 * - 不包含凭证的敏感信息
 * - 仅显示用户友好的状态信息
 */

import type { AuthCredentialClient, AuthCredentialClientDTO } from '../entities/auth-credential-client';
import type { AuthIdentifierDTO } from '../value-objects';
import type { TransferDate, DomainDate, IdentityId } from '@/primitives';
import type { AuthIdentityStatus } from '../value-objects';

// ============ 聚合根接口 ============

/**
 * Client 端身份聚合根
 */
export interface AuthIdentityClient {
  /**
   * 身份 ID
   */
  id: IdentityId;

  /**
   * 身份状态 (ACTIVE, LOCKED, DISABLED)
   */
  status: AuthIdentityStatus;

  /**
   * 登录失败计数 (UI 可能显示: "还可尝试 3 次")
   */
  failedLoginAttempts: number;

  /**
   * 最后失败尝试时间
   */
  lastFailedAttempt: DomainDate | null;

  /**
   * 锁定直到此时间 (UI 可能显示: "账户已锁定，请 15 分钟后重试")
   */
  lockedUntil: DomainDate | null;

  /**
   * 标识符列表 (邮箱/手机号)
   */
  identifiers: AuthIdentifierDTO[];

  /**
   * 脱敏的凭证列表 (仅显示 displayName, lastUsedAt)
   */
  credentials: AuthCredentialClient[];

  /**
   * 创建时间
   */
  createdAt: DomainDate;

  /**
   * 更新时间
   */
  updatedAt: DomainDate;

  // 同步字段
  version: number;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface AuthIdentityClientDTO {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: TransferDate | null;
  lockedUntil: TransferDate | null;
  identifiers: AuthIdentifierDTO[];
  credentials: AuthCredentialClientDTO[];
  hasPassword: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasOAuth: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
