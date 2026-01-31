import { z } from 'zod';
import { GenderType } from '../value-objects'; // 引用常量值
import type { AccountClientDTO } from '../aggregates';

// Zod Enum 定义 (用于校验)
const GenderEnum = z.enum([GenderType.MALE, GenderType.FEMALE, GenderType.OTHER, GenderType.PREFER_NOT_TO_SAY]);

// ============ 1. 获取我的资料 ============
export type GetMyProfileReq = void;
export type GetMyProfileRes = AccountClientDTO;

// ============ 2. 获取他人公开资料 ============
export const GetPublicProfileSchema = z.object({
  accountId: z.string(),
});
export type GetPublicProfileReq = z.infer<typeof GetPublicProfileSchema>;
// 公开资料通常是 AccountClientDTO 的子集 (脱敏)
export interface PublicProfileRes {
  id: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  gender: GenderType;
}

// ============ 3. 更新资料 ============
export const UpdateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  realName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional(),
  gender: GenderEnum.optional(),
  birthday: z.number().int().optional(), // 接收时间戳
});

export type UpdateProfileReq = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileRes = AccountClientDTO; // 返回更新后的完整对象
