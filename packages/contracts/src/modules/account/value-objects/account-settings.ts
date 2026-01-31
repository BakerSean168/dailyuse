/**
 * 偏好设置
 */
import type { ThemeType } from "./theme-type";
import type { LanguageCode } from "./language-code";

export interface AccountSettings {
  theme: ThemeType;
  language: LanguageCode;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}

//  ============ DTO 定义 ============

export interface AccountSettingsDTO {
  theme: ThemeType;
  language: LanguageCode;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}

export interface AccountSettingsPersistenceDTO {
  theme: ThemeType;
  language: LanguageCode;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}
