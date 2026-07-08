export { AuthCredentialId } from './auth-credential-id';
export { AuthIdentityStatus } from './auth-identity-status';
export { AuthSessionId } from './auth-session-id';
export { CredentialStatus } from './credential-status';
export { CredentialType } from './credential-type';
export { DeviceInfo } from './device-info';
export { DeviceType } from './device-type';
export { EmailAddress } from './email-address';
export { EmailIdentifier } from './email-identifier';
export { HashedPassword } from './hashed-password';
export { OAuthProvider } from './oauth-provider';
export { PasswordAlgorithm } from './password-algorithm';
export { PhoneIdentifier } from './phone-identifier';
export { PhoneNumber } from './phone-number';
export { PlainPassword } from './plain-password';
export { SessionStatus } from './session-status';

import type { EmailIdentifier } from './email-identifier';
import type { PhoneIdentifier } from './phone-identifier';

export type ConcreteIdentifier = EmailIdentifier | PhoneIdentifier;
