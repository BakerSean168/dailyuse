/**
 * Auth Status Types
 * 认证状态相关类型定义
 *
 * 用于跨端展示认证状态、用户信息等
 */

import type { DeviceType, TwoFactorMethod } from '../enums';

// ============ User Info ============

/**
 * 用户信息
 * 用于 UI 展示
 */
export interface UserInfo {
  /** 用户 UUID */
  uuid: string;
  /** 用户名 */
  username?: string;
  /** 邮箱 */
  email?: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像 URL */
  avatarUrl?: string;
}

// ============ Session Info ============

/**
 * 会话信息
 * 用于会话列表展示
 */
export interface SessionInfo {
  /** 会话 UUID */
  uuid: string;
  /** 设备名称 */
  deviceName: string;
  /** 设备类型 */
  deviceType: DeviceType | string;
  /** IP 地址 */
  ipAddress: string;
  /** 创建时间 (ISO string) */
  createdAt: string;
  /** 最后活跃时间 (ISO string) */
  lastActiveAt: string;
  /** 过期时间 (ISO string) */
  expiresAt: string;
  /** 是否为当前会话 */
  isCurrentSession: boolean;
}

// ============ Device Info ============

/**
 * 设备信息
 * 用于设备列表展示
 */
export interface DeviceInfo {
  /** 设备 UUID */
  uuid: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: DeviceType | string;
  /** 操作系统 */
  os?: string;
  /** 设备指纹 */
  fingerprint?: string;
  /** 是否可信设备 */
  isTrusted?: boolean;
}

// ============ 2FA Status ============

/**
 * 双因素认证状态
 */
export interface TwoFactorStatus {
  /** 是否已启用 */
  enabled: boolean;
  /** 启用的方法 */
  method: TwoFactorMethod | string | null;
  /** 恢复码数量 */
  recoveryCodesRemaining?: number;
}

// ============ API Key Info ============

/**
 * API Key 信息
 * 用于 API Key 列表展示
 */
export interface ApiKeyInfo {
  /** Key UUID */
  uuid: string;
  /** Key 名称 */
  name: string;
  /** 权限范围 */
  scopes: string[];
  /** 创建时间 (ISO string) */
  createdAt: string;
  /** 最后使用时间 (ISO string) */
  lastUsedAt?: string;
  /** 过期时间 (ISO string) */
  expiresAt?: string;
}

// ============ Auth Status ============

/**
 * 认证模式
 * - ONLINE: 在线模式，已登录云账户
 * - OFFLINE: 离线模式，使用缓存的云账户数据
 * - LOCAL: 本地模式，纯离线，无云账户
 */
export type AuthMode = 'ONLINE' | 'OFFLINE' | 'LOCAL';

/**
 * 完整认证状态
 * 用于获取当前认证状态的响应
 */
export interface AuthStatus {
  /** 是否已认证 */
  authenticated: boolean;
  /** 认证模式 */
  mode: AuthMode;
  /** 用户信息 */
  user: UserInfo | null;
  /** 当前会话信息 */
  session: SessionInfo | null;
  /** Token 状态 */
  tokenStatus: TokenStatusInfo | null;
}

/**
 * Token 状态信息
 * 用于展示 Token 状态
 */
export interface TokenStatusInfo {
  /** 是否有有效的 Token */
  hasValidToken: boolean;
  /** Access Token 是否过期 */
  isAccessTokenExpired: boolean;
  /** Refresh Token 是否过期 */
  isRefreshTokenExpired: boolean;
  /** 是否需要刷新 */
  shouldRefresh: boolean;
  /** Access Token 剩余时间（毫秒） */
  accessTokenRemainingMs: number;
  /** Refresh Token 剩余时间（毫秒） */
  refreshTokenRemainingMs: number;
}

// ============ Login Credentials ============

/**
 * 登录凭据
 * 用于前端提交登录表单
 */
export interface LoginCredentials {
  /** 邮箱或用户名 */
  identifier: string;
  /** 密码 */
  password: string;
  /** 记住登录 */
  rememberMe?: boolean;
  /** 2FA 验证码（如果需要） */
  twoFactorCode?: string;
}

/**
 * 简化的登录凭据（邮箱登录）
 * 兼容旧代码
 */
export interface EmailLoginCredentials {
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 记住登录 */
  rememberMe?: boolean;
}
