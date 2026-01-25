/**
 * Subscription Entity - Client Interface
 * 订阅实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * Subscription Client DTO
 */
export interface SubscriptionClientDTO {
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

// ============ 实体接口 ============

export interface SubscriptionClient {
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

  toClientDTO(): SubscriptionClientDTO;
}

export interface SubscriptionClientStatic {
  fromClientDTO(dto: SubscriptionClientDTO): SubscriptionClient;
}
