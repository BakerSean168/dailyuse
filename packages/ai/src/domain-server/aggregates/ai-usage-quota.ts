import { AggregateRoot } from '@dailyuse/utils';
import {
  QuotaResetPeriod,
} from '@dailyuse/contracts/ai';
import type {
  AIUsageQuotaClientDTO,
  AIUsageQuotaServerDTO,
} from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiUsageQuotaId } from '../../domain-shared/value-objects/ai-usage-quota-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export interface AIUsageQuotaState {
  id: AiUsageQuotaId;
  identityId: IIdentityId;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: Date;
  nextResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AIUsageQuota extends AggregateRoot<AiUsageQuotaId> {
  private _props: Omit<AIUsageQuotaState, 'id'>;

  private constructor(state: AIUsageQuotaState) {
    super(state.id);
    const { id: _, ...rest } = state;
    this._props = { ...rest };
  }

  public get identityId(): IIdentityId {
    return this._props.identityId;
  }

  public get quotaLimit(): number {
    return this._props.quotaLimit;
  }

  public get currentUsage(): number {
    return this._props.currentUsage;
  }

  public get resetPeriod(): QuotaResetPeriod {
    return this._props.resetPeriod;
  }

  public get lastResetAt(): Date {
    return this._props.lastResetAt;
  }

  public get nextResetAt(): Date {
    return this._props.nextResetAt;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public static create(params: {
    identityId: string;
    quotaLimit: number;
    resetPeriod: QuotaResetPeriod;
  }): AIUsageQuota {
    const now = new Date();
    const instance = new AIUsageQuota({
      id: AiUsageQuotaId.generate(),
      identityId: IdentityId.of(params.identityId),
      quotaLimit: params.quotaLimit,
      currentUsage: 0,
      resetPeriod: params.resetPeriod,
      lastResetAt: now,
      nextResetAt: now, // Will be calculated
      createdAt: now,
      updatedAt: now,
    });
    instance._props.nextResetAt = instance.calculateNextResetDate();

    instance.addDomainEvent('ai.quota.created', {
      identityId: instance._props.identityId,
      quota: instance.toServerDTO(),
    });

    return instance;
  }

  public static load(state: AIUsageQuotaState): AIUsageQuota {
    return new AIUsageQuota(state);
  }

  public consume(amount: number): boolean {
    if (this.shouldReset()) {
      this.reset();
    }

    if (!this.canConsume(amount)) {
      return false;
    }

    this._props.currentUsage += amount;
    this._props.updatedAt = new Date();

    this.addDomainEvent('ai.quota.consumed', {
      identityId: this._props.identityId,
      quotaId: this.id,
      amount,
      currentUsage: this._props.currentUsage,
    });

    return true;
  }

  public canConsume(amount: number): boolean {
    if (this.shouldReset()) {
      return amount <= this._props.quotaLimit;
    }
    return this._props.currentUsage + amount <= this._props.quotaLimit;
  }

  public getRemainingQuota(): number {
    if (this.shouldReset()) {
      return this._props.quotaLimit;
    }
    return Math.max(0, this._props.quotaLimit - this._props.currentUsage);
  }

  public isExceeded(): boolean {
    return this.getRemainingQuota() <= 0;
  }

  public shouldReset(): boolean {
    return Date.now() >= this._props.nextResetAt.getTime();
  }

  public reset(): void {
    this._props.currentUsage = 0;
    const now = new Date();
    this._props.lastResetAt = now;
    this._props.nextResetAt = this.calculateNextResetDate();
    this._props.updatedAt = now;

    this.addDomainEvent('ai.quota.reset', {
      identityId: this._props.identityId,
      quotaId: this.id,
      nextResetAt: this._props.nextResetAt.getTime(),
    });
  }

  public updateLimit(newLimit: number): void {
    const oldLimit = this._props.quotaLimit;
    this._props.quotaLimit = newLimit;
    this._props.updatedAt = new Date();

    this.addDomainEvent('ai.quota.limit_updated', {
      quotaId: this.id,
      oldLimit,
      newLimit,
    });
  }

  public calculateNextResetDate(): Date {
    const now = new Date();
    const resetDate = new Date(now);

    switch (this._props.resetPeriod) {
      case QuotaResetPeriod.Daily:
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.Weekly:
        // Reset on next Monday
        const day = now.getDay();
        const diff = day === 0 ? 1 : 8 - day;
        resetDate.setDate(now.getDate() + diff);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.Monthly:
        resetDate.setMonth(now.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      default:
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
    }
    return resetDate;
  }

  public getUsagePercentage(): number {
    if (this._props.quotaLimit === 0) return 100;
    return (this._props.currentUsage / this._props.quotaLimit) * 100;
  }

  public toServerDTO(): AIUsageQuotaServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      quotaLimit: this._props.quotaLimit,
      currentUsage: this._props.currentUsage,
      resetPeriod: this._props.resetPeriod,
      lastResetAt: this._props.lastResetAt.getTime(),
      nextResetAt: this._props.nextResetAt.getTime(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  public toClientDTO(): AIUsageQuotaClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      quotaLimit: this._props.quotaLimit,
      currentUsage: this._props.currentUsage,
      resetPeriod: this._props.resetPeriod,
      lastResetAt: this._props.lastResetAt.getTime(),
      nextResetAt: this._props.nextResetAt.getTime(),
      version: 1,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: null,
      remainingQuota: this.getRemainingQuota(),
      usagePercentage: this.getUsagePercentage(),
      isExceeded: this.isExceeded(),
      formattedResetPeriod: this._props.resetPeriod,
    };
  }
}
