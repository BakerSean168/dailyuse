import type { CredentialStatus } from '../value-objects/credential-status';
import type { AuthCredentialId } from '../value-objects/auth-credential-id';
import type { HashedPassword } from '../value-objects/hashed-password';
import type { TransferDate } from '../../../primitives';

/**
 * 密码凭证 DTO (Server 端持有哈希值)
 *
 * Residual 687: base credential server dual collapsed — password is the only
 * server credential DTO (fields previously on the unused base interface).
 *
 * Server 端实体接口已移至领域模型内部定义 (PasswordCredentialState)
 * 此处仅保留 DTO 定义
 */
export interface PasswordCredentialServerDTO {
  id: AuthCredentialId;
  type: 'Password';
  status: CredentialStatus;
  createdAt: TransferDate;
  lastUsedAt: TransferDate | null;
  hashedPassword: HashedPassword;
  passwordLastChangedAt: TransferDate;
}
