/**
 * Account Entity - Server Interface
 * 账户实体 - 服务器接口
 */

import type { IdentityId } from '../../../primitives';
import type { AccountStatus } from '../value-objects/account-status';
import type { AccountProfile, AccountProfileDTO, AccountProfilePersistenceDTO } from '../value-objects/account-profile';
import type { AccountSettings, AccountSettingsDTO, AccountSettingsPersistenceDTO } from '../value-objects/account-settings';
import type { ContactEmail, ContactEmailDTO, ContactEmailPersistenceDTO } from '../value-objects/contact-email';
import type { ContactPhone, ContactPhoneDTO, ContactPhonePersistenceDTO } from '../value-objects/contact-phone';

import type { DomainDate, PersistenceDate, TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * Account Server DTO
 */
export interface AccountServerDTO {
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

/**
 * Account Persistence DTO
 */
export interface AccountPersistenceDTO {
  id: IdentityId;
  status: AccountStatus;
  profile: AccountProfilePersistenceDTO;
  settings: AccountSettingsPersistenceDTO;
  email: ContactEmailPersistenceDTO;
  phone: ContactPhonePersistenceDTO | null;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
