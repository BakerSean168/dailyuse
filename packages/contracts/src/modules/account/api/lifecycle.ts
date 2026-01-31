import { z } from 'zod';

// ============ 1. 检查属性可用性 (如昵称是否重复) ============
export const CheckAvailabilitySchema = z.object({
  type: z.enum(['NICKNAME', 'EMAIL']),
  value: z.string(),
});

export type CheckAvailabilityReq = z.infer<typeof CheckAvailabilitySchema>;
export interface CheckAvailabilityRes {
  available: boolean;
  suggestion?: string; // 如果被占用，给个建议
}

// ============ 2. 注销账号 ============
export const CloseAccountSchema = z.object({
  reason: z.string().min(1, "请填写注销原因"),
  feedback: z.string().optional(),
});

export type CloseAccountReq = z.infer<typeof CloseAccountSchema>;
export type CloseAccountRes = void;
