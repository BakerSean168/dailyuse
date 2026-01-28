/**
 * 账户模块的邮箱
 * 关注点：联系能力、验证状态
 */

import type { DomainDate, PersistenceDate, TransferDate } from '@/primitives';

export interface ContactEmail {
  address: string;      // jdoe@example.com
  isVerified: boolean;  // 是否已验证拥有权
  verifiedAt?: DomainDate | null;
  isPrimary: boolean;   // 是否为主联系邮箱
}

export interface ContactEmailDTO {
  address: string;      // jdoe@example.com
  isVerified: boolean;  // 是否已验证拥有权
  verifiedAt?: TransferDate | null;
  isPrimary: boolean;   // 是否为主联系邮箱
}

export interface ContactEmailPersistenceDTO {
  address: string;      // jdoe@example.com
  isVerified: boolean;  // 是否已验证拥有权
  verifiedAt?: PersistenceDate | null;
  isPrimary: boolean;   // 是否为主联系邮箱
}