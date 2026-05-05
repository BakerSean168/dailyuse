/**
 * 账户模块的邮箱
 */

import type { DomainDate, TransferDate } from '../../../primitives';

export interface ContactEmail {
  address: string;
  isVerified: boolean;
  verifiedAt: DomainDate | null;
  isPrimary: boolean;
}

export interface ContactEmailDTO {
  address: string;
  isVerified: boolean;
  verifiedAt: TransferDate | null;
  isPrimary: boolean;
}
