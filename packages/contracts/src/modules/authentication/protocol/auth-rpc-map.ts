/**
 * Authentication RPC Map
 *
 * Defines RPC operations for authentication module
 */
import type {
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  SendSmsCodeReq,
  SendSmsCodeRes,
  GetCurrentUserReq,
  GetCurrentUserRes,
  RefreshTokenReq,
  RefreshTokenRes,
  ListSessionsReq,
  ListSessionsRes,
  RevokeSessionReq,
  RevokeSessionRes,
  ChangePasswordReq,
  ChangePasswordRes,
  ForgotPasswordReq,
  ForgotPasswordRes,
  ResetPasswordReq,
  ResetPasswordRes,
  SendEmailCodeReq,
  SendEmailCodeRes,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
  GetOAuthUrlReq,
  GetOAuthUrlRes,
  OAuthCallbackReq,
  OAuthCallbackRes,
} from '../api';
import type {
  AuthBootstrapSnapshot,
  AutoLoginResult,
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
} from './desktop-auth.types';

export type AuthRpcMap = {
  // Registration
  'auth:register': [
    RegisterByEmailReq | RegisterByPhoneReq,
    RegisterByEmailRes | RegisterByPhoneRes,
  ];

  // Login
  'auth:login': [LoginByEmailReq | LoginByPhoneReq, LoginByEmailRes | LoginByPhoneRes];
  'auth:send-sms-code': [SendSmsCodeReq, SendSmsCodeRes];

  // Session
  'auth:get-current-user': [GetCurrentUserReq, GetCurrentUserRes];
  'auth:get-bootstrap-snapshot': [void, AuthBootstrapSnapshot];
  'auth:auto-login': [void, AutoLoginResult];
  'auth:remembered-accounts:list': [void, RememberedDesktopAccountDTO[]];
  'auth:remembered-accounts:login': [RememberedDesktopAccountLoginReq, LoginByEmailRes];
  'auth:remembered-accounts:remove': [string, void];
  'auth:refresh-token': [RefreshTokenReq, RefreshTokenRes];
  'auth:session:list': [ListSessionsReq, ListSessionsRes];
  'auth:session:revoke': [RevokeSessionReq, RevokeSessionRes];
  'auth:logout': [void, void];

  // Password
  'auth:change-password': [ChangePasswordReq, ChangePasswordRes];
  'auth:forgot-password': [ForgotPasswordReq, ForgotPasswordRes];
  'auth:reset-password': [ResetPasswordReq, ResetPasswordRes];

  // Email verification
  'auth:send-email-code': [SendEmailCodeReq, SendEmailCodeRes];
  'auth:verify-email-code': [VerifyEmailCodeReq, VerifyEmailCodeRes];

  // OAuth
  'auth:get-oauth-url': [GetOAuthUrlReq, GetOAuthUrlRes];
  'auth:oauth-callback': [OAuthCallbackReq, OAuthCallbackRes];
};

