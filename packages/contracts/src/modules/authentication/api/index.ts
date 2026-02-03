/**
 * Authentication Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 按功能分组，每个操作导出相关的 Schema、Request、Response 类型
 */

export {
  // Login Operations
  SendSmsCodeSchema,
  type SendSmsCodeReq,
  type SendSmsCodeRes,
  LoginByEmailSchema,
  type LoginByEmailReq,
  type LoginByEmailRes,
  LoginByPhoneSchema,
  type LoginByPhoneReq,
  type LoginByPhoneRes,

  // Register Operations
  RegisterByEmailSchema,
  type RegisterByEmailReq,
  type RegisterByEmailRes,
  RegisterByPhoneSchema,
  type RegisterByPhoneReq,
  type RegisterByPhoneRes,

  // Password Operations
  ChangePasswordSchema,
  type ChangePasswordReq,
  type ChangePasswordRes,
  ResetPasswordSchema,
  type ResetPasswordReq,
  type ResetPasswordRes,

  // OAuth Operations
  OAuthAuthorizeSchema,
  type OAuthAuthorizeReq,
  type OAuthAuthorizeRes,

  // Session Operations
  RefreshTokenSchema,
  type RefreshTokenReq,
  type RefreshTokenRes,
  type LogoutReq,
  type LogoutRes,
  type ValidateTokenReq,
  type ValidateTokenRes,
} from './crud';
