/**
 * AuthIdentity Client DTO
 * 客户端使用的认证实体数据传输对象
 * 不包含敏感信息，如凭证详情
 */

import type { IdentityId } from '../value-objects/identity-id';
import type { IdentityStatus } from '../value-objects/auth-identity-status';
import type { DomainDate, TransferDate } from '@/primitives';



// ============ 实体接口 ============

export interface AuthIdentityClient {
  readonly id: IdentityId;
  status: IdentityStatus;
  accountUuid: string;

  // 失败计数 (业务核心)
  failedLoginAttempts: number;
  lastFailedAttempt?: DomainDate;
  lockedUntil?: DomainDate;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;
}

export interface AuthIdentityClientDTO {
  id: IdentityId;
  status: IdentityStatus;
  accountUuid: string;
  failedLoginAttempts: number;
  lastFailedAttempt?: TransferDate;
  lockedUntil?: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
