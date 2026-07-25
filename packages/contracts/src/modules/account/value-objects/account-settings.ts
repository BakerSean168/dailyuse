/**
 * 偏好设置
 *
 * Residual 853: AccountSettingsDTO dual retired — sole AccountSettings interface + type alias.
 */
import type { ThemeType } from './theme-type';
import type { LanguageCode } from './language-code';

// Residual 853: sole AccountSettings body.
export interface AccountSettings {
  theme: ThemeType;
  language: LanguageCode;
  timezone: string;
  notificationEnabled: boolean;
}

// Residual 853: AccountSettingsDTO dual retired — DTO is the AccountSettings shape.
export type AccountSettingsDTO = AccountSettings;
