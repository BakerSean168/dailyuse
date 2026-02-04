/**
 * NotificationChannel 实体实现
 * 实现 NotificationChannelServer 接口
 */

import type {
  NotificationChannelServer,
  NotificationChannelServerDTO,
  NotificationChannelPersistenceDTO,
  ChannelErrorDTO,
  ChannelResponseDTO,
  NotificationChannelType,
  ChannelStatus,
} from '@dailyuse/contracts/notification';
import { Entity } from '@dailyuse/utils';
import {
  NotificationChannelId,
  NotificationId,
  ChannelError,
  ChannelResponse,
  ChannelStatus as ChannelStatusType,
} from '@dailyuse/domain-shared/notification';

/**
 * NotificationChannel 实体
 * 管理通知在特定渠道的发送状态
 */
export class NotificationChannel
  extends Entity<NotificationChannelId>
  implements NotificationChannelServer
{
  // ===== 私有字段 =====
  private _notificationId: NotificationId;
  private _channelType: NotificationChannelType;
  private _status: ChannelStatus;
  private _recipient: string | null;
  private _sendAttempts: number;
  private _maxRetries: number;
  private _error: ChannelError | null;
  private _response: ChannelResponse | null;
  private _sentAt: Date | null;
  private _failedAt: Date | null;

  // ===== 构造函数（私有） =====
  private constructor(
    id: NotificationChannelId,
    params: {
      notificationId: NotificationId;
      channelType: NotificationChannelType;
      status: ChannelStatus;
      recipient?: string | null;
      sendAttempts: number;
      maxRetries: number;
      error?: ChannelError | null;
      response?: ChannelResponse | null;
      sentAt?: Date | null;
      failedAt?: Date | null;
    },
  ) {
    super(id);
    this._notificationId = params.notificationId;
    this._channelType = params.channelType;
    this._status = params.status;
    this._recipient = params.recipient ?? null;
    this._sendAttempts = params.sendAttempts;
    this._maxRetries = params.maxRetries;
    this._error = params.error ?? null;
    this._response = params.response ?? null;
    this._sentAt = params.sentAt ?? null;
    this._failedAt = params.failedAt ?? null;
  }

  // ===== Getter 属性 =====
  public get notificationId(): NotificationId {
    return this._notificationId;
  }

  public get channelType(): NotificationChannelType {
    return this._channelType;
  }

  public get status(): ChannelStatus {
    return this._status;
  }

  public get recipient(): string | null {
    return this._recipient;
  }

  public get sendAttempts(): number {
    return this._sendAttempts;
  }

  public get maxRetries(): number {
    return this._maxRetries;
  }

  public get error(): ChannelErrorDTO | null {
    return this._error?.toDTO() ?? null;
  }

  public get response(): ChannelResponseDTO | null {
    return this._response?.toDTO() ?? null;
  }

  public get sentAt(): Date | null {
    return this._sentAt;
  }

  public get failedAt(): Date | null {
    return this._failedAt;
  }

  // ===== 业务方法 =====

  public send(): void {
    if (this._status !== ChannelStatusType.Pending) {
      throw new Error('只能发送待发送状态的渠道');
    }
    this._sendAttempts++;
    this._status = ChannelStatusType.Sent;
    this._sentAt = new Date();
  }

  public markAsDelivered(response?: ChannelResponse): void {
    if (this._status !== ChannelStatusType.Sent) {
      throw new Error('只能将已发送状态标记为已送达');
    }
    this._status = ChannelStatusType.Delivered;
    if (response) {
      this._response = response;
    }
  }

  public markAsFailed(error: ChannelError): void {
    this._status = ChannelStatusType.Failed;
    this._error = error;
    this._failedAt = new Date();
  }

  public cancel(): void {
    if (
      this._status === ChannelStatusType.Delivered
    ) {
      throw new Error('无法取消：渠道消息已送达');
    }
    this._status = ChannelStatusType.Cancelled;
  }

  public canRetry(): boolean {
    return (
      this._status === ChannelStatusType.Failed &&
      this._sendAttempts < this._maxRetries
    );
  }

  public retry(): void {
    if (!this.canRetry()) {
      throw new Error('无法重试：已达最大重试次数或状态不允许');
    }
    this._status = ChannelStatusType.Pending;
    this._error = null;
    this._failedAt = null;
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationChannelServerDTO {
    return {
      id: String(this.id),
      notificationId: String(this._notificationId),
      channelType: this._channelType,
      status: this._status,
      recipient: this._recipient,
      sendAttempts: this._sendAttempts,
      maxRetries: this._maxRetries,
      error: this._error?.toDTO() ?? null,
      response: this._response?.toDTO() ?? null,
      createdAt: Date.now(),
      sentAt: this._sentAt?.getTime() ?? null,
      failedAt: this._failedAt?.getTime() ?? null,
    };
  }

  public toPersistenceDTO(): NotificationChannelPersistenceDTO {
    return {
      id: String(this.id),
      notificationId: this._notificationId,
      channelType: this._channelType,
      status: this._status,
      recipient: this._recipient,
      sendAttempts: this._sendAttempts,
      maxRetries: this._maxRetries,
      error: this._error ? JSON.stringify(this._error.toDTO()) : null,
      response: this._response ? JSON.stringify(this._response.toDTO()) : null,
      createdAt: new Date(),
      sentAt: this._sentAt ?? null,
      failedAt: this._failedAt ?? null,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    notificationId: NotificationId;
    channelType: NotificationChannelType;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannel {
    const id = NotificationChannelId.of(NotificationChannelId.generate());

    return new NotificationChannel(id, {
      notificationId: params.notificationId,
      channelType: params.channelType,
      status: ChannelStatusType.Pending,
      recipient: params.recipient,
      sendAttempts: 0,
      maxRetries: params.maxRetries ?? 3,
    });
  }

  public static fromServerDTO(dto: NotificationChannelServerDTO): NotificationChannel {
    const id = NotificationChannelId.of(dto.id);
    const notificationId = NotificationId.of(dto.notificationId);

    return new NotificationChannel(id, {
      notificationId,
      channelType: dto.channelType,
      status: dto.status,
      recipient: dto.recipient,
      sendAttempts: dto.sendAttempts,
      maxRetries: dto.maxRetries,
      error: dto.error ? ChannelError.fromDTO(dto.error) : null,
      response: dto.response ? ChannelResponse.fromDTO(dto.response) : null,
      sentAt: dto.sentAt ? new Date(dto.sentAt) : null,
      failedAt: dto.failedAt ? new Date(dto.failedAt) : null,
    });
  }

  public static fromPersistenceDTO(dto: NotificationChannelPersistenceDTO): NotificationChannel {
    const id = NotificationChannelId.of(dto.id);
    const notificationId = NotificationId.of(dto.notificationId);

    return new NotificationChannel(id, {
      notificationId,
      channelType: dto.channelType,
      status: dto.status,
      recipient: dto.recipient,
      sendAttempts: dto.sendAttempts,
      maxRetries: dto.maxRetries,
      error: dto.error ? ChannelError.fromDTO(JSON.parse(dto.error)) : null,
      response: dto.response ? ChannelResponse.fromDTO(JSON.parse(dto.response)) : null,
      sentAt: dto.sentAt ? new Date(dto.sentAt) : null,
      failedAt: dto.failedAt ? new Date(dto.failedAt) : null,
    });
  }
}
