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
  ChannelErrorDTO,
  ChannelResponseDTO,
  NotificationChannelType,
  ChannelStatus,
} from '@dailyuse/contracts/notification';
import { Entity } from '@dailyuse/utils';
import {
  NotificationChannelId,
  NotificationId,
} from '@dailyuse/domain-shared/notification';

export class NotificationChannel extends Entity<NotificationChannelId> implements NotificationChannelClient {
  // ================= 1. Backing Fields =================
  private _notificationId: NotificationId;
  private _channelType: NotificationChannelType;
  private _status: ChannelStatus;
  private _recipient: string | null;
  private _sendAttempts: number;
  private _maxRetries: number;
  private _error: ChannelErrorDTO | null;
  private _response: ChannelResponseDTO | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _sentAt: Date | null;
  private _failedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: NotificationChannelId;
    notificationId: NotificationId;
    channelType: NotificationChannelType;
    status: ChannelStatus;
    recipient: string | null;
    sendAttempts: number;
    maxRetries: number;
    error: ChannelErrorDTO | null;
    response: ChannelResponseDTO | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    sentAt: Date | null;
    failedAt: Date | null;
  }) {
    super(params.id);
    this._notificationId = params.notificationId;
    this._channelType = params.channelType;
    this._status = params.status;
    this._recipient = params.recipient;
    this._sendAttempts = params.sendAttempts;
    this._maxRetries = params.maxRetries;
    this._error = params.error;
    this._response = params.response;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._sentAt = params.sentAt;
    this._failedAt = params.failedAt;
  }

  // ================= 3. Getters =================
  get notificationId(): string {
    return this._notificationId as unknown as string;
  }

  get channelType(): NotificationChannelType {
    return this._channelType;
  }

  get status(): ChannelStatus {
    return this._status;
  }

  get recipient(): string | null {
    return this._recipient;
  }

  get sendAttempts(): number {
    return this._sendAttempts;
  }

  get maxRetries(): number {
    return this._maxRetries;
  }

  get error(): ChannelErrorDTO | null {
    return this._error;
  }

  get response(): ChannelResponseDTO | null {
    return this._response;
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

  get sentAt(): Date | null {
    return this._sentAt;
  }

  get failedAt(): Date | null {
    return this._failedAt;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isPending(): boolean {
    return this._status === 'Pending';
  }

  get isSent(): boolean {
    return this._status === 'Sent';
  }

  get isFailed(): boolean {
    return this._status === 'Failed';
  }

  get canRetry(): boolean {
    return this._sendAttempts < this._maxRetries;
  }

  get hasError(): boolean {
    return this._error !== null;
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
      error: dto.error ?? null,
      response: dto.response ?? null,
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
    return {
      id: this.id as unknown as string,
      notificationId: this._notificationId as unknown as string,
      channelType: this._channelType,
      status: this._status,
      recipient: this._recipient,
      sendAttempts: this._sendAttempts,
      maxRetries: this._maxRetries,
      error: this._error,
      response: this._response,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      sentAt: this._sentAt?.getTime() ?? null,
      failedAt: this._failedAt?.getTime() ?? null,
    };
  }
}
