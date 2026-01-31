import { z } from 'zod';

// ============ 1. 修改密码 (需登录) ============
export const ChangePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, '新密码长度至少8位'),
});

export type ChangePasswordReq = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordRes = void;

// ============ 2. 忘记密码 (申请重置邮件) ============
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordReq = z.infer<typeof ForgotPasswordSchema>;
export type ForgotPasswordRes = void; 
// 注意：为了安全，即使邮箱不存在，接口也应返回成功，防止枚举攻击

// ============ 3. 重置密码 (提交 Token 和新密码) ============
export const ResetPasswordSchema = z.object({
  token: z.string(), // 邮件链接中的 verify token
  newPassword: z.string().min(8, '新密码长度至少8位'),
});

export type ResetPasswordReq = z.infer<typeof ResetPasswordSchema>;
export type ResetPasswordRes = void;
