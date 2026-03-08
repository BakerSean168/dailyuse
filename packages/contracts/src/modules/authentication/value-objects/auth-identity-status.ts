/**
 * 认证身份状态
 */
export const AuthIdentityStatus = {
  Active: 'Active',
  Locked: 'Locked', // 多次尝试失败锁定
  Disabled: 'Disabled', // 管理员禁用
  Unverified: 'Unverified', // 待验证
} as const;
export type AuthIdentityStatus = (typeof AuthIdentityStatus)[keyof typeof AuthIdentityStatus];
