/**
 * Account Module Exports
 * 账户模块 - 显式导出
 */


// ============ Aggregates ============
export type {
  AccountServerDTO,
  AccountPersistenceDTO,
  AccountServer,
  AccountServerStatic,
} from './aggregates/account-server';

export type {
  AccountClientDTO,
  AccountClient,
  AccountClientStatic,
} from './aggregates/account-client';

// ============ Entities ============

// ============ Value Objects ============
export type {
  AccountProfile,
  AccountProfileDTO,
  AccountProfilePersistenceDTO
} from './value-objects/account-profile';
export type {
  AccountSettings,
  AccountSettingsDTO,
  AccountSettingsPersistenceDTO
} from './value-objects/account-settings';
export type {
  ContactEmail,
  ContactEmailDTO,
  ContactEmailPersistenceDTO
} from './value-objects/contact-email';
export type {
  ContactPhone,
  ContactPhoneDTO,
  ContactPhonePersistenceDTO
} from './value-objects/contact-phone';
export {
  AccountStatus
} from './value-objects/account-status';
export {
  GenderType
} from './value-objects/gender-type';
export {
  ThemeType
} from './value-objects/theme-type';

// ============ protocol ============

export type {
  AccountEventMap,
  AccountRpcMap,
} from './protocol';

// ============ API Requests/Responses ============
export type {
  CreateAccountReq,
  UpdateProfileReq,
} from './api';