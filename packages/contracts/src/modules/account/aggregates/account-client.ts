/**
 * Account Entity - Client Interface
 * 账户实体 - 客户端接口
 */

import type { IdentityId } from '../value-objects/identity-id';
import type { AccountStatus } from '../value-objects/account-status';
import type { AccountProfileDTO } from '../value-objects/account-profile';
import type { AccountSettingsDTO } from '../value-objects/account-settings';
import type { ContactEmailDTO } from '../value-objects/contact-email';
import type { ContactPhoneDTO } from '../value-objects/contact-phone';

import type { TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Account Client DTO
 */
export interface AccountClientDTO {
  id: IdentityId;
  status: AccountStatus;
  profile: AccountProfileDTO;
  settings: AccountSettingsDTO;
  email: ContactEmailDTO;
  phone: ContactPhoneDTO | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
