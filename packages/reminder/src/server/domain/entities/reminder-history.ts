/**
 * Reminder History 实体
 * 提醒历史记录实体
 */

import type {
  ReminderHistoryServerDTO,
  ReminderHistoryClientDTO,
} from '@dailyuse/contracts/reminder';
import { TriggerResult, NotificationChannel } from '@dailyuse/contracts/reminder';
import type { Instant, ReminderTemplateId, IdentityId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils/domain';
import { ReminderHistoryId } from '../value-objects/reminder-history-id';

/**
 * ReminderHistory 内部状态接口
 */
export interface ReminderHistoryState {
  id: ReminderHistoryId;
  templateId: string;
  identityId: string;
  triggeredAt: Instant;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  createdAt: Instant;
}

/**
 * ReminderHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 属于 ReminderTemplate 聚合根
 */
export class ReminderHistory extends Entity<ReminderHistoryId> {
  // ===== 私有字段 =====
  private _props: ReminderHistoryState;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(state: ReminderHistoryState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====

  public get templateId(): string {
    return this._props.templateId;
  }

  public get identityId(): string {
    return this._props.identityId;
  }

  public get triggeredAt(): Instant {
    return this._props.triggeredAt;
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

  public get createdAt(): Instant {
    return this._props.createdAt;
  }

  // ===== 工厂方法 =====

  public static load(state: ReminderHistoryState): ReminderHistory {
    return new ReminderHistory(state);
  }

  public static create(params: {
    templateId: string;
    identityId: string;
    triggeredAt?: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent?: boolean;
    notificationChannels?: NotificationChannel[] | null;
  }): ReminderHistory {
    const now = Date.now();
    return new ReminderHistory({
      id: ReminderHistoryId.generate(),
      templateId: params.templateId,
      identityId: params.identityId,
      triggeredAt: params.triggeredAt ?? now,
      result: params.result,
      error: params.error ?? null,
      notificationSent: params.notificationSent ?? false,
      notificationChannels: params.notificationChannels ? [...params.notificationChannels] : null,
      createdAt: now,
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

  public get notificationChannelCount(): number {
    return this._props.notificationChannels?.length ?? 0;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): ReminderHistoryServerDTO {
    return {
      id: this.id,
      templateId: this._props.templateId as ReminderTemplateId,
      identityId: this._props.identityId as IdentityId,
      triggeredAt: this._props.triggeredAt,
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels,
      createdAt: this._props.createdAt,
    };
  }

  public toClientDTO(): ReminderHistoryClientDTO {
    return {
      id: this.id,
      templateId: this._props.templateId as ReminderTemplateId,
      triggeredAt: this._props.triggeredAt,
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels,
      version: 1,
      createdAt: this._props.createdAt,
      updatedAt: this._props.createdAt,
      deletedAt: null,
    };
  }
}
