/**
 * Authentication - Password Operations
 * 
 * 所有与密码管理相关的API定义：修改密码、忘记密码、重置密码
 */

import { z } from 'zod';

// ============================================================================
// Change Password
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

// ============================================================================
// Forgot Password
// ============================================================================

/**
 * 忘记密码 - 发送重置邮件 Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordReq = z.infer<typeof ForgotPasswordSchema>;
export type ForgotPasswordRes = void;

// ============================================================================
// Reset Password
// ============================================================================

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
