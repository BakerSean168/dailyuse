import { z } from 'zod';
import type { AccountSettingsDTO } from '../value-objects/account-settings';
import { ThemeType } from '../value-objects/theme-type';
import { LanguageCode } from '../value-objects/language-code';

export type GetAccountSettingsReq = void;
export type GetAccountSettingsRes = AccountSettingsDTO;

export const UpdateAccountSettingsSchema = z.object({
  theme: z.nativeEnum(ThemeType).optional(),
  language: z.nativeEnum(LanguageCode).optional(),
  timezone: z.string().optional(),
  notificationEnabled: z.boolean().optional(),
});

export type UpdateAccountSettingsReq = z.infer<typeof UpdateAccountSettingsSchema>;
export type UpdateAccountSettingsRes = AccountSettingsDTO;
