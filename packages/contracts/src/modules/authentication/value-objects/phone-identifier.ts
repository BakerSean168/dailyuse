/**
 * PhoneIdentifier - 手机号标识符 DTO
 *
 * 值对象：以手机号值定义身份，不可变
 */

import type { PhoneNumberDTO } from './phone-number';

// ============ PhoneIdentifier DTO ============

export interface PhoneIdentifierDTO {
  type: 'Phone';
  value: PhoneNumberDTO;
  isVerified: boolean;
}
