/**
 * Account Settings DTO
 * 账户设置数据传输对象
 */

export interface AccountSettingsDTO {
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  privacyLevel: 'public' | 'friends' | 'private';
  dataRetention: number; // days
}
