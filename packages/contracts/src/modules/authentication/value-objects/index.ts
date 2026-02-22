// ============ ID Types ============

import type { IdentifierType } from './identifier-type';
import type { OAuthProvider } from './oauth-provider';

export type {
  AuthCredentialId,
} from './auth-credential-id';

export type {
  AuthSessionId,
} from './auth-session-id';

export type {
  IdentityId,
} from './identity-id';

// ============ Enums (不需要 type 前缀) ============

export {
  CredentialStatus,
} from './credential-status';

export {
  CredentialType,
} from './credential-type';

export {
  DeviceType,
} from './device-type';

export {
  PasswordAlgorithm,
} from './password-algorithm';

export {
  SessionStatus,
} from './session-status';

export {
  AuthIdentityStatus,
} from './auth-identity-status';

export {
  OAuthProvider,
} from './oauth-provider';

export {
  IdentifierType,
} from './identifier-type';
// ============ Value Objects ============

export type {
  EmailAddress,
  EmailAddressDTO,
  EmailAddressPersistenceDTO,
} from './email-address';

export type {
  HashedPassword,
  HashedPasswordDTO,
  HashedPasswordPersistenceDTO,
} from './hashed-password';

export type {
  PlainPassword,
  PlainPasswordDTO,
} from './plain-password';

export type {
  PhoneNumber,
  PhoneNumberDTO,
  PhoneNumberPersistenceDTO,
} from './phone-number';

export type {
  DeviceInfo,
  DeviceInfoDTO,
  DeviceInfoPersistenceDTO,
} from './device-info';

// ============ Identifier Value Objects ============

export type {
  EmailIdentifierDTO,
  EmailIdentifierPersistenceDTO,
} from './email-identifier';

export type {
  PhoneIdentifierDTO,
  PhoneIdentifierPersistenceDTO,
} from './phone-identifier';

// ============ AuthIdentifier Union ============

import type { EmailIdentifierDTO, EmailIdentifierPersistenceDTO } from './email-identifier';
import type { PhoneIdentifierDTO, PhoneIdentifierPersistenceDTO } from './phone-identifier';

export type AuthIdentifierDTO = EmailIdentifierDTO | PhoneIdentifierDTO;
export type AuthIdentifierPersistenceDTO = EmailIdentifierPersistenceDTO | PhoneIdentifierPersistenceDTO;
