import { AggregateRoot } from '@dailyuse/utils';
import {
  QuotaResetPeriod,
} from '@dailyuse/contracts/ai';
import type {
  AIUsageQuotaClientDTO,
  AIUsageQuotaPersistenceDTO,
  AIUsageQuotaServer as IAIUsageQuotaServer,
  AIUsageQuotaServerDTO,
} from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiUsageQuotaId } from '@dailyuse/domain-shared/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';


export class AIUsageQuotaServer extends AggregateRoot<AiUsageQuotaId> implements IAIUsageQuotaServer {
  private _identityId: IIdentityId;
  private _quotaLimit: number;
  private _currentUsage: number;
  private _resetPeriod: QuotaResetPeriod;
  private _lastResetAt: Date;
  private _nextResetAt: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    id?: string;
    identityId: string;
    quotaLimit: number;
    currentUsage: number;
    resetPeriod: QuotaResetPeriod;
    lastResetAt: Date;
    nextResetAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(AiUsageQuotaId.of(params.id ?? AiUsageQuotaId.generate()));
    this._identityId = IdentityId.of(params.identityId);
    this._quotaLimit = params.quotaLimit;
    this._currentUsage = params.currentUsage;
    this._resetPeriod = params.resetPeriod;
    this._lastResetAt = params.lastResetAt;
    this._nextResetAt = params.nextResetAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  public get identityId(): IIdentityId {
    return this._identityId;
  }

  public get quotaLimit(): number {
    return this._quotaLimit;
  }

  public get currentUsage(): number {
    return this._currentUsage;
  }

  public get resetPeriod(): QuotaResetPeriod {
    return this._resetPeriod;
  }

  public get lastResetAt(): Date {
    return this._lastResetAt;
  }

  public get nextResetAt(): Date {
    return this._nextResetAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public static create(params: {
    identityId: string;
    quotaLimit: number;
    resetPeriod: QuotaResetPeriod;
  }): AIUsageQuotaServer {
    const now = new Date();
    const instance = new AIUsageQuotaServer({
      identityId: params.identityId,
      quotaLimit: params.quotaLimit,
      currentUsage: 0,
      resetPeriod: params.resetPeriod,
      lastResetAt: now,
      nextResetAt: now, // Will be calculated
      createdAt: now,
      updatedAt: now,
    });
    instance._nextResetAt = instance.calculateNextResetDate();

    instance.addDomainEvent('ai.quota.created', {
      identityId: instance._identityId,
      quota: instance.toServerDTO(),
    });

    return instance;
  }

  public static fromServerDTO(dto: AIUsageQuotaServerDTO): AIUsageQuotaServer {
    return new AIUsageQuotaServer({
      id: dto.id,
      identityId: dto.identityId,
      quotaLimit: dto.quotaLimit,
      currentUsage: dto.currentUsage,
      resetPeriod: dto.resetPeriod,
      lastResetAt: new Date(dto.lastResetAt),
      nextResetAt: new Date(dto.nextResetAt),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  public static fromPersistenceDTO(dto: AIUsageQuotaPersistenceDTO): AIUsageQuotaServer {
    return new AIUsageQuotaServer({
      id: dto.id,
      identityId: dto.identityId,
      quotaLimit: dto.quotaLimit,
      currentUsage: dto.currentUsage,
      resetPeriod: dto.resetPeriod,
      lastResetAt: dto.lastResetAt,
      nextResetAt: dto.nextResetAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public consume(amount: number): boolean {
    if (this.shouldReset()) {
      this.reset();
    }

    if (!this.canConsume(amount)) {
      return false;
    }

    this._currentUsage += amount;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.quota.consumed', {
      identityId: this._identityId,
      quotaId: this.id,
      amount,
      currentUsage: this._currentUsage,
    });

    return true;
  }

  public canConsume(amount: number): boolean {
    if (this.shouldReset()) {
      // If it should reset, we simulate a reset for the check
      return amount <= this._quotaLimit;
    }
    return this._currentUsage + amount <= this._quotaLimit;
  }

  public getRemainingQuota(): number {
    if (this.shouldReset()) {
      return this._quotaLimit;
    }
    return Math.max(0, this._quotaLimit - this._currentUsage);
  }

  public isExceeded(): boolean {
    return this.getRemainingQuota() <= 0;
  }

  public shouldReset(): boolean {
    return Date.now() >= this._nextResetAt.getTime();
  }

  public reset(): void {
    this._currentUsage = 0;
    const now = new Date();
    this._lastResetAt = now;
    this._nextResetAt = this.calculateNextResetDate();
    this._updatedAt = now;

    this.addDomainEvent('ai.quota.reset', {
      identityId: this._identityId,
      quotaId: this.id,
      nextResetAt: this._nextResetAt.getTime(),
    });
  }

  public updateLimit(newLimit: number): void {
    const oldLimit = this._quotaLimit;
    this._quotaLimit = newLimit;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.quota.limit_updated', {
      quotaId: this.id,
      oldLimit,
      newLimit,
    });
  }

  public calculateNextResetDate(): Date {
    const now = new Date();
    const resetDate = new Date(now);

    switch (this._resetPeriod) {
      case QuotaResetPeriod.Daily:
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.Weekly:
        // Reset on next Monday
        const day = now.getDay();
        const diff = day === 0 ? 1 : 8 - day; // If Sunday (0), add 1. If Mon-Sat, add 8-day.
        resetDate.setDate(now.getDate() + diff);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.Monthly:
        resetDate.setMonth(now.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to daily if unknown
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
    }
    return resetDate;
  }

  public getUsagePercentage(): number {
    if (this._quotaLimit === 0) return 100;
    return (this._currentUsage / this._quotaLimit) * 100;
  }

  public toServerDTO(): AIUsageQuotaServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt.getTime(),
      nextResetAt: this._nextResetAt.getTime(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): AIUsageQuotaClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt.getTime(),
      nextResetAt: this._nextResetAt.getTime(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      remainingQuota: this.getRemainingQuota(),
      usagePercentage: this.getUsagePercentage(),
      isExceeded: this.isExceeded(),
      formattedResetPeriod: this._resetPeriod,
    };
  }

  public toPersistenceDTO(): AIUsageQuotaPersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt,
      nextResetAt: this._nextResetAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
