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


export class AIUsageQuotaServer extends AggregateRoot implements IAIUsageQuotaServer {
  private _accountUuid: string;
  private _quotaLimit: number;
  private _currentUsage: number;
  private _resetPeriod: QuotaResetPeriod;
  private _lastResetAt: Date;
  private _nextResetAt: Date;
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
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._quotaLimit = params.quotaLimit;
    this._currentUsage = params.currentUsage;
    this._resetPeriod = params.resetPeriod;
    this._lastResetAt = params.lastResetAt;
    this._nextResetAt = params.nextResetAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  public override get uuid(): string {
    return this._uuid;
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
    accountUuid: string;
    quotaLimit: number;
    resetPeriod: QuotaResetPeriod;
  }): AIUsageQuotaServer {
    const now = Date.now();
    const instance = new AIUsageQuotaServer({
      accountUuid: params.accountUuid,
      quotaLimit: params.quotaLimit,
      currentUsage: 0,
      resetPeriod: params.resetPeriod,
      lastResetAt: now,
      nextResetAt: 0, // Will be calculated
      createdAt: now,
      updatedAt: now,
    });
    instance._nextResetAt = instance.calculateNextResetTime();

    instance.addDomainEvent({
      eventType: 'ai.quota.created',
      aggregateId: instance.uuid,
      occurredOn: new Date(now),
      accountUuid: params.accountUuid,
      payload: {
        quota: instance.toServerDTO(),
      },
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

    this.addDomainEvent({
      eventType: 'ai.quota.consumed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        quotaUuid: this.uuid,
        amount,
        currentUsage: this._currentUsage,
      },
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
    this._lastResetAt = new Date();
    this._nextResetAt = this.calculateNextResetTime();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'ai.quota.reset',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        quotaUuid: this.uuid,
        nextResetAt: this._nextResetAt,
      },
    });
  }

  public updateLimit(newLimit: number): void {
    const oldLimit = this._quotaLimit;
    this._quotaLimit = newLimit;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'ai.quota.limit_updated',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        quotaUuid: this.uuid,
        oldLimit,
        newLimit,
      },
    });
  }

  public calculateNextResetTime(): number {
    const now = new Date();
    const resetDate = new Date(now);

    switch (this._resetPeriod) {
      case QuotaResetPeriod.DAILY:
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.WEEKLY:
        // Reset on next Monday
        const day = now.getDay();
        const diff = day === 0 ? 1 : 8 - day; // If Sunday (0), add 1. If Mon-Sat, add 8-day.
        resetDate.setDate(now.getDate() + diff);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case QuotaResetPeriod.MONTHLY:
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
      lastResetAt: this._lastResetAt.getTime(),
      nextResetAt: this._nextResetAt.getTime(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): AIUsageQuotaClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
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
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      quotaLimit: this._quotaLimit,
      currentUsage: this._currentUsage,
      resetPeriod: this._resetPeriod,
      lastResetAt: this._lastResetAt.getTime(),
      nextResetAt: this._nextResetAt.getTime(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}
