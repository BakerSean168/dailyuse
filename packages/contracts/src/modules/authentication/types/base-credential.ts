import type { CredentialId } from "../value-objects/auth-credential-id";
import type { CredentialType } from "../value-objects/auth-credential-type";

export interface BaseCredential {
  readonly id: CredentialId;
  readonly type: CredentialType; // 辨识字段 (Discriminator)
  readonly identifier: string;   // 统一查询索引: email / phone / open_id
  
  isVerified: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}