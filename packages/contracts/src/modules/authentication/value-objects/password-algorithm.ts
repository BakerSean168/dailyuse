/**
 * 密码哈希算法
 */
export const PasswordAlgorithm = {
  Bcrypt: 'Bcrypt',
  Argon2: 'Argon2',
  Scrypt: 'Scrypt',
} as const;
export type PasswordAlgorithm = (typeof PasswordAlgorithm)[keyof typeof PasswordAlgorithm];
