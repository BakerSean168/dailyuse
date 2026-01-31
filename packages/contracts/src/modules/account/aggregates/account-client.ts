/**
 * Account Entity - Client Interface
 * 账户实体 - 客户端接口
 */

import type { IdentityId } from "../value-objects/identity-id";
import type { AccountStatus } from "../value-objects/account-status";
import type { AccountProfile, AccountProfileDTO } from "../value-objects/account-profile";
import type { AccountSettings, AccountSettingsDTO } from "../value-objects/account-settings";
import type { ContactEmail, ContactEmailDTO } from "../value-objects/contact-email";
import type { ContactPhone, ContactPhoneDTO } from "../value-objects/contact-phone";

import type { DomainDate } from "@/primitives/domain-date";
import type { TransferDate } from "@/primitives";
// ============ 实体接口 ============

export interface AccountClient {
  id: IdentityId;
  
  status: AccountStatus;
  
  profile: AccountProfile;
  settings: AccountSettings;
  email: ContactEmail;
  phone: ContactPhone | null;

  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ============ DTO 定义 ============

/**
 * Account Client DTO
 */
export interface AccountClientDTO {
  id: string;
  status: AccountStatus;
  profile: AccountProfileDTO;
  settings: AccountSettingsDTO;
  email: ContactEmailDTO;
  phone: ContactPhoneDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
