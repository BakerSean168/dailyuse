/**
 * 账户模块的电话
 */

import type { DomainDate, TransferDate } from '../../../primitives';

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
