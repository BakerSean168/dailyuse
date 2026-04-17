/**
 * Authentication - Login Operations
 *
 * 所有与登录相关的API定义：邮箱登录、手机登录、短信验证码
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos/auth-response';

// ============================================================================
// SMS Verification Code
// ============================================================================

/**
 * 发送短信验证码 Schema
 */
export const SendSmsCodeSchema = z.object({
  phoneNumber: z.string().min(5, '手机号格式错误'),
  purpose: z.enum(['Login', 'Register', 'Bind', 'ResetPassword']),
});

export type SendSmsCodeReq = z.infer<typeof SendSmsCodeSchema>;
export type SendSmsCodeRes = void;

// ============================================================================
// Email Login
// ============================================================================

/**
 * 邮箱密码登录 Schema
 */
export const LoginByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberPassword: z.boolean().default(false).optional(),
  autoLogin: z.boolean().default(false).optional(),
});

export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;
export type LoginByEmailRes = AuthResponseDTO;

// ============================================================================
// Phone Login
// ============================================================================

/**
 * 手机验证码登录 Schema
 */
export const LoginByPhoneSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6, '验证码错误'),
});

export type LoginByPhoneReq = z.infer<typeof LoginByPhoneSchema>;
export type LoginByPhoneRes = AuthResponseDTO;
