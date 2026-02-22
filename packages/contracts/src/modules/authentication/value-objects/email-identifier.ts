/**
 * EmailIdentifier - 邮箱标识符 DTO
 * 
 * 值对象：以邮箱地址值定义身份，不可变
 */

// ============ EmailIdentifier DTO ============

export interface EmailIdentifierDTO {
  type: 'EMAIL';
  value: string;
  isVerified: boolean;
}

export interface EmailIdentifierPersistenceDTO {
  type: 'EMAIL';
  value: string;
  isVerified: boolean;
}
