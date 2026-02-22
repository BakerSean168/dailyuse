import type { PhoneNumber, PhoneNumberDTO } from "../value-objects/phone-number";
import type { BaseAuthCredentialServer, BaseAuthCredentialServerDTO } from './base-auth-credential-server';

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


