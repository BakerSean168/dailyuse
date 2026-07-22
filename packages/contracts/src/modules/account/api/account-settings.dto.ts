import { z } from 'zod';
import type { AccountSettingsDTO } from '../value-objects/account-settings';
import { ThemeType } from '../value-objects/theme-type';
import { LanguageCode } from '../value-objects/language-code';

export type GetAccountSettingsReq = void;

export const UpdateAccountSettingsSchema = z.object({
  theme: z.enum(ThemeType).optional(),
  language: z.enum(LanguageCode).optional(),
  timezone: z.string().optional(),
  notificationEnabled: z.boolean().optional(),
});

export type UpdateAccountSettingsReq = z.infer<typeof UpdateAccountSettingsSchema>;
export type UpdateAccountSettingsRes = AccountSettingsDTO;
