import { z } from 'zod';
import { ThemeType, LanguageCode } from '../value-objects';
import type { AccountSettingsDTO } from '../value-objects';

// Zod Enums
const ThemeEnum = z.enum([ThemeType.LIGHT, ThemeType.DARK, ThemeType.SYSTEM]);
// 简单的语言校验，也可以用正则
const LanguageEnum = z.enum([LanguageCode.EN_US, LanguageCode.ZH_CN, LanguageCode.JA_JP]);

// ============ 1. 更新设置 ============
export const UpdateSettingsSchema = z.object({
  theme: ThemeEnum.optional(),
  language: LanguageEnum.optional(),
  timezone: z.string().optional(), // 比如 "Asia/Shanghai"
  notificationEnabled: z.boolean().optional(),
});

export type UpdateSettingsReq = z.infer<typeof UpdateSettingsSchema>;
export type UpdateSettingsRes = AccountSettingsDTO; // 只返回设置部分即可
