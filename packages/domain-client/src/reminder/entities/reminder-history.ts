/**
 * ReminderHistory Entity - Domain Client
 * 提醒历史实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ReminderHistoryClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
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

export class ReminderHistory extends Entity<ReminderInstanceId> implements ReminderHistoryClient {
  // ================= 1. Backing Fields =================
  private _templateId: ReminderTemplateId;
  private _triggeredAt: Date;
  private _result: TriggerResult;
  private _error: string | null;
  private _notificationSent: boolean;
  private _notificationChannels: NotificationChannel[] | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // UI 扩展
  private _resultText: string;
  private _timeAgo: string;
  private _channelsText: string | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
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
  }) {
    super(params.id);
    this._templateId = params.templateId;
    this._triggeredAt = params.triggeredAt;
    this._result = params.result;
    this._error = params.error;
    this._notificationSent = params.notificationSent;
    this._notificationChannels = params.notificationChannels;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._resultText = params.resultText;
    this._timeAgo = params.timeAgo;
    this._channelsText = params.channelsText;
  }

  // ================= 3. Getters =================
  get templateId(): ReminderTemplateId {
    return this._templateId;
  }

  get triggeredAt(): Date {
    return this._triggeredAt;
  }

  get result(): TriggerResult {
    return this._result;
  }

  get error(): string | null {
    return this._error;
  }

  get notificationSent(): boolean {
    return this._notificationSent;
  }

  get notificationChannels(): NotificationChannel[] | null {
    return this._notificationChannels ? [...this._notificationChannels] : null;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // UI 扩展属性
  get resultText(): string {
    return this._resultText;
  }

  get timeAgo(): string {
    return this._timeAgo;
  }

  get channelsText(): string | null {
    return this._channelsText;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isSuccess(): boolean {
    return this._result === 'Success';
  }

  get isFailed(): boolean {
    return this._result === 'Failed';
  }

  get isSkipped(): boolean {
    return this._result === 'Skipped';
  }

  // ================= 4. Factory Methods =================
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

  // ================= 5. DTO Conversion =================
  public toDTO(): ReminderHistoryClientDTO {
    return {
      id: String(this.id),
      templateId: String(this._templateId),
      triggeredAt: this._triggeredAt.getTime(),
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels ? [...this._notificationChannels] : null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      resultText: this._resultText,
      timeAgo: this._timeAgo,
      channelsText: this._channelsText,
    };
  }
}
