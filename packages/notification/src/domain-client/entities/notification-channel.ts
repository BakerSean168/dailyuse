/**
 * NotificationChannel Entity - Domain Client
 * 通知渠道实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static load(state: NotificationChannelState): NotificationChannel
 * - Instance toDTO(): NotificationChannelClientDTO
 */

import type {
  NotificationChannelClientDTO,
  NotificationChannelType,
  ChannelStatus,
} from '@dailyuse/contracts/notification';
import { Entity } from '@dailyuse/utils/domain';
import {
  NotificationChannelId,
  NotificationId,
  ChannelError,
  ChannelResponse,
} from '../../server/domain/value-objects';
import type { NotificationChannelId as NotificationChannelIdBranded, NotificationId as NotificationIdBranded } from '@dailyuse/contracts/primitives';

export interface NotificationChannelState {
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

export class NotificationChannel extends Entity<NotificationChannelId> {
  // ================= 1. Props =================
  private readonly _props: NotificationChannelState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: NotificationChannelState) {
    super(NotificationChannelId.of(props.id));
    this._props = props;
  }

  // ================= 3. Getters =================
  get notificationId(): NotificationId {
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
  public static load(state: NotificationChannelState): NotificationChannel {
    return new NotificationChannel(state);
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
      id: this.id as unknown as NotificationChannelIdBranded,
      notificationId: this._props.notificationId as unknown as NotificationIdBranded,
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
