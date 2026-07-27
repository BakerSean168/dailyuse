/**
 * 账户模块的电话
 *
 * ADR-037: verifiedAt is Instant ≡ TransferDate (epoch ms).
 */

import type { Instant, TransferDate } from '../../../primitives';

export interface ContactPhone {
  countryCode: string;
  number: string;
  fullNumber: string;
  isVerified: boolean;
  verifiedAt: Instant | null;
}

export interface ContactPhoneDTO {
  countryCode: string;
  number: string;
  fullNumber: string;
  isVerified: boolean;
  verifiedAt: TransferDate | null;
}
