/**
 * PhoneIdentifier - 手机号标识符 DTO
 * 
 * 值对象：以手机号值定义身份，不可变
 */

import type { PhoneNumberDTO, PhoneNumberPersistenceDTO } from './phone-number';

// ============ PhoneIdentifier DTO ============

export interface PhoneIdentifierDTO {
  type: 'PHONE';
  value: PhoneNumberDTO;
  isVerified: boolean;
}

export interface PhoneIdentifierPersistenceDTO {
  type: 'PHONE';
  value: PhoneNumberPersistenceDTO;
  isVerified: boolean;
}
