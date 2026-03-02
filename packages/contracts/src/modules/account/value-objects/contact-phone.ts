/**
 * 账户模块的电话
 */

import type { DomainDate, PersistenceDate, TransferDate } from '../../../primitives';

export interface ContactPhone {
  countryCode: string;
  number: string;
  fullNumber: string;
  isVerified: boolean;
  verifiedAt: DomainDate | null;
}

export interface ContactPhoneDTO {
  countryCode: string;
  number: string;
  fullNumber: string;
  isVerified: boolean;
  verifiedAt: TransferDate | null;
}

export interface ContactPhonePersistenceDTO {
  countryCode: string;
  number: string;
  fullNumber: string;
  isVerified: boolean;
  verifiedAt: PersistenceDate | null;
}
