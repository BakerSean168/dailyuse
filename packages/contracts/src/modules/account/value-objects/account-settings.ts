/**
 * 偏好设置
 */
import type { ThemeType } from "./theme-type";

export interface AccountSettings {
  theme: ThemeType;
  language: string;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}

//  ============ DTO 定义 ============

export interface AccountSettingsDTO {
  theme: ThemeType;
  language: string;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}

export interface AccountSettingsPersistenceDTO {
  theme: ThemeType;
  language: string;     // 'zh-CN', 'en-US'
  timezone: string;     // 'Asia/Shanghai'
  notificationEnabled: boolean;
}