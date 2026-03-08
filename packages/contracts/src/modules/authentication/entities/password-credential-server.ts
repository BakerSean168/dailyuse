import type { BaseAuthCredentialServerDTO } from './base-auth-credential-server';
import type { HashedPassword } from '../value-objects/hashed-password';
import type { TransferDate } from '../../../primitives';

/**
 * 密码凭证 DTO (Server 端持有哈希值)
 *
 * Server 端实体接口已移至领域模型内部定义 (PasswordCredentialState)
 * 此处仅保留 DTO 定义
 */
export interface PasswordCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'Password';
  hashedPassword: HashedPassword;
  passwordLastChangedAt: TransferDate;
}
