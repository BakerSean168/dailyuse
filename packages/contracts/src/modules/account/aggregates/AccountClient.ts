/**
 * Account Entity - Client Interface
 * 账户实体 - 客户端接口
 */

import type { SubscriptionClient, SubscriptionClientDTO } from '../entities/SubscriptionClient';
import type {
  AccountHistoryClient,
  AccountHistoryClientDTO,
} from '../entities/AccountHistoryClient';

// ============ DTO 定义 ============

/**
 * Account Client DTO
 */
export interface AccountClientDTO {
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
  subscription?: SubscriptionClientDTO | null;
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
  history: AccountHistoryClientDTO[];
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

// ============ 实体接口 ============

export interface AccountClient {
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
  subscription?: SubscriptionClient | null;
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
  history: AccountHistoryClient[];
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

  toClientDTO(): AccountClientDTO;
}

export interface AccountClientStatic {
  fromClientDTO(dto: AccountClientDTO): AccountClient;
}
