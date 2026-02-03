/**
 * Authentication - Register Operations
 * 
 * 所有与注册相关的API定义：邮箱注册、手机注册
 */

import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

// ============================================================================
// Email Registration
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

// ============================================================================
// Phone Registration
// ============================================================================

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
