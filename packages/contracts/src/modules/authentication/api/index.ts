/**
 * Authentication API Export
 */

// === Schemas ===
export { RegisterByEmailSchema, RegisterByPhoneSchema } from './register';
export { LoginByEmailSchema, LoginByPhoneSchema, SendSmsCodeSchema } from './login';
export { RefreshTokenSchema, RevokeSessionSchema } from './session';
export { ChangePasswordSchema, ForgotPasswordSchema, ResetPasswordSchema } from './password';
export { GetOAuthUrlSchema, OAuthCallbackSchema } from './oauth';

// === Request/Response Types ===
export type { RegisterByEmailReq, RegisterByEmailRes, RegisterByPhoneReq, RegisterByPhoneRes } from './register';
export type { LoginByEmailReq, LoginByEmailRes, LoginByPhoneReq, LoginByPhoneRes, SendSmsCodeReq, SendSmsCodeRes } from './login';
export type { 
  GetCurrentUserReq, GetCurrentUserRes,
  RefreshTokenReq, RefreshTokenRes, 
  ListSessionsReq, ListSessionsRes,
  RevokeSessionReq, RevokeSessionRes 
} from './session';
export type { ChangePasswordReq, ChangePasswordRes, ForgotPasswordReq, ForgotPasswordRes, ResetPasswordReq, ResetPasswordRes } from './password';
export type { GetOAuthUrlReq, GetOAuthUrlRes, OAuthCallbackReq, OAuthCallbackRes } from './oauth';
