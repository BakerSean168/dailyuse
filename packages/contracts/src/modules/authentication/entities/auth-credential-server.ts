/**
 * 凭证 DTO 类型
 * 
 * 重构后仅保留 PasswordCredential 作为真正的凭证
 * PhoneCredential → 迁移为 PhoneIdentifier (值对象标识符)
 * OAuthCredential → 迁移为 OAuthBinding (实体形式标识符)
 * 
 * Server 端实体类型已移至领域模型内部
 * 此处仅保留 DTO 定义
 */

import type { PasswordCredentialServerDTO } from "./password-credential-server";

// ============ DTO 定义 ============

/**
 * 内部 DTO (用于构造函数)
 */
export type AuthCredentialServerDTO = PasswordCredentialServerDTO;
