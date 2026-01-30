/**
 * Authentication Module - Domain Server
 * 认证模块 - 领域服务端
 */

// 聚合根
export { AuthIdentity } from './aggregates/auth-identity';
export { AuthSession } from './aggregates/auth-session';

// 实体
export { PasswordCredential } from './entities/password-credential';
export { OAuthCredential } from './entities/oauth-credential';
export { PhoneCredential } from './entities/phone-credential';

// 仓储接口
export type {
  IAuthCredentialRepository,
  PrismaTransactionClient as AuthCredentialPrismaTransactionClient,
} from './repositories/auth-credential.repository';
export type {
  IAuthSessionRepository,
  PrismaTransactionClient as AuthSessionPrismaTransactionClient,
} from './repositories/auth-session.repository';

// 领域服务
