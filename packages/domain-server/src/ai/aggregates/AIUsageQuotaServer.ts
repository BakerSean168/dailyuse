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
import { AiUsageQuotaId } from '@dailyuse/domain-shared/ai';


export class AIUsageQuotaServer extends AggregateRoot<AiUsageQuotaId> implements IAIUsageQuotaServer {
  private _accountUuid: string;
  private _quotaLimit: number;
  private _currentUsage: number;
  private _resetPeriod: QuotaResetPeriod;
  private _lastResetAt: number;
  private _nextResetAt: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    quotaLimit: number;
    currentUsage: number;
    resetPeriod: QuotaResetPeriod;
    lastResetAt: number;
    nextResetAt: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(AiUsageQuotaId.of(params.uuid ?? AiUsageQuotaId.generate()));
    this._accountUuid = params.accountUuid;
    this._quotaLimit = params.quotaLimit;
    this._currentUsage = params.currentUsage;
    this._resetPeriod = params.resetPeriod;
    this._lastResetAt = params.lastResetAt;
    this._nextResetAt = params.nextResetAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  public get uuid(): string {
    return String(this.id);
  }

  public get accountUuid(): string {
    return this._accountUuid;
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

  public get lastResetAt(): number {
    return this._lastResetAt;
  }

  public get nextResetAt(): number {
    return this._nextResetAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public static create(params: {
    accountUuid: string;
    quotaLimit: number;
    resetPeriod: QuotaResetPeriod;
  }): AIUsageQuotaServer {
    const now = new Date();
    const nowTime = now.getTime();
    const instance = new AIUsageQuotaServer({
      accountUuid: params.accountUuid,
      quotaLimit: params.quotaLimit,
      currentUsage: 0,
      resetPeriod: params.resetPeriod,
      lastResetAt: nowTime,
      nextResetAt: nowTime, // Will be calculated
      createdAt: now,
      updatedAt: now,
    });
    instance._nextResetAt = instance.calculateNextResetTime();

    instance.addDomainEvent('ai.quota.created', {
      accountUuid: params.accountUuid,
      quota: instance.toServerDTO(),
    });

    return instance;
  }

  public static fromServerDTO(dto: AIUsageQuotaServerDTO): AIUsageQuotaServer {
    return new AIUsageQuotaServer({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      quotaLimit: dto.quotaLimit,
      currentUsage: dto.currentUsage,
      resetPeriod: dto.resetPeriod,
      lastResetAt: dto.lastResetAt,
      nextResetAt: dto.nextResetAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  public static fromPersistenceDTO(dto: AIUsageQuotaPersistenceDTO): AIUsageQuotaServer {
    return new AIUsageQuotaServer({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      quotaLimit: dto.quotaLimit,
      currentUsage: dto.currentUsage,
      resetPeriod: dto.resetPeriod,
      lastResetAt: dto.lastResetAt,
      nextResetAt: dto.nextResetAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
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
      accountUuid: this._accountUuid,
      quotaUuid: this.uuid,
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
    return Date.now() >= this._nextResetAt;
  }

  public reset(): void {
    this._currentUsage = 0;
    const now = new Date();
    this._lastResetAt = now.getTime();
    this._nextResetAt = this.calculateNextResetTime();
    this._updatedAt = now;

    this.addDomainEvent('ai.quota.reset', {
      accountUuid: this._accountUuid,
      quotaUuid: this.uuid,
      nextResetAt: this._nextResetAt,
    });
  }

  public updateLimit(newLimit: number): void {
    const oldLimit = this._quotaLimit;
    this._quotaLimit = newLimit;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.quota.limit_updated', {
      accountUuid: this._accountUuid,
      quotaUuid: this.uuid,
      oldLimit,
      newLimit,
    });
  }

  public calculateNextResetTime(): number {
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
    return resetDate.getTime();
  }

  public getUsagePercentage(): number {
    if (this._quotaLimit === 0) return 100;
    return (this._currentUsage / this._quotaLimit) * 100;
  }

  public toServerDTO(): AIUsageQuotaServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt,
      nextResetAt: this._nextResetAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): AIUsageQuotaClientDTO {
    return {
      id: this.uuid,
      identityId: this._accountUuid,
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt,
      nextResetAt: this._nextResetAt,
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
      uuid: this.uuid,
      accountUuid: this._accountUuid,
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
