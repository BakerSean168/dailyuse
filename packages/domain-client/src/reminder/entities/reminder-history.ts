/**
 * ReminderHistory Entity - Domain Client
 * 提醒历史实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ReminderHistoryClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static fromDTO(dto: ReminderHistoryClientDTO): ReminderHistory
 * - Instance toDTO(): ReminderHistoryClientDTO
 */

import type {
  ReminderHistoryClient,
  ReminderHistoryClientDTO,
  TriggerResult,
  NotificationChannel,
} from '@dailyuse/contracts/reminder';
import { Entity } from '@dailyuse/utils';
import { ReminderInstanceId, ReminderTemplateId } from '@dailyuse/domain-shared/reminder';

// 内部状态接口
interface ReminderHistoryState {
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
  resultText: string;
  timeAgo: string;
  channelsText: string | null;
}

export class ReminderHistory extends Entity<ReminderInstanceId> implements ReminderHistoryClient {
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

  // UI 扩展属性
  get resultText(): string {
    return this._props.resultText;
  }

  get timeAgo(): string {
    return this._props.timeAgo;
  }

  get channelsText(): string | null {
    return this._props.channelsText;
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
  public static fromDTO(dto: ReminderHistoryClientDTO): ReminderHistory {
    return new ReminderHistory({
      id: ReminderInstanceId.of(dto.id),
      templateId: ReminderTemplateId.of(dto.templateId),
      triggeredAt: new Date(dto.triggeredAt),
      result: dto.result,
      error: dto.error,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      resultText: dto.resultText,
      timeAgo: dto.timeAgo,
      channelsText: dto.channelsText,
    });
  }

  // ================= DTO Conversion =================
  public toDTO(): ReminderHistoryClientDTO {
    return {
      id: String(this._props.id),
      templateId: String(this._props.templateId),
      triggeredAt: this._props.triggeredAt.getTime(),
      result: this._props.result,
      error: this._props.error,
      notificationSent: this._props.notificationSent,
      notificationChannels: this._props.notificationChannels ? [...this._props.notificationChannels] : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      resultText: this._props.resultText,
      timeAgo: this._props.timeAgo,
      channelsText: this._props.channelsText,
    };
  }
}
