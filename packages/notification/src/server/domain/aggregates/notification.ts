/**
 * Notification 聚合根实现
 */

import type {
  NotificationServerDTO,
  NotificationActionDTO,
  NotificationMetadataDTO,
  NotificationEventMap,
} from '@memoflow/contracts/notification';
import type { IdentityId, NotificationId as NotificationIdBranded } from '@memoflow/contracts/primitives';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '@memoflow/contracts/notification';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { AggregateRoot } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import {
  NotificationId,
  NotificationAction,
  NotificationMetadata,
} from '../value-objects';
import { NotificationChannel } from '../entities/notification-channel';

const logger = createLogger('Notification');

/**
 * Notification 内部状态接口
 */
export interface NotificationState {
  id: NotificationId;
  identityId: IdentityId;
  title: string;
  content: string;
  type: NotificationType;
  category: NotificationCategory;
  importance: ImportanceLevel;
  status: NotificationStatus;
  isRead: boolean;
  readAt: number | null;
  actions: NotificationAction[] | null;
  metadata: NotificationMetadata | null;
  expiresAt: number | null;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notificationChannels: NotificationChannel[];
}

/**
 * Notification 聚合根
 */
export class Notification extends AggregateRoot<NotificationId> {
  // ===== 私有状态 =====
  private _props: NotificationState;

  // ===== 构造函数（私有） =====
  private constructor(state: NotificationState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get title(): string {
    return this._props.title;
  }

  public get content(): string {
    return this._props.content;
  }

  public get type(): NotificationType {
    return this._props.type;
  }

  public get category(): NotificationCategory {
    return this._props.category;
  }

  public get importance(): ImportanceLevel {
    return this._props.importance;
  }

  public get status(): NotificationStatus {
    return this._props.status;
  }

  public get isRead(): boolean {
    return this._props.isRead;
  }

  public get readAt(): number | null {
    return this._props.readAt;
  }

  public get actions(): NotificationAction[] | null {
    return this._props.actions ? [...this._props.actions] : null;
  }

  public get metadata(): NotificationMetadata | null {
    return this._props.metadata;
  }

  public get expiresAt(): number | null {
    return this._props.expiresAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get notificationChannels(): NotificationChannel[] | null {
    return this._props.notificationChannels.length > 0 ? [...this._props.notificationChannels] : null;
  }

  // ===== 业务方法 =====

  public send(): void {
    logger.info('📨 [聚合根] 发送通知', {
      id: String(this.id),
      title: this._props.title,
      status: this._props.status,
    });

    if (this._props.status !== NotificationStatus.Pending) {
      logger.error('❌ [聚合根] 通知状态不允许发送', {
        id: String(this.id),
        currentStatus: this._props.status,
      });
      throw new Error('只能发送待发送状态的通知');
    }

    const previousStatus = this._props.status;
    this._props.status = NotificationStatus.Sent;
    this._props.updatedAt = new Date();

    this.addDomainEvent<NotificationEventMap['notification:sent']>('notification:sent', {
      identityId: this._props.identityId as IdentityId,
      notificationId: this.id as NotificationIdBranded,
      notification: this.toServerDTO(),
      channelTypes: this._props.notificationChannels.map((channel) => channel.channelType),
      sentAt: this._props.updatedAt.getTime(),
    });
    this.emitStatusChanged(previousStatus, this._props.status);

    logger.info('✅ [聚合根] 通知已标记为已发送', {
      id: String(this.id),
      status: this._props.status,
    });
  }

  public markAsDelivered(): void {
    if (this._props.status !== NotificationStatus.Sent) {
      throw new Error('只能将已发送状态的通知标记为已送达');
    }
    const previousStatus = this._props.status;
    this._props.status = NotificationStatus.Delivered;
    this._props.updatedAt = new Date();
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public markAsRead(): void {
    if (this._props.isRead) return;

    const previousStatus = this._props.status;
    this._props.isRead = true;
    this._props.readAt = Date.now();
    this._props.status = NotificationStatus.Read;
    this._props.updatedAt = new Date();

    this.addDomainEvent<NotificationEventMap['notification:read']>('notification:read', {
      identityId: this._props.identityId as IdentityId,
      notificationId: this.id as NotificationIdBranded,
      notification: this.toServerDTO(),
      readAt: this._props.readAt,
    });
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public markAsUnread(): void {
    if (!this._props.isRead) return;

    const previousStatus = this._props.status;
    this._props.isRead = false;
    this._props.readAt = null;
    this._props.status = NotificationStatus.Delivered;
    this._props.updatedAt = new Date();
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public cancel(): void {
    if (
      this._props.status === NotificationStatus.Delivered ||
      this._props.status === NotificationStatus.Read
    ) {
      throw new Error('无法取消：通知已交付或已读');
    }

    const previousStatus = this._props.status;
    this._props.status = NotificationStatus.Cancelled;
    this._props.updatedAt = new Date();
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public markAsFailed(): void {
    const previousStatus = this._props.status;
    this._props.status = NotificationStatus.Failed;
    this._props.updatedAt = new Date();
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public updateDetails(patch: {
    title?: string;
    content?: string;
    status?: NotificationStatus;
    metadata?: NotificationMetadataDTO | null;
    expiresAt?: number | null;
  }): void {
    const previousStatus = this._props.status;

    if (patch.title !== undefined) {
      this._props.title = patch.title;
    }
    if (patch.content !== undefined) {
      this._props.content = patch.content;
    }
    if (patch.status !== undefined) {
      this._props.status = patch.status;
    }
    if (patch.metadata !== undefined) {
      this._props.metadata = patch.metadata ? NotificationMetadata.fromDTO(patch.metadata) : null;
    }
    if (patch.expiresAt !== undefined) {
      this._props.expiresAt = patch.expiresAt;
    }

    this._props.updatedAt = new Date();
    this.emitStatusChanged(previousStatus, this._props.status);
  }

  public softDelete(): void {
    if (this._props.deletedAt) {
      return;
    }

    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();

    this.addDomainEvent<NotificationEventMap['notification:deleted']>('notification:deleted', {
      identityId: this._props.identityId as IdentityId,
      notificationId: this.id as NotificationIdBranded,
      notification: this.toServerDTO(),
      isSoftDelete: true,
      deletedAt: this._props.deletedAt.getTime(),
    });
  }

  public isPending(): boolean {
    return this._props.status === NotificationStatus.Pending;
  }

  public isSent(): boolean {
    return this._props.status === NotificationStatus.Sent;
  }

  public isDelivered(): boolean {
    return this._props.status === NotificationStatus.Delivered;
  }

  public hasBeenRead(): boolean {
    return this._props.isRead;
  }

  // ===== 子实体管理 =====

  public addChannel(channel: NotificationChannel): void {
    this._props.notificationChannels.push(channel);
    this._props.updatedAt = new Date();
  }

  public getChannelByType(type: string): NotificationChannel | undefined {
    return this._props.notificationChannels.find((c) => c.channelType === type);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationServerDTO {
    return {
      id: this.id as NotificationId,
      identityId: this._props.identityId,
      title: this._props.title,
      content: this._props.content,
      type: this._props.type,
      category: this._props.category,
      importance: this._props.importance,
      status: this._props.status,
      isRead: this._props.isRead,
      readAt: this._props.readAt,
      actions: this._props.actions?.map((a) => a.toDTO()) ?? null,
      metadata: this._props.metadata?.toDTO() ?? null,
      expiresAt: this._props.expiresAt,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      notificationChannels: this._props.notificationChannels.length > 0
        ? this._props.notificationChannels.map((c) => c.toServerDTO())
        : null,
    };
  }

  // ===== 静态工厂方法 =====

  public static load(state: NotificationState): Notification {
    return new Notification(state);
  }

  public static create(params: {
    identityId: IdentityId;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    actions?: NotificationActionDTO[];
    metadata?: NotificationMetadataDTO;
    expiresAt?: number | null;
  }): Notification {
    logger.info('🔨 [聚合根] 创建 Notification 实例', {
      identityId: String(params.identityId),
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const id = NotificationId.of(NotificationId.generate());
    const now = new Date();

    const notification = new Notification({
      id,
      identityId: params.identityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      importance: params.importance ?? ('Moderate' as ImportanceLevel),
      status: NotificationStatus.Pending,
      isRead: false,
      readAt: null,
      actions: params.actions?.map((a) => NotificationAction.fromDTO(a)) ?? null,
      metadata: params.metadata ? NotificationMetadata.fromDTO(params.metadata) : null,
      expiresAt: params.expiresAt ?? null,
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      notificationChannels: [],
    });

    logger.info('✅ [聚合根] Notification 实例已创建', {
      id: String(notification.id),
      status: notification.status,
    });

    notification.addDomainEvent<NotificationEventMap['notification:created']>('notification:created', {
      identityId: notification.identityId as IdentityId,
      notificationId: notification.id as NotificationIdBranded,
      notification: notification.toServerDTO(),
    });

    return notification;
  }

  private emitStatusChanged(
    previousStatus: NotificationStatus,
    newStatus: NotificationStatus,
  ): void {
    if (previousStatus === newStatus) {
      return;
    }

    this.addDomainEvent<NotificationEventMap['notification:status-changed']>(
      'notification:status-changed',
      {
        identityId: this._props.identityId as IdentityId,
        notificationId: this.id as NotificationIdBranded,
        notification: this.toServerDTO(),
        previousStatus,
        newStatus,
      },
    );
  }
}
