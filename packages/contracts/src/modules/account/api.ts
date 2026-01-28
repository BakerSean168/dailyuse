import { z } from 'zod';

// ================== 1. 定义 Schema (运行时校验规则) ==================

// 创建账号的规则
export const CreateAccountSchema = z.object({
  email: z.email("邮箱格式不正确"),
  nickname: z.string().min(2, "昵称至少2个字符").max(20, "昵称太长").optional(),
  password: z.string().min(8, "密码太短") // 假设需要密码
});

// 更新资料的规则
export const UpdateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional()
});

// ================== 2. 导出类型 (静态类型检查) ==================

// 魔法：自动从 Schema 推导出 TypeScript 接口
export type CreateAccountReq = z.infer<typeof CreateAccountSchema>;
export type UpdateProfileReq = z.infer<typeof UpdateProfileSchema>;