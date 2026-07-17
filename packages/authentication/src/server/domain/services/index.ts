export { RegistrationService } from './registration';
export { LoginService } from './login';
export { LogoutService } from './logout';
export type { IEmailSender } from './i-email-sender';
export type { IPasswordHasher } from './i-password-hasher.service';
export type { IPasswordResetCodeStore } from './i-password-reset-code-store';
export type {
  ITokenProvider,
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
} from './token-provider.interface';

// ================= Pluggable authentication providers =================
export {
  AuthenticationMethod,
  UnsupportedAuthenticationMethodError,
  DuplicateAuthenticationProviderError,
} from './authentication-provider';
export type {
  AuthenticationProvider,
  AuthenticationContext,
  AuthenticationResult,
} from './authentication-provider';
export { AuthenticationProviderRegistry } from './authentication-provider-registry';
export {
  PasswordAuthenticationProvider,
  type PasswordCredentials,
} from './providers/password-authentication.provider';
export {
  GithubAuthenticationProvider,
  type GithubCredentials,
} from './providers/github-authentication.provider';
export type {
  IGithubOAuthClient,
  GithubUserIdentity,
} from './providers/i-github-oauth-client';
