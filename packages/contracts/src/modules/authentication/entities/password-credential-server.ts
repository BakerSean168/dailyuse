import type { BaseCredential } from '../types/base-credential';
import type { CredentialType } from '../value-objects/auth-credential-type';
import type { HashedPassword } from '../value-objects/hashed-password';

export interface PasswordCredential extends BaseCredential {
  readonly type: CredentialType.PASSWORD;
  
  // 这里存的是值对象 HashedPassword，而不是 string
  passwordHash: HashedPassword; 
  
  // 用于安全策略: "您的密码已超过90天未修改"
  passwordChangedAt: Date; 
}