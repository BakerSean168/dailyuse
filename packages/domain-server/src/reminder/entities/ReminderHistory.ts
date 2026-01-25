/**
 * Reminder History 实体
 * 提醒历史记录实体
 */

import type { ReminderHistoryServer, ReminderHistoryServerDTO, ReminderHistoryClientDTO, ReminderHistoryPersistenceDTO } from '@dailyuse/contracts/reminder';
import { TriggerResult, NotificationChannel } from '@dailyuse/contracts/reminder';
import { Entity } from '@dailyuse/utils';

/**
 * ReminderHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 属于 ReminderTemplate 聚合根
 */
export class ReminderHistory extends Entity implements ReminderHistoryServer {
  // ===== 私有字段 =====
  private _templateUuid: string;
  private _triggeredAt: Date;
  private _result: TriggerResult;
  private _error: string | null;
  private _notificationSent: boolean;
  private _notificationChannels: NotificationChannel[] | null;
  private _createdAt: Date;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    templateUuid: string;
    triggeredAt: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent: boolean;
    notificationChannels?: NotificationChannel[] | null;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._templateUuid = params.templateUuid;
    this._triggeredAt = new Date(params.triggeredAt);
    this._result = params.result;
    this._error = params.error ?? null;
    this._notificationSent = params.notificationSent;
    this._notificationChannels = params.notificationChannels
      ? [...params.notificationChannels]
      : null;
    this._createdAt = new Date(params.createdAt);
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get templateUuid(): string {
    return this._templateUuid;
  }

  public get triggeredAt(): Date {
    return this._triggeredAt;
  }

  public get result(): TriggerResult {
    return this._result;
  }

  public get error(): string | null {
    return this._error;
  }

  public get notificationSent(): boolean {
    return this._notificationSent;
  }

  public get notificationChannels(): NotificationChannel[] | null {
    return this._notificationChannels ? [...this._notificationChannels] : null;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ReminderHistory 实体
   */
  public static create(params: {
    templateUuid: string;
    triggeredAt: number;
    result: TriggerResult;
    error?: string;
    notificationSent: boolean;
    notificationChannels?: NotificationChannel[];
  }): ReminderHistory {
    return new ReminderHistory({
      templateUuid: params.templateUuid,
      triggeredAt: params.triggeredAt,
      result: params.result,
      error: params.error,
      notificationSent: params.notificationSent,
      notificationChannels: params.notificationChannels,
      createdAt: Date.now(),
    });
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistory {
    return new ReminderHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt,
      result: dto.result,
      error: dto.error,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels ?? null,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从 Persistence DTO 创建实体
   */
  public static fromPersistenceDTO(dto: ReminderHistoryPersistenceDTO): ReminderHistory {
    return new ReminderHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt.getTime(),
      result: dto.result,
      error: dto.error,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels ? JSON.parse(dto.notificationChannels) : null,
      createdAt: dto.createdAt.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 是否成功
   */
  public isSuccess(): boolean {
    return this._result === 'SUCCESS';
  }

  /**
   * 是否失败
   */
  public isFailed(): boolean {
    return this._result === 'FAILED';
  }

  /**
   * 是否跳过
   */
  public isSkipped(): boolean {
    return this._result === 'SKIPPED';
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ReminderHistoryServerDTO {
    return {
      uuid: this.uuid,
      templateUuid: this.templateUuid,
      triggeredAt: this.triggeredAt.getTime(),
      result: this.result,
      error: this.error,
      notificationSent: this.notificationSent,
      notificationChannels: this.notificationChannels,
      createdAt: this.createdAt.getTime(),
    };
  }

  public toClientDTO(): ReminderHistoryClientDTO {
    const resultTextMap: Record<TriggerResult, string> = {
      SUCCESS: '成功',
      FAILED: '失败',
      SKIPPED: '跳过',
    };

    const formatTimeAgo = (timestamp: number): string => {
      const diff = Date.now() - timestamp;
      const hours = Math.floor(diff / 3600000);
      if (hours > 0) return `${hours} 小时前`;
      const minutes = Math.floor(diff / 60000);
      return `${minutes} 分钟前`;
    };

    const channelsText = this.notificationChannels?.join(' + ');

    return {
      uuid: this.uuid,
      templateUuid: this.templateUuid,
      triggeredAt: this.triggeredAt.getTime(),
      result: this.result,
      error: this.error,
      notificationSent: this.notificationSent,
      notificationChannels: this.notificationChannels,
      createdAt: this.createdAt.getTime(),

      // UI 扩展
      resultText: resultTextMap[this.result],
      timeAgo: formatTimeAgo(this.triggeredAt.getTime()),
      channelsText: channelsText,
    };
  }

  /**
   * 转换为 Persistence DTO (数据库)
   */
  public toPersistenceDTO(): ReminderHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      templateUuid: this.templateUuid,
      triggeredAt: this.triggeredAt,
      result: this.result,
      error: this.error,
      notificationSent: this.notificationSent,
      notificationChannels: this.notificationChannels
        ? JSON.stringify(this.notificationChannels)
        : null,
      createdAt: this.createdAt,
    };
  }
}
