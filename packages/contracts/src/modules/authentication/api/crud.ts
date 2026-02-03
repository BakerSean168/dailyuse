/**
 * Authentication Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities）
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

// ============================================================================
// LOGIN Operations
// ============================================================================

/**
 * 发送短信验证码 Schema
 */
export const SendSmsCodeSchema = z.object({
  phoneNumber: z.string().min(5, '手机号格式错误'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'BIND', 'RESET_PASSWORD']),
});

export type SendSmsCodeReq = z.infer<typeof SendSmsCodeSchema>;
export type SendSmsCodeRes = void;

/**
 * 邮箱密码登录 Schema
 */
export const LoginByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;
export type LoginByEmailRes = AuthResponseDTO;

/**
 * 手机验证码登录 Schema
 */
export const LoginByPhoneSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6, '验证码错误'),
});

export type LoginByPhoneReq = z.infer<typeof LoginByPhoneSchema>;
export type LoginByPhoneRes = AuthResponseDTO;

// ============================================================================
// REGISTER Operations
// ============================================================================

/**
 * 邮箱注册 Schema
 */
export const RegisterByEmailSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码长度至少8位').max(100, '密码太长'),
});

export type RegisterByEmailReq = z.infer<typeof RegisterByEmailSchema>;
export type RegisterByEmailRes = AuthResponseDTO;

/**
 * 手机号注册 Schema
 */
export const RegisterByPhoneSchema = z.object({
  phoneNumber: z.string().min(5, '手机号格式错误'),
  code: z.string().length(6, '验证码必须是6位'),
  nickname: z.string().optional(),
});

export type RegisterByPhoneReq = z.infer<typeof RegisterByPhoneSchema>;
export type RegisterByPhoneRes = AuthResponseDTO;

// ============================================================================
// PASSWORD Operations
// ============================================================================

/**
 * 修改密码 Schema
 */
export const ChangePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, '新密码长度至少8位').max(100),
});

export type ChangePasswordReq = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordRes = void;

/**
 * 重置密码 Schema
 */
export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(100),
});

export type ResetPasswordReq = z.infer<typeof ResetPasswordSchema>;
export type ResetPasswordRes = void;

// ============================================================================
// OAUTH Operations
// ============================================================================

/**
 * OAuth 授权 Schema
 */
export const OAuthAuthorizeSchema = z.object({
  provider: z.enum(['GOOGLE', 'GITHUB', 'MICROSOFT', 'APPLE']),
  code: z.string(),
  state: z.string().optional(),
  redirectUri: z.string().url().optional(),
});

export type OAuthAuthorizeReq = z.infer<typeof OAuthAuthorizeSchema>;
export type OAuthAuthorizeRes = AuthResponseDTO;

// ============================================================================
// SESSION Operations
// ============================================================================

/**
 * 刷新 Token Schema
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenReq = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenRes = AuthResponseDTO;

/**
 * 登出
 */
export type LogoutReq = void;
export type LogoutRes = void;

/**
 * 验证 Token
 */
export type ValidateTokenReq = void;

export interface ValidateTokenRes {
  valid: boolean;
  accountUuid?: string;
  expiresAt?: number;
}
