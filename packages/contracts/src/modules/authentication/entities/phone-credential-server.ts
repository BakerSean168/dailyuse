import type { BaseCredential } from "../types/base-credential";
import type { CredentialType } from "../value-objects/auth-credential-type";
import type { PhoneNumberServer } from "../value-objects/phone-number";

export interface PhoneCredential extends BaseCredential {
  readonly type: CredentialType.PHONE_SMS;
  readonly phoneNumber: PhoneNumberServer; // 强类型
}