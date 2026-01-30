import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

// ============ 1. 邮箱注册 ============
export const RegisterByEmailSchema = z.object({
  email: z.email('邮箱格式不正确'),
  password: z.string().min(8, '密码长度至少8位').max(100, '密码太长'),
});

export type RegisterByEmailReq = z.infer<typeof RegisterByEmailSchema>;
export type RegisterByEmailRes = AuthResponseDTO; // 注册成功通常直接下发 Token

// ============ 2. 手机号注册 (通常结合验证码) ============
export const RegisterByPhoneSchema = z.object({
  phoneNumber: z.string().min(5, '手机号格式错误'), // 建议配合正则
  code: z.string().length(6, '验证码必须是6位'),
  nickname: z.string().optional(),
});

export type RegisterByPhoneReq = z.infer<typeof RegisterByPhoneSchema>;
export type RegisterByPhoneRes = AuthResponseDTO;