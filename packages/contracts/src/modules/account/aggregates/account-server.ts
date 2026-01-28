/**
 * Account Entity - Server Interface
 * 账户实体 - 服务器接口
 */

import type { IdentityId } from "@/modules/authentication/value-objects/identity-id";
import type { AccountStatus } from "../value-objects/account-status";
import type { AccountProfile, AccountProfileDTO, AccountProfilePersistenceDTO } from "../value-objects/account-profile";
import type { AccountSettings, AccountSettingsDTO, AccountSettingsPersistenceDTO } from "../value-objects/account-settings";
import type { ContactEmail, ContactEmailDTO, ContactEmailPersistenceDTO } from "../value-objects/contact-email";
import type { ContactPhone, ContactPhoneDTO, ContactPhonePersistenceDTO } from "../value-objects/contact-phone";

import type { DomainDate } from "@/primitives/domain-date";
import type { PersistenceDate, TransferDate } from "@/primitives";
// ============ 实体接口 ============

export interface AccountServer {
  id: IdentityId;
  
  status: AccountStatus;
  
  profile: AccountProfile;
  settings: AccountSettings;
  email: ContactEmail;
  phone: ContactPhone | null;

  createdAt: DomainDate;
  updatedAt: DomainDate;
}

export interface AccountServerStatic {
  fromPersistenceDTO(dto: AccountPersistenceDTO): AccountServer;
  fromServerDTO(dto: AccountServerDTO): AccountServer;
}

// ============ DTO 定义 ============

/**
 * Account Server DTO
 */
export interface AccountServerDTO {
  id: string;
  status: AccountStatus;
  profile: AccountProfileDTO;
  settings: AccountSettingsDTO;
  email: ContactEmailDTO;
  phone: ContactPhoneDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * Account Persistence DTO
 */
export interface AccountPersistenceDTO {
  id: string;
  status: AccountStatus;
  profile: AccountProfilePersistenceDTO;
  settings: AccountSettingsPersistenceDTO;
  email: ContactEmailPersistenceDTO;
  phone: ContactPhonePersistenceDTO | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
