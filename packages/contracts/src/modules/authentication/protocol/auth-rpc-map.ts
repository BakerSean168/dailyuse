/**
 * Authentication RPC Map
 * 
 * Defines RPC operations for authentication module
 */
import type {
  RegisterByEmailReq, RegisterByEmailRes,
  RegisterByPhoneReq, RegisterByPhoneRes,
  LoginByEmailReq, LoginByEmailRes,
  LoginByPhoneReq, LoginByPhoneRes,
  SendSmsCodeReq, SendSmsCodeRes,
  GetCurrentUserReq, GetCurrentUserRes,
  RefreshTokenReq, RefreshTokenRes,
  ListSessionsReq, ListSessionsRes,
  RevokeSessionReq, RevokeSessionRes,
  ChangePasswordReq, ChangePasswordRes,
  ForgotPasswordReq, ForgotPasswordRes,
  ResetPasswordReq, ResetPasswordRes,
  GetOAuthUrlReq, GetOAuthUrlRes,
  OAuthCallbackReq, OAuthCallbackRes
} from '../api';

export type AuthRpcMap = {
  // Registration
  'auth:register-email': [RegisterByEmailReq, RegisterByEmailRes];
  'auth:register-phone': [RegisterByPhoneReq, RegisterByPhoneRes];
  
  // Login
  'auth:login-email': [LoginByEmailReq, LoginByEmailRes];
  'auth:login-phone': [LoginByPhoneReq, LoginByPhoneRes];
  'auth:send-sms-code': [SendSmsCodeReq, SendSmsCodeRes];
  
  // Session
  'auth:get-current-user': [GetCurrentUserReq, GetCurrentUserRes];
  'auth:refresh-token': [RefreshTokenReq, RefreshTokenRes];
  'auth:list-sessions': [ListSessionsReq, ListSessionsRes];
  'auth:revoke-session': [RevokeSessionReq, RevokeSessionRes];
  'auth:logout': [void, void];
  
  // Password
  'auth:change-password': [ChangePasswordReq, ChangePasswordRes];
  'auth:forgot-password': [ForgotPasswordReq, ForgotPasswordRes];
  'auth:reset-password': [ResetPasswordReq, ResetPasswordRes];
  
  // OAuth
  'auth:get-oauth-url': [GetOAuthUrlReq, GetOAuthUrlRes];
  'auth:oauth-callback': [OAuthCallbackReq, OAuthCallbackRes];
};
