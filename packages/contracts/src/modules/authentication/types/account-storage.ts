/**
 * Account Storage Types
 * 账号存储相关类型定义
 *
 * 用于多账号管理、快速登录等场景
 */

// ============ Stored Account ============

/**
 * 存储的账号信息
 * 用于快速登录列表展示，不包含敏感信息
 */
export interface StoredAccount {
  /** 账户 UUID */
  uuid: string;
  /** 邮箱 */
  email: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像 URL */
  avatarUrl?: string;
  /** 最后登录时间戳 (ms) */
  lastLoginAt: number;
  /** 是否启用自动登录 */
  autoLogin: boolean;
  /** 是否有有效的 Session（运行时状态） */
  hasValidSession?: boolean;
}

/**
 * 账号存储设置
 */
export interface AccountStoreSettings {
  /** 记住上次登录的账号 */
  rememberLastAccount: boolean;
  /** 最大保存账号数 */
  maxAccounts: number;
}

/**
 * 账号存储数据结构
 * 用于持久化存储
 */
export interface AccountStoreData {
  /** 版本号（用于数据迁移） */
  version: number;
  /** 账号列表 */
  accounts: StoredAccount[];
  /** 最后活跃的账号 UUID */
  lastActiveAccountUuid?: string;
  /** 全局设置 */
  settings: AccountStoreSettings;
}

// ============ Local Account ============

/**
 * 本地账户类型标识
 */
export type LocalAccountType = 'LOCAL';

/**
 * 本地账户
 * 用于离线模式，无需云端认证
 */
export interface LocalAccount {
  /** 账户 UUID */
  uuid: string;
  /** 账户类型 */
  type: LocalAccountType;
  /** 用户名 */
  username: string;
  /** 邮箱（占位，本地模式可为空） */
  email: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像路径/URL */
  avatarPath?: string;
  /** 关联的云账户 UUID（绑定后） */
  cloudAccountUuid?: string;
  /** 是否在线 */
  isOnline: boolean;
  /** 创建时间戳 (ms) */
  createdAt: number;
  /** 更新时间戳 (ms) */
  updatedAt: number;
}

/**
 * 本地账户数据结构
 * 用于持久化存储
 */
export interface LocalAccountData {
  /** 版本号 */
  version: number;
  /** 账户信息 */
  account: LocalAccount;
}
