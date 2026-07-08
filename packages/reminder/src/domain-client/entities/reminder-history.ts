/**
 * ReminderHistory Entity - Domain Client
 * 提醒历史实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: ReminderHistoryState): ReminderHistory
 * - Instance toDTO(): ReminderHistoryClientDTO
 */

import type {
  ReminderHistoryClientDTO,
  TriggerResult,
  NotificationChannel,
} from '@dailyuse/contracts/reminder';
import { Entity } from '@dailyuse/utils/domain';
import { ReminderInstanceId } from '../../server/domain/value-objects/reminder-instance-id';
import { ReminderTemplateId } from '../../server/domain/value-objects/reminder-template-id';
import type { ReminderHistoryId } from '@dailyuse/contracts/primitives';

export interface ReminderHistoryState {
  id: ReminderInstanceId;
  templateId: ReminderTemplateId;
  triggeredAt: Date;
  result: TriggerResult;
  error: string | null;
  notificationSent: boolean;
  notificationChannels: NotificationChannel[] | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ReminderHistory extends Entity<ReminderInstanceId> {
  private readonly _props: ReminderHistoryState;

  private constructor(props: ReminderHistoryState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get templateId(): ReminderTemplateId {
    return this._props.templateId;
  }

  get triggeredAt(): Date {
    return this._props.triggeredAt;
  }

  get result(): TriggerResult {
    return this._props.result;
  }

  get error(): string | null {
    return this._props.error;
  }

  get notificationSent(): boolean {
    return this._props.notificationSent;
  }

  get notificationChannels(): NotificationChannel[] | null {
    return this._props.notificationChannels ? [...this._props.notificationChannels] : null;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isSuccess(): boolean {
    return this._props.result === 'Success';
  }

  get isFailed(): boolean {
    return this._props.result === 'Failed';
  }

  get isSkipped(): boolean {
    return this._props.result === 'Skipped';
  }

  // ================= Factory Methods =================
  public static load(state: ReminderHistoryState): ReminderHistory {
    return new ReminderHistory(state);
  }

  // ================= DTO Conversion =================
  public toDTO(): ReminderHistoryClientDTO {
    return {
      id: String(this.id) as ReminderHistoryId,
      templateId: this._props.templateId as ReminderTemplateId,
      triggeredAt: this._props.triggeredAt.getTime(),
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels ? [...this._props.notificationChannels] : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
