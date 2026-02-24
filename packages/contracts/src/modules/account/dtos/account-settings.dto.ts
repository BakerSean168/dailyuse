/**
 * Account Settings DTO
 * 账户设置数据传输对象
 */

export const AccountTheme = {
  Light: 'light',
  Dark: 'dark',
  Auto: 'auto',
} as const;

export type AccountTheme = (typeof AccountTheme)[keyof typeof AccountTheme];

export const AccountPrivacyLevel = {
  Public: 'public',
  Friends: 'friends',
  Private: 'private',
} as const;

export type AccountPrivacyLevel = (typeof AccountPrivacyLevel)[keyof typeof AccountPrivacyLevel];

export interface AccountSettingsDTO {
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  theme: AccountTheme;
  privacyLevel: AccountPrivacyLevel;
  dataRetention: number; // days
}
