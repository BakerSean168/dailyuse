/**
 * 设置作用域
 */
export const SettingScope = {
  System: 'System',
  User: 'User',
  Device: 'Device',
} as const;

export type SettingScope = (typeof SettingScope)[keyof typeof SettingScope];
