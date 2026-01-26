/**
 * Account Entity - Server Interface
 * 账户实体 - 服务端接口
 */

import type { SubscriptionServer, SubscriptionServerDTO } from '../entities/SubscriptionServer';
import type { AccountHistoryServer, AccountHistoryServerDTO } from '../entities/AccountHistoryServer';
import type { AccountClientDTO } from './AccountClient';

// ============ DTO 定义 ============

/**
 * Account Server DTO
 */
export interface AccountServerDTO {
  uuid: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  profile: {
    displayName: string;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone: string;
    language: string;
    dateOfBirth?: number | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  };
  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor?: string | null;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    privacy: {
      profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
      showOnlineStatus: boolean;
      allowSearchByEmail: boolean;
    };
  };
  subscription?: SubscriptionServerDTO | null;
  storage: {
    used: number;
    quota: number;
    quotaType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: number | null;
    loginAttempts: number;
    lockedUntil?: number | null;
  };
  history: AccountHistoryServerDTO[];
  stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: number | null;
    loginCount: number;
  };
  createdAt: number;
  updatedAt: number;
  lastActiveAt?: number | null;
  deletedAt?: number | null;
}

/**
 * Account Persistence DTO
 */
export interface AccountPersistenceDTO {
  uuid: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

  // Flattened profile
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone: string;
  language: string;
  dateOfBirth?: Date | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;

  // Preferences can remain as JSON for now
  preferences: string; // JSON

  // Flattened subscription
  subscriptionId?: string | null;
  subscriptionPlan?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | null;
  subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED' | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  subscriptionRenewalDate?: Date | null;
  subscriptionAutoRenew?: boolean | null;

  // Flattened storage
  storageUsed: number;
  storageQuota: number;
  storageQuotaType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';

  // Flattened security
  twoFactorEnabled: boolean;
  lastPasswordChange?: Date | null;
  loginAttempts: number;
  lockedUntil?: Date | null;

  // History remains as JSON
  history: string; // JSON

  // Flattened stats
  statsTotalGoals: number;
  statsTotalTasks: number;
  statsTotalSchedules: number;
  statsTotalReminders: number;
  statsLastLoginAt?: Date | null;
  statsLoginCount: number;

  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date | null;
  deletedAt?: Date | null;
}

// ============ 实体接口 ============

export interface AccountServer {
  uuid: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  profile: {
    displayName: string;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone: string;
    language: string;
    dateOfBirth?: Date | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  };
  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor?: string | null;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    privacy: {
      profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
      showOnlineStatus: boolean;
      allowSearchByEmail: boolean;
    };
  };
  subscription?: SubscriptionServer | null;
  storage: {
    used: number;
    quota: number;
    quotaType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: Date | null;
    loginAttempts: number;
    lockedUntil?: Date | null;
  };
  history: AccountHistoryServer[];
  stats: {
    totalGoals: number;
    totalTasks: number;
    totalSchedules: number;
    totalReminders: number;
    lastLoginAt?: Date | null;
    loginCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date | null;
  deletedAt?: Date | null;

  // 状态管理
  activate(): void;
  deactivate(): void;
  suspend(reason: string): void;
  softDelete(): void;
  restore(): void;

  // 资料管理
  updateProfile(profile: Partial<AccountServer['profile']>): void;
  updateAvatar(avatarUrl: string): void;
  updateDisplayName(displayName: string): void;

  // 偏好管理
  updatePreferences(preferences: Partial<AccountServer['preferences']>): void;
  updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void;

  // 邮箱与手机
  verifyEmail(): void;
  updateEmail(newEmail: string): void;
  verifyPhone(): void;
  updatePhone(newPhone: string): void;

  // 安全管理
  enableTwoFactor(): void;
  disableTwoFactor(): void;
  changePassword(): void;
  incrementLoginAttempts(): void;
  resetLoginAttempts(): void;
  lockAccount(durationMinutes: number): void;
  unlockAccount(): void;

  // 订阅管理
  updateSubscription(subscription: SubscriptionServer): void;
  cancelSubscription(): void;

  // 存储管理
  checkStorageQuota(requiredBytes: number): boolean;
  updateStorageUsage(bytesUsed: number): void;

  // 历史记录
  addHistory(action: string, details?: any): void;
  getHistory(limit?: number): AccountHistoryServer[];

  // 统计更新
  updateStats(stats: Partial<AccountServer['stats']>): void;
  recordLogin(): void;
  recordActivity(): void;

  toServerDTO(): AccountServerDTO;
  toClientDTO(): AccountClientDTO;
  toPersistenceDTO(): AccountPersistenceDTO;
}

export interface AccountServerStatic {
  create(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): AccountServer;
  fromServerDTO(dto: AccountServerDTO): AccountServer;
  fromPersistenceDTO(dto: AccountPersistenceDTO): AccountServer;
}
