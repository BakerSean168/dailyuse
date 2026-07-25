/**
 * HashedPassword Value Object
 * 哈希密码值对象 - Server 端持有
 *
 * Residual 855: HashedPasswordDTO dual retired — sole HashedPassword interface + type alias.
 */

import type { PasswordAlgorithm } from './password-algorithm';

// Residual 855: sole HashedPassword body (server-held sensitive VO).
export interface HashedPassword {
  /**
   * 哈希值
   */
  hash: string;

  /**
   * 盐值
   */
  salt: string;

  /**
   * 哈希算法
   */
  algorithm: PasswordAlgorithm;

  /**
   * 创建时间戳
   */
  createdAt: number;
}

// Residual 855: HashedPasswordDTO dual retired — DTO is the HashedPassword shape.
export type HashedPasswordDTO = HashedPassword;
