/**
 * NotificationChannel 实体实现
 */

import type {
  NotificationChannelServerDTO,
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
} from '../../domain-shared/value-objects';

/** 内部状态接口 for NotificationChannel */
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
  sentAt: Date | null;
  failedAt: Date | null;
}

/**
 * NotificationChannel 实体
 * 管理通知在特定渠道的发送状态
 */
export class NotificationChannel extends Entity<NotificationChannelId> {
  // ===== 私有属性容器 =====
  private _props: NotificationChannelState;

  // ===== 构造函数（私有） =====
  private constructor(state: NotificationChannelState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get notificationId(): NotificationId {
    return this._props.notificationId;
  }

  public get channelType(): NotificationChannelType {
    return this._props.channelType;
  }

  public get status(): ChannelStatus {
    return this._props.status;
  }

  public get recipient(): string | null {
    return this._props.recipient;
  }

  public get sendAttempts(): number {
    return this._props.sendAttempts;
  }

  public get maxRetries(): number {
    return this._props.maxRetries;
  }

  public get error(): ChannelErrorDTO | null {
    return this._props.error?.toDTO() ?? null;
  }

  public get response(): ChannelResponseDTO | null {
    return this._props.response?.toDTO() ?? null;
  }

  public get sentAt(): Date | null {
    return this._props.sentAt;
  }

  public get failedAt(): Date | null {
    return this._props.failedAt;
  }

  // ===== 业务方法 =====

  public send(): void {
    if (this._props.status !== ChannelStatusType.Pending) {
      throw new Error('只能发送待发送状态的渠道');
    }
    this._props.sendAttempts++;
    this._props.status = ChannelStatusType.Sent;
    this._props.sentAt = new Date();
  }

  public markAsDelivered(response?: ChannelResponse): void {
    if (this._props.status !== ChannelStatusType.Sent) {
      throw new Error('只能将已发送状态标记为已送达');
    }
    this._props.status = ChannelStatusType.Delivered;
    if (response) {
      this._props.response = response;
    }
  }

  public markAsFailed(error: ChannelError): void {
    this._props.status = ChannelStatusType.Failed;
    this._props.error = error;
    this._props.failedAt = new Date();
  }

  public cancel(): void {
    if (
      this._props.status === ChannelStatusType.Delivered
    ) {
      throw new Error('无法取消：渠道消息已送达');
    }
    this._props.status = ChannelStatusType.Cancelled;
  }

  public canRetry(): boolean {
    return (
      this._props.status === ChannelStatusType.Failed &&
      this._props.sendAttempts < this._props.maxRetries
    );
  }

  public retry(): void {
    if (!this.canRetry()) {
      throw new Error('无法重试：已达最大重试次数或状态不允许');
    }
    this._props.status = ChannelStatusType.Pending;
    this._props.error = null;
    this._props.failedAt = null;
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationChannelServerDTO {
    return {
      id: String(this.id),
      notificationId: String(this._props.notificationId),
      channelType: this._props.channelType,
      status: this._props.status,
      recipient: this._props.recipient,
      sendAttempts: this._props.sendAttempts,
      maxRetries: this._props.maxRetries,
      error: this._props.error?.toDTO() ?? null,
      response: this._props.response?.toDTO() ?? null,
      createdAt: Date.now(),
      sentAt: this._props.sentAt?.getTime() ?? null,
      failedAt: this._props.failedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): import('@dailyuse/contracts/notification').NotificationChannelClientDTO {
    const now = Date.now();
    return {
      id: String(this.id),
      notificationId: String(this._props.notificationId),
      channelType: this._props.channelType,
      status: this._props.status,
      recipient: this._props.recipient,
      sendAttempts: this._props.sendAttempts,
      maxRetries: this._props.maxRetries,
      error: this._props.error?.toDTO() ?? null,
      response: this._props.response?.toDTO() ?? null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      sentAt: this._props.sentAt?.getTime() ?? null,
      failedAt: this._props.failedAt?.getTime() ?? null,
    };
  }

  // ===== 静态工厂方法 =====

  public static load(state: NotificationChannelState): NotificationChannel {
    return new NotificationChannel(state);
  }

  public static create(params: {
    notificationId: NotificationId;
    channelType: NotificationChannelType;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannel {
    const id = NotificationChannelId.of(NotificationChannelId.generate());

    return new NotificationChannel({
      id,
      notificationId: params.notificationId,
      channelType: params.channelType,
      status: ChannelStatusType.Pending,
      recipient: params.recipient ?? null,
      sendAttempts: 0,
      maxRetries: params.maxRetries ?? 3,
      error: null,
      response: null,
      sentAt: null,
      failedAt: null,
    });
  }
}
