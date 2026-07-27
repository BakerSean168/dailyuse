/**
 * 账户模块的邮箱
 *
 * ADR-037: verifiedAt is Instant ≡ TransferDate (epoch ms).
 */

import type { Instant, TransferDate } from '../../../primitives';

export interface ContactEmail {
  address: string;
  isVerified: boolean;
  verifiedAt: Instant | null;
  isPrimary: boolean;
}

export interface ContactEmailDTO {
  address: string;
  isVerified: boolean;
  verifiedAt: TransferDate | null;
  isPrimary: boolean;
}
