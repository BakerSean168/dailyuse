// ============ ID Types ============

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
} from './email-address';

export type {
  HashedPassword,
  HashedPasswordDTO,
} from './hashed-password';

export type {
  PlainPassword,
  PlainPasswordDTO,
} from './plain-password';

export type {
  PhoneNumber,
  PhoneNumberDTO,
} from './phone-number';

export type {
  DeviceInfo,
  DeviceInfoDTO,
} from './device-info';

// ============ Identifier Value Objects ============

export type {
  EmailIdentifierDTO,
} from './email-identifier';

export type {
  PhoneIdentifierDTO,
} from './phone-identifier';

// ============ AuthIdentifier Union ============

import type { EmailIdentifierDTO } from './email-identifier';
import type { PhoneIdentifierDTO } from './phone-identifier';

export type AuthIdentifierDTO = EmailIdentifierDTO | PhoneIdentifierDTO;
