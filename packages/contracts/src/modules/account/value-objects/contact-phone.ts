/**
 * 账户模块的电话 DTO
 */

import type { DomainDate, PersistenceDate, TransferDate } from '@/primitives';

export interface ContactPhone {
  countryCode: string;  // +86
  number: string;       // 13800138000
  fullNumber: string;   // +8613800138000 (E.164格式)
  isVerified: boolean;
  verifiedAt: DomainDate | null;
}

export interface ContactPhoneDTO {
  countryCode: string;  // +86
  number: string;       // 13800138000
  fullNumber: string;   // +8613800138000 (E.164格式)
  isVerified: boolean;
  verifiedAt: TransferDate | null;
}

export interface ContactPhonePersistenceDTO {
  countryCode: string;  // +86
  number: string;       // 13800138000
  fullNumber: string;   // +8613800138000 (E.164格式)
  isVerified: boolean;
  verifiedAt: PersistenceDate | null;
}
