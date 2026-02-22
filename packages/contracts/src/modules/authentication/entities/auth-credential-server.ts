/**
 * 凭证类型
 * 
 * 重构后仅保留 PasswordCredential 作为真正的凭证
 * PhoneCredential → 迁移为 PhoneIdentifier (值对象标识符)
 * OAuthCredential → 迁移为 OAuthBinding (实体形式标识符)
 */

import type { PasswordCredentialServer, PasswordCredentialServerDTO, PasswordCredentialPersistenceDTO } from "./password-credential-server";

export type AuthCredentialServer = PasswordCredentialServer;

  
// ============ DTO 定义 ============

/**
 * 内部 DTO (用于构造函数)
 */
export type AuthCredentialServerDTO = PasswordCredentialServerDTO;

/**
 * 持久化 DTO (数据库存储)
 */
export type AuthCredentialPersistenceDTO = PasswordCredentialPersistenceDTO;
