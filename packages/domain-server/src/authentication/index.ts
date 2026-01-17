/**
 * Authentication Module - Domain Server
 * 认证模块 - 领域服务端
 */

// 聚合根
export { AuthCredential } from './aggregates/auth-credential';
export { AuthSession } from './aggregates/auth-session';

// 实体
export { PasswordCredential } from './entities/password-credential';
export { ApiKeyCredential } from './entities/api-key-credential';
export { RememberMeToken } from './entities/remember-me-token';
export { CredentialHistory } from './entities/credential-history';
export { RefreshToken } from './entities/refresh-token';
export { SessionHistory } from './entities/session-history';

// 值对象
export { DeviceInfo } from './value-objects/device-info';
export { JwtPayload } from './value-objects/jwt-payload';

// 错误
export {
  AuthenticationError,
  InvalidCredentialsError,
  TokenExpiredError,
  CredentialLockedError,
  InvalidSignatureError,
  SessionRevokedError,
  InvalidSessionError,
  AuthenticationFailedError,
  TwoFactorAuthenticationError,
  WeakPasswordError,
} from './errors';

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
export { AuthenticationDomainService } from './services/authentication-domain.service';
