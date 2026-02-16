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
import { Entity } from '@dailyuse/utils';
import { ReminderHistoryId } from '../../domain-shared/value-objects/reminder-history-id';

/**
 * ReminderHistory 内部状态接口
 */
interface ReminderHistoryState {
  id: ReminderHistoryId;
  templateId: string;
  triggeredAt: Date;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  createdAt: Date;
}

/**
 * ReminderHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 属于 ReminderTemplate 聚合根
 */
export class ReminderHistory extends Entity<ReminderHistoryId> implements ReminderHistoryServer {
  // ===== 私有字段 =====
  private _props: ReminderHistoryState;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    id?: string;
    templateId: string;
    triggeredAt: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent: boolean;
    notificationChannels?: NotificationChannel[] | null;
    createdAt: number;
  }) {
    const id = params.id ? ReminderHistoryId.of(params.id) : ReminderHistoryId.generate();
    super(id);
    this._props = {
      id,
      templateId: params.templateId,
      triggeredAt: new Date(params.triggeredAt),
      result: params.result,
      error: params.error ?? null,
      notificationSent: params.notificationSent,
      notificationChannels: params.notificationChannels
        ? [...params.notificationChannels]
        : null,
      createdAt: new Date(params.createdAt),
    };
  }

  // ===== Getter 属性 =====


  public get templateId(): string {
    return this._props.templateId;
  }

  public get triggeredAt(): number {
    return this._props.triggeredAt.getTime();
  }

  public get result(): TriggerResult {
    return this._props.result;
  }

  public get error(): string | null {
    return this._props.error;
  }

  public get notificationSent(): boolean {
    return this._props.notificationSent;
  }

  public get notificationChannels(): NotificationChannel[] | null {
    return this._props.notificationChannels ? [...this._props.notificationChannels] : null;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  // ===== 工厂方法 =====
  public static create(params: {
    templateId: string;
    triggeredAt?: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent?: boolean;
    notificationChannels?: NotificationChannel[] | null;
  }): ReminderHistory {
    const now = Date.now();
    return new ReminderHistory({
      templateId: params.templateId,
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
      id: dto.id,
      templateId: dto.templateId,
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
      id: dto.id,
      templateId: dto.templateId,
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
    return this._props.result === TriggerResult.Success;
  }

  public get isFailed(): boolean {
    return this._props.result === TriggerResult.Failed;
  }

  public get isSkipped(): boolean {
    return this._props.result === TriggerResult.Skipped;
  }

  public get hasError(): boolean {
    return this._props.error !== null;
  }

  public get resultDescription(): string {
    const descriptions: Record<TriggerResult, string> = {
      [TriggerResult.Success]: '成功',
      [TriggerResult.Failed]: '失败',
      [TriggerResult.Skipped]: '跳过',
    };
    return descriptions[this._props.result];
  }

  public get triggeredAtFormatted(): string {
    return this._props.triggeredAt.toLocaleString();
  }

  public get createdAtFormatted(): string {
    return this._props.createdAt.toLocaleString();
  }

  public get notificationChannelCount(): number {
    return this._props.notificationChannels?.length ?? 0;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): ReminderHistoryServerDTO {
    return {
      id: this.id,
      templateId: this._props.templateId,
      triggeredAt: this._props.triggeredAt.getTime(),
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels,
      createdAt: this._props.createdAt.getTime(),
    };
  }

  public toClientDTO(): ReminderHistoryClientDTO {
    // 生成通知渠道文本
    const channelsText = this._props.notificationChannels?.length
      ? this._props.notificationChannels.join(' + ')
      : null;

    return {
      id: this.id,
      templateId: this._props.templateId,
      triggeredAt: this._props.triggeredAt.getTime(),
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels,
      version: 1,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.createdAt.getTime(),
      deletedAt: null,
      // Client 专属计算字段
      resultText: this.resultDescription,
      timeAgo: this.triggeredAtFormatted,
      channelsText,
    };
  }

  public toPersistenceDTO(): ReminderHistoryPersistenceDTO {
    return {
      id: this.id,
      templateId: this._props.templateId,
      triggeredAt: this._props.triggeredAt.getTime(),
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels
        ? JSON.stringify(this._props.notificationChannels)
        : null,
      createdAt: this._props.createdAt,
    };
  }
}
