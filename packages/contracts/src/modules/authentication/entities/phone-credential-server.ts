import type { PhoneNumberDTO } from "../value-objects/phone-number";
import type { BaseAuthCredentialServerDTO } from './base-auth-credential-server';

/**
 * 手机凭证 DTO
 * 
 * Server 端实体接口已移至领域模型内部定义 (PhoneCredentialState)
 * 此处仅保留 DTO 定义
 */
export interface PhoneCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'PHONE';
  phoneNumber: PhoneNumberDTO;
  isVerified: boolean;
}