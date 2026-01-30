/**
 * 所有凭证的联合类型
 * 使用 Discriminated Union 实现多态
 */

import type { PasswordCredentialServer, PasswordCredentialServerDTO, PasswordCredentialPersistenceDTO } from "./password-credential-server";
import type { OAuthCredentialServer, OAuthCredentialServerDTO, OAuthCredentialPersistenceDTO } from "./oauth-credential-server";
import type { PhoneCredentialServer, PhoneCredentialServerDTO, PhoneCredentialPersistenceDTO } from "./phone-credential-server";

export type AuthCredentialServer =
  | PasswordCredentialServer
  | OAuthCredentialServer
  | PhoneCredentialServer;

  
export interface AuthCredentialServerStatic {
  fromPersistenceDTO(dto: AuthCredentialPersistenceDTO): AuthCredentialServer;
}

// ============ DTO 定义 ============

/**
 * 内部 DTO (用于构造函数)
 */
export type AuthCredentialServerDTO = 
    | PasswordCredentialServerDTO 
    | OAuthCredentialServerDTO 
    | PhoneCredentialServerDTO;

/**
 * 持久化 DTO (数据库存储)
 */
export type AuthCredentialPersistenceDTO = 
  | PasswordCredentialPersistenceDTO 
  | OAuthCredentialPersistenceDTO 
  | PhoneCredentialPersistenceDTO;