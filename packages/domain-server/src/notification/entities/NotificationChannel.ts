/**
 * NotificationChannel 实体实现
 * 实现 NotificationChannelServer 接口
 */

import type {
  NotificationChannelType,
  ChannelErrorServerDTO,
  ChannelResponseServerDTO,
  NotificationChannelPersistenceDTO,
  NotificationChannelServer,
  NotificationChannelServerDTO,
} from '@dailyuse/contracts/notification';
import { ChannelStatus } from '@dailyuse/contracts/notification';
import { Entity } from '@dailyuse/utils';
import { ChannelError } from '../value-objects/ChannelError';
import { ChannelResponse } from '../value-objects/ChannelResponse';

/**
 * NotificationChannel 实体
 */
export class NotificationChannel extends Entity implements NotificationChannelServer {
  // ===== 私有字段 =====
  private _notificationUuid: string;
  private _channelType: NotificationChannelType;
  private _status: ChannelStatus;
  private _recipient: string | null;
  private _sendAttempts: number;
  private _maxRetries: number;
  private _error: ChannelError | null;
  private _response: ChannelResponse | null;
  private _createdAt: Date;
  private _sentAt: number | null;
  private _deliveredAt: number | null;
  private _failedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    notificationUuid: string;
    channelType: NotificationChannelType;
    status: ChannelStatus;
    recipient?: string | null;
    sendAttempts: number;
    maxRetries: number;
    error?: ChannelError | null;
    response?: ChannelResponse | null;
    createdAt: number;
    sentAt?: number | null;
    deliveredAt?: number | null;
    failedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._notificationUuid = params.notificationUuid;
    this._channelType = params.channelType;
    this._status = params.status;
    this._recipient = params.recipient ?? null;
    this._sendAttempts = params.sendAttempts;
    this._maxRetries = params.maxRetries;
    this._error = params.error ?? null;
    this._response = params.response ?? null;
    this._createdAt = params.createdAt;
    this._sentAt = params.sentAt ?? null;
    this._deliveredAt = params.deliveredAt ?? null;
    this._failedAt = params.failedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get notificationUuid(): string {
    return this._notificationUuid;
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
  public get error(): ChannelErrorServerDTO | null {
    return this._error?.toContract() ?? null;
  }
  public get response(): ChannelResponseServerDTO | null {
    return this._response?.toContract() ?? null;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get sentAt(): Date | null {
    return this._sentAt;
  }
  public get deliveredAt(): Date | null {
    return this._deliveredAt;
  }
  public get failedAt(): Date | null {
    return this._failedAt;
  }

  // ===== 业务方法 =====

  /**
   * 发送通知
   */
  public async send(): Promise<void> {
    if (this._status !== ChannelStatus.PENDING) {
      throw new Error('只能发送待发送状态的渠道');
    }

    this._status = ChannelStatus.SENT;
    this._sentAt = new Date();
    this._sendAttempts++;
  }

  /**
   * 重试发送
   */
  public async retry(): Promise<void> {
    if (!this.canRetry()) {
      throw new Error('无法重试：已达最大重试次数或状态不允许重试');
    }

    this._status = ChannelStatus.PENDING;
    this._error = null;
  }

  /**
   * 取消发送
   */
  public cancel(): void {
    if (this._status === ChannelStatus.DELIVERED || this._status === ChannelStatus.CANCELLED) {
      throw new Error('无法取消：渠道已交付或已取消');
    }

    this._status = ChannelStatus.CANCELLED;
  }

  /**
   * 标记为已交付
   */
  public markAsDelivered(): void {
    if (this._status !== ChannelStatus.SENT) {
      throw new Error('只能标记已发送的渠道为已交付');
    }

    this._status = ChannelStatus.DELIVERED;
    this._deliveredAt = new Date();
  }

  /**
   * 标记为失败
   */
  public markAsFailed(error: ChannelErrorServerDTO): void {
    this._status = ChannelStatus.FAILED;
    this._error = ChannelError.fromContract(error);
    this._failedAt = new Date();
  }

  // ===== 状态查询方法 =====

  public isPending(): boolean {
    return this._status === ChannelStatus.PENDING;
  }

  public isSent(): boolean {
    return this._status === ChannelStatus.SENT;
  }

  public isDelivered(): boolean {
    return this._status === ChannelStatus.DELIVERED;
  }

  public isFailed(): boolean {
    return this._status === ChannelStatus.FAILED;
  }

  public canRetry(): boolean {
    return (
      (this._status === ChannelStatus.FAILED || this._status === ChannelStatus.PENDING) &&
      this._sendAttempts < this._maxRetries
    );
  }

  /**
   * 获取所属通知（需要通过仓储查询）
   */
  public async getNotification(): Promise<any> {
    throw new Error('需要通过 NotificationRepository 实现');
  }

  // ===== 转换方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): NotificationChannelServerDTO {
    return {
      uuid: this.uuid,
      notificationUuid: this.notificationUuid,
      channelType: this.channelType,
      status: this.status,
      recipient: this.recipient,
      sendAttempts: this.sendAttempts,
      maxRetries: this.maxRetries,
      error: this.error,
      response: this.response,
      createdAt: this.createdAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      failedAt: this.failedAt,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): NotificationChannelPersistenceDTO {
    return {
      uuid: this.uuid,
      notificationUuid: this.notificationUuid,
      channelType: this.channelType,
      status: this.status,
      recipient: this.recipient,
      sendAttempts: this.sendAttempts,
      maxRetries: this.maxRetries,
      error: this.error ? JSON.stringify(this.error) : null,
      response: this.response ? JSON.stringify(this.response) : null,
      createdAt: this.createdAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      failedAt: this.failedAt,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的 NotificationChannel 实体
   */
  public static create(params: {
    notificationUuid: string;
    channelType: NotificationChannelType;
    recipient?: string;
    maxRetries?: number;
  }): NotificationChannel {
    return new NotificationChannel({
      notificationUuid: params.notificationUuid,
      channelType: params.channelType,
      status: ChannelStatus.PENDING,
      recipient: params.recipient,
      sendAttempts: 0,
      maxRetries: params.maxRetries ?? 3,
      createdAt: new Date(),
    });
  }

  /**
   * 从 ServerDTO 创建实体
   */
  public static fromServerDTO(dto: NotificationChannelServerDTO): NotificationChannel {
    return new NotificationChannel({
      uuid: dto.uuid,
      notificationUuid: dto.notificationUuid,
      channelType: dto.channelType,
      status: dto.status,
      recipient: dto.recipient,
      sendAttempts: dto.sendAttempts,
      maxRetries: dto.maxRetries,
      error: dto.error ? ChannelError.fromContract(dto.error) : null,
      response: dto.response ? ChannelResponse.fromContract(dto.response) : null,
      createdAt: new Date(dto.createdAt),
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      failedAt: dto.failedAt,
    });
  }

  /**
   * 从 PersistenceDTO 创建实体
   */
  public static fromPersistenceDTO(dto: NotificationChannelPersistenceDTO): NotificationChannel {
    return new NotificationChannel({
      uuid: dto.uuid,
      notificationUuid: dto.notificationUuid,
      channelType: dto.channelType,
      status: dto.status,
      recipient: dto.recipient,
      sendAttempts: dto.sendAttempts,
      maxRetries: dto.maxRetries,
      error: dto.error ? ChannelError.fromContract(JSON.parse(dto.error)) : null,
      response: dto.response ? ChannelResponse.fromContract(JSON.parse(dto.response)) : null,
      createdAt: new Date(dto.createdAt),
      sentAt: dto.sentAt,
      deliveredAt: dto.deliveredAt,
      failedAt: dto.failedAt,
    });
  }
}
