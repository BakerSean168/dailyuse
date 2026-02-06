/**
 * Account Entity - Server Interface
 * 账户实体 - 服务器接口
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
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

  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
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
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
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
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
