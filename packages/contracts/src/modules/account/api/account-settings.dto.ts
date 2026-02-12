import { z } from 'zod';
import type { AccountSettingsDTO } from '../value-objects/account-settings';

export type GetAccountSettingsReq = void;
export type GetAccountSettingsRes = AccountSettingsDTO;

export const UpdateAccountSettingsSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  language: z.enum(['zh-CN', 'en-US', 'ja-JP']).optional(),
  timezone: z.string().optional(),
  notificationEnabled: z.boolean().optional(),
});

export type UpdateAccountSettingsReq = z.infer<typeof UpdateAccountSettingsSchema>;
export type UpdateAccountSettingsRes = AccountSettingsDTO;
