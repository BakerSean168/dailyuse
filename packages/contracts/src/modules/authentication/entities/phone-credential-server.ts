import type { PhoneNumber, PhoneNumberDTO, PhoneNumberPersistenceDTO } from "../value-objects/phone-number";
import type { BaseAuthCredentialPersistenceDTO, BaseAuthCredentialServer, BaseAuthCredentialServerDTO } from './base-auth-credential-server';

/**
 * 手机凭证
 */
export interface PhoneCredentialServer extends BaseAuthCredentialServer {
  type: 'PHONE';
  phoneNumber: PhoneNumber;
  isVerified: boolean;
}

export interface PhoneCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'PHONE';
  phoneNumber: PhoneNumberDTO;
  isVerified: boolean;
}

export interface PhoneCredentialPersistenceDTO extends BaseAuthCredentialPersistenceDTO {
  type: 'PHONE';
  phoneNumber: PhoneNumberPersistenceDTO;
  isVerified: boolean;
}
