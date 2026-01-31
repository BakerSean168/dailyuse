import { z } from 'zod';
import type { AuthResponseDTO } from '../dtos';

// ============ 1. 发送短信验证码 ============
// 这个接口通常用于 登录、注册、绑定、重置密码 等多种场景
export const SendSmsCodeSchema = z.object({
  phoneNumber: z.string().min(5, '手机号格式错误'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'BIND', 'RESET_PASSWORD']),
});

export type SendSmsCodeReq = z.infer<typeof SendSmsCodeSchema>;
export type SendSmsCodeRes = void; // 或 { success: true, cooldown: 60 }

// ============ 2. 邮箱密码登录 ============
export const LoginByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().default(false).optional(), // 决定 RefreshToken 的有效期
});

export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;
export type LoginByEmailRes = AuthResponseDTO;

// ============ 3. 手机验证码登录 ============
export const LoginByPhoneSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6, '验证码错误'),
});

export type LoginByPhoneReq = z.infer<typeof LoginByPhoneSchema>;
export type LoginByPhoneRes = AuthResponseDTO;
