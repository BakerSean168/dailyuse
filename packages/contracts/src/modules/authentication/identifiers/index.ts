// ============ Identifiers - EmailIdentifier ============
export type {
  IdentifierType,
  EmailIdentifierDTO,
  EmailIdentifierPersistenceDTO,
} from './email-identifier';

// ============ Identifiers - PhoneIdentifier ============
export type {
  PhoneIdentifierDTO,
  PhoneIdentifierPersistenceDTO,
} from './phone-identifier';

// ============ Identifiers - AuthIdentifier Union ============
import type { EmailIdentifierDTO, EmailIdentifierPersistenceDTO } from './email-identifier';
import type { PhoneIdentifierDTO, PhoneIdentifierPersistenceDTO } from './phone-identifier';

export type AuthIdentifierDTO = EmailIdentifierDTO | PhoneIdentifierDTO;
export type AuthIdentifierPersistenceDTO = EmailIdentifierPersistenceDTO | PhoneIdentifierPersistenceDTO;

// ============ Identifiers - OAuthBinding ============
export type {
  OAuthBindingServer,
  OAuthBindingServerDTO,
  OAuthBindingPersistenceDTO,
} from './oauth-binding';
