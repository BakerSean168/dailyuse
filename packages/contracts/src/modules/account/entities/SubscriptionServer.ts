/**
 * Subscription Entity - Server Interface
 * 订阅实体 - 服务端接口
 */

import type { SubscriptionClientDTO } from './SubscriptionClient';

// ============ DTO 定义 ============

/**
 * Subscription Server DTO
 */
export interface SubscriptionServerDTO {
  uuid: string;
  accountUuid: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  startDate: number;
  endDate?: number | null;
  renewalDate?: number | null;
  autoRenew: boolean;
  paymentMethod?: string | null;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  amount?: number | null;
  currency?: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Subscription Persistence DTO
 */
export interface SubscriptionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  startDate: Date;
  endDate?: Date | null;
  renewalDate?: Date | null;
  autoRenew: boolean;
  paymentMethod?: string | null;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  amount?: number | null;
  currency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

export interface SubscriptionServer {
  uuid: string;
  accountUuid: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  startDate: Date;
  endDate?: Date | null;
  renewalDate?: Date | null;
  autoRenew: boolean;
  paymentMethod?: string | null;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  amount?: number | null;
  currency?: string | null;
  createdAt: Date;
  updatedAt: Date;

  isActive(): boolean;
  isExpired(): boolean;
  cancel(): void;
  renew(): void;
  upgrade(plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'): void;
  downgrade(plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'): void;

  toServerDTO(): SubscriptionServerDTO;
  toClientDTO(): SubscriptionClientDTO;
  toPersistenceDTO(): SubscriptionPersistenceDTO;
}

export interface SubscriptionServerStatic {
  create(params: {
    accountUuid: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  }): SubscriptionServer;
  fromServerDTO(dto: SubscriptionServerDTO): SubscriptionServer;
  fromPersistenceDTO(dto: SubscriptionPersistenceDTO): SubscriptionServer;
}
