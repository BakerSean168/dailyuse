/**
 * NotificationChannel Entity - Domain Client
 * 通知渠道实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 NotificationChannelClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: NotificationChannelClientDTO): NotificationChannel
 * - Instance toDTO(): NotificationChannelClientDTO
 */

import type {
  NotificationChannelClient,
  NotificationChannelClientDTO,
  NotificationChannelType,
  ChannelStatus,
} from '@dailyuse/contracts/notification';
import type { NotificationId as INotificationId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import {
  NotificationChannelId,
  NotificationId,
  ChannelError,
  ChannelResponse,
} from '@/domain-shared';

// 内部状态接口
interface NotificationChannelState {
  id: NotificationChannelId;
  notificationId: NotificationId;
  channelType: NotificationChannelType;
  status: ChannelStatus;
  recipient: string | null;
  sendAttempts: number;
  maxRetries: number;
  error: ChannelError | null;
  response: ChannelResponse | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
}

export class NotificationChannel extends Entity<NotificationChannelId> implements NotificationChannelClient {
  // ================= 1. Props =================
  private readonly _props: NotificationChannelState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: NotificationChannelState) {
    super(NotificationChannelId.of(props.id));
    this._props = props;
  }

  // ================= 3. Getters =================
  get notificationId(): INotificationId {
    return this._props.notificationId;
  }

  get channelType(): NotificationChannelType {
    return this._props.channelType;
  }

  get status(): ChannelStatus {
    return this._props.status;
  }

  get recipient(): string | null | undefined {
    return this._props.recipient;
  }

  get sendAttempts(): number {
    return this._props.sendAttempts;
  }

  get maxRetries(): number {
    return this._props.maxRetries;
  }

  get error(): ChannelError | null {
    return this._props.error as ChannelError | null;
  }

  get response(): ChannelResponse | null {
    return this._props.response as ChannelResponse | null;
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

  get sentAt(): Date | null | undefined {
    return this._props.sentAt as Date | null | undefined;
  }

  get failedAt(): Date | null | undefined {
    return this._props.failedAt as Date | null | undefined;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isPending(): boolean {
    return this._props.status === 'Pending';
  }

  get isSent(): boolean {
    return this._props.status === 'Sent';
  }

  get isFailed(): boolean {
    return this._props.status === 'Failed';
  }

  get canRetry(): boolean {
    return this._props.sendAttempts < this._props.maxRetries;
  }

  get hasError(): boolean {
    return this._props.error !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: NotificationChannelClientDTO): NotificationChannel {
    return new NotificationChannel({
      id: NotificationChannelId.of(dto.id),
      notificationId: NotificationId.of(dto.notificationId),
      channelType: dto.channelType,
      status: dto.status,
      recipient: dto.recipient ?? null,
      sendAttempts: dto.sendAttempts,
      maxRetries: dto.maxRetries,
      error: dto.error ? ChannelError.fromDTO(dto.error) : null,
      response: dto.response ? ChannelResponse.fromDTO(dto.response) : null,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      sentAt: dto.sentAt ? new Date(dto.sentAt) : null,
      failedAt: dto.failedAt ? new Date(dto.failedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): NotificationChannelClientDTO {
    const error = this._props.error as ChannelError | null;
    const response = this._props.response as ChannelResponse | null;
    const createdAt = this._props.createdAt as Date;
    const updatedAt = this._props.updatedAt as Date;
    const deletedAt = this._props.deletedAt as Date | null;
    const sentAt = this._props.sentAt as Date | null;
    const failedAt = this._props.failedAt as Date | null;
    return {
      id: this.id as unknown as string,
      notificationId: this._props.notificationId as unknown as string,
      channelType: this._props.channelType,
      status: this._props.status,
      recipient: this._props.recipient,
      sendAttempts: this._props.sendAttempts,
      maxRetries: this._props.maxRetries,
      error: error?.toDTO() ?? null,
      response: response?.toDTO() ?? null,
      version: this._props.version,
      createdAt: createdAt.getTime(),
      updatedAt: updatedAt.getTime(),
      deletedAt: deletedAt?.getTime() ?? null,
      sentAt: sentAt?.getTime() ?? null,
      failedAt: failedAt?.getTime() ?? null,
    };
  }
}
