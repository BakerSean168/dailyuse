/**
 * HashedPassword Value Object
 * 哈希密码值对象 - Server 端持有
 */

import type { PasswordAlgorithm } from './password-algorithm';

// ============ 值对象接口 ============

/**
 * 哈希密码 (Server 端才能持有)
 * 这是一个敏感的值对象，不应该序列化到客户端
 */
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

// ============ DTO 定义 ============

/**
 * 传输 DTO（客户端交互）
 */
export interface HashedPasswordDTO {
  hash: string;
  salt: string;
  algorithm: PasswordAlgorithm;
  createdAt: number;
}

// ============ Persistence DTO ============

/**
 * 持久化 DTO（数据库存储）
 */
export interface HashedPasswordPersistenceDTO {
  hash: string;
  salt: string;
  algorithm: PasswordAlgorithm;
  createdAt: Date;
}