/**
 * Reminder History 实体
 * 提醒历史记录实体
 */

import type {
  ReminderHistoryServer,
  ReminderHistoryServerDTO,
  ReminderHistoryClientDTO,
  ReminderHistoryPersistenceDTO,
} from '@dailyuse/contracts/reminder';
import { TriggerResult, NotificationChannel } from '@dailyuse/contracts/reminder';
import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * ReminderHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 属于 ReminderTemplate 聚合根
 */
export class ReminderHistory extends Entity<string> implements ReminderHistoryServer {
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
    super(params.uuid || generateUUID());
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
  public get uuid(): string {
    return this.id;
  }

  public get templateUuid(): string {
    return this._templateUuid;
  }

  public get triggeredAt(): number {
    return this._triggeredAt.getTime();
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
  public static create(params: {
    templateUuid: string;
    triggeredAt?: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent?: boolean;
    notificationChannels?: NotificationChannel[] | null;
  }): ReminderHistory {
    const now = Date.now();
    return new ReminderHistory({
      templateUuid: params.templateUuid,
      triggeredAt: params.triggeredAt ?? now,
      result: params.result,
      error: params.error ?? null,
      notificationSent: params.notificationSent ?? false,
      notificationChannels: params.notificationChannels ?? null,
      createdAt: now,
    });
  }

  public static fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistory {
    return new ReminderHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt,
      result: dto.result,
      error: dto.error ?? null,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels ?? null,
      createdAt: dto.createdAt,
    });
  }

  public static fromPersistenceDTO(
    dto: ReminderHistoryPersistenceDTO,
  ): ReminderHistory {
    const notificationChannels = dto.notificationChannels
      ? JSON.parse(dto.notificationChannels)
      : null;

    return new ReminderHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt,
      result: dto.result,
      error: dto.error ?? null,
      notificationSent: dto.notificationSent,
      notificationChannels,
      createdAt: dto.createdAt.getTime(),
    });
  }

  // ===== 计算属性 =====
  public get isSuccess(): boolean {
    return this._result === TriggerResult.Success;
  }

  public get isFailed(): boolean {
    return this._result === TriggerResult.Failed;
  }

  public get isSkipped(): boolean {
    return this._result === TriggerResult.Skipped;
  }

  public get hasError(): boolean {
    return this._error !== null;
  }

  public get resultDescription(): string {
    const descriptions: Record<TriggerResult, string> = {
      [TriggerResult.Success]: '成功',
      [TriggerResult.Failed]: '失败',
      [TriggerResult.Skipped]: '跳过',
    };
    return descriptions[this._result];
  }

  public get triggeredAtFormatted(): string {
    return this._triggeredAt.toLocaleString();
  }

  public get createdAtFormatted(): string {
    return this._createdAt.toLocaleString();
  }

  public get notificationChannelCount(): number {
    return this._notificationChannels?.length ?? 0;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): ReminderHistoryServerDTO {
    return {
      uuid: this.id,
      templateUuid: this._templateUuid,
      triggeredAt: this._triggeredAt.getTime(),
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): ReminderHistoryClientDTO {
    // 生成通知渠道文本
    const channelsText = this._notificationChannels?.length
      ? this._notificationChannels.join(' + ')
      : null;

    return {
      id: this.id,
      templateId: this._templateUuid,
      triggeredAt: this._triggeredAt.getTime(),
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels,
      createdAt: this._createdAt.getTime(),
      // Client 专属计算字段
      resultText: this.resultDescription,
      timeAgo: this.triggeredAtFormatted,
      channelsText,
    };
  }

  public toPersistenceDTO(): ReminderHistoryPersistenceDTO {
    return {
      uuid: this.id,
      templateUuid: this._templateUuid,
      triggeredAt: this._triggeredAt.getTime(),
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels
        ? JSON.stringify(this._notificationChannels)
        : null,
      createdAt: this._createdAt,
    };
  }
}
