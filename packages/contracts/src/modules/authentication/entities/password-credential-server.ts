import type { BaseAuthCredentialServer, BaseAuthCredentialServerDTO } from './base-auth-credential-server';
import type { HashedPassword } from '../value-objects/hashed-password';
import type { DomainDate, TransferDate } from '@/primitives';

/**
 * 密码凭证 (Server 端持有哈希值)
 * ✅ Server 可以看到哈希值和盐值
 * ❌ 绝对不能序列化给 Client 端
 */
export interface PasswordCredentialServer extends BaseAuthCredentialServer {
  type: 'PASSWORD';
  hashedPassword: HashedPassword;
  passwordLastChangedAt: DomainDate;
}

export interface PasswordCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'PASSWORD';
  hashedPassword: HashedPassword;
  passwordLastChangedAt: TransferDate;
}

