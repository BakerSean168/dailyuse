/**
 * 认证身份状态
 */
export const AuthIdentityStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED', // 多次尝试失败锁定
  DISABLED: 'DISABLED', // 管理员禁用
  UNVERIFIED: 'UNVERIFIED' // 待验证
} as const;
export type AuthIdentityStatus = (typeof AuthIdentityStatus)[keyof typeof AuthIdentityStatus];
