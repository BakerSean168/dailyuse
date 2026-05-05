/**
 * 偏好设置
 */
import type { ThemeType } from './theme-type';
import type { LanguageCode } from './language-code';

export interface AccountSettings {
  theme: ThemeType;
  language: LanguageCode;
  timezone: string;
  notificationEnabled: boolean;
}

export interface AccountSettingsDTO {
  theme: ThemeType;
  language: LanguageCode;
  timezone: string;
  notificationEnabled: boolean;
}
