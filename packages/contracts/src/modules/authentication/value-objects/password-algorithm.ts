/**
 * 密码哈希算法
 */
export const PasswordAlgorithm = {
  BCRYPT: 'BCRYPT',
  ARGON2: 'ARGON2',
  SCRYPT: 'SCRYPT',
} as const;
export type PasswordAlgorithm = (typeof PasswordAlgorithm)[keyof typeof PasswordAlgorithm];
