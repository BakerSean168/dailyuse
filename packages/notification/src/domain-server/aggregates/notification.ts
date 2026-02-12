/**
 * Notification 聚合根实现
 * 实现 NotificationServer 接口
 */

import type {
  NotificationServer,
  NotificationServerDTO,
  NotificationPersistenceDTO,
  NotificationActionDTO,
  NotificationMetadataDTO,
  NotificationChannelServer,
} from '@dailyuse/contracts/notification';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '@dailyuse/contracts/notification';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot, createLogger } from '@dailyuse/utils';
import {
  NotificationId,
  NotificationAction,
  NotificationMetadata,
} from '../../domain-shared/value-objects';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';
import { NotificationChannel } from '../entities/notification-channel';

const logger = createLogger('Notification');

/**
 * Notification 聚合根
 */
export class Notification
  extends AggregateRoot<NotificationId>
  implements NotificationServer
{
  // ===== 私有字段 =====
  private _identityId: IdentityId;
  private _title: string;
  private _content: string;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _importance: ImportanceLevel;
  private _status: NotificationStatus;
  private _isRead: boolean;
  private _readAt: number | null;
  private _actions: NotificationAction[] | null;
  private _metadata: NotificationMetadata | null;
  private _version: number;
  private _deletedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 子实体集合 =====
  private _notificationChannels: NotificationChannel[];

  // ===== 构造函数（私有） =====
  private constructor(
    id: NotificationId,
    params: {
      identityId: IdentityId;
      title: string;
      content: string;
      type: NotificationType;
      category: NotificationCategory;
      importance: ImportanceLevel;
      status: NotificationStatus;
      isRead: boolean;
      readAt?: number | null;
      actions?: NotificationAction[] | null;
      metadata?: NotificationMetadata | null;
      version: number;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    super(id);
    this._identityId = params.identityId;
    this._title = params.title;
    this._content = params.content;
    this._type = params.type;
    this._category = params.category;
    this._importance = params.importance;
    this._status = params.status;
    this._isRead = params.isRead;
    this._readAt = params.readAt ?? null;
    this._actions = params.actions ?? null;
    this._metadata = params.metadata ?? null;
    this._version = params.version;
    this._deletedAt = params.deletedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._notificationChannels = [];
  }

  // ===== Getter 属性 =====
  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get title(): string {
    return this._title;
  }

  public get content(): string {
    return this._content;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get category(): NotificationCategory {
    return this._category;
  }

  public get importance(): ImportanceLevel {
    return this._importance;
  }

  public get status(): NotificationStatus {
    return this._status;
  }

  public get isRead(): boolean {
    return this._isRead;
  }

  public get readAt(): number | null {
    return this._readAt;
  }

  public get actions(): NotificationAction[] | null {
    return this._actions ? [...this._actions] : null;
  }

  public get metadata(): NotificationMetadata | null {
    return this._metadata;
  }

  public get version(): number {
    return this._version;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get notificationChannels(): NotificationChannelServer[] | null {
    return this._notificationChannels.length > 0 ? [...this._notificationChannels] : null;
  }

  // ===== 业务方法 =====

  public async send(): Promise<void> {
    logger.info('📨 [聚合根] 发送通知', {
      id: String(this.id),
      title: this._title,
      status: this._status,
    });

    if (this._status !== NotificationStatus.Pending) {
      logger.error('❌ [聚合根] 通知状态不允许发送', {
        id: String(this.id),
        currentStatus: this._status,
      });
      throw new Error('只能发送待发送状态的通知');
    }

    this._status = NotificationStatus.Sent;
    this._updatedAt = new Date();

    logger.info('✅ [聚合根] 通知已标记为已发送', {
      id: String(this.id),
      status: this._status,
    });
  }

  public markAsDelivered(): void {
    if (this._status !== NotificationStatus.Sent) {
      throw new Error('只能将已发送状态的通知标记为已送达');
    }
    this._status = NotificationStatus.Delivered;
    this._updatedAt = new Date();
  }

  public markAsRead(): void {
    if (this._isRead) return;

    this._isRead = true;
    this._readAt = Date.now();
    this._status = NotificationStatus.Read;
    this._updatedAt = new Date();
  }

  public markAsUnread(): void {
    if (!this._isRead) return;

    this._isRead = false;
    this._readAt = null;
    this._status = NotificationStatus.Delivered;
    this._updatedAt = new Date();
  }

  public cancel(): void {
    if (
      this._status === NotificationStatus.Delivered ||
      this._status === NotificationStatus.Read
    ) {
      throw new Error('无法取消：通知已交付或已读');
    }

    this._status = NotificationStatus.Cancelled;
    this._updatedAt = new Date();
  }

  public markAsFailed(): void {
    this._status = NotificationStatus.Failed;
    this._updatedAt = new Date();
  }

  public isPending(): boolean {
    return this._status === NotificationStatus.Pending;
  }

  public isSent(): boolean {
    return this._status === NotificationStatus.Sent;
  }

  public isDelivered(): boolean {
    return this._status === NotificationStatus.Delivered;
  }

  public hasBeenRead(): boolean {
    return this._isRead;
  }

  // ===== 子实体管理 =====

  public addChannel(channel: NotificationChannel): void {
    this._notificationChannels.push(channel);
    this._updatedAt = new Date();
  }

  public getChannelByType(type: string): NotificationChannel | undefined {
    return this._notificationChannels.find((c) => c.channelType === type);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationServerDTO {
    return {
      id: String(this.id) as NotificationId,
      identityId: this._identityId,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt,
      actions: this._actions?.map((a) => a.toDTO()) ?? null,
      metadata: this._metadata?.toDTO() ?? null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
      notificationChannels: this._notificationChannels.length > 0
        ? this._notificationChannels.map((c) => c.toServerDTO())
        : null,
    };
  }

  public toPersistenceDTO(): NotificationPersistenceDTO {
    return {
      id: String(this.id) as NotificationId,
      identityId: this._identityId,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt ? new Date(this._readAt) : null,
      actions: this._actions?.map((a) => a.toPersistenceDTO()) ?? null,
      metadata: this._metadata?.toPersistenceDTO() ?? null,
      notificationChannels: this._notificationChannels.length > 0
        ? JSON.stringify(this._notificationChannels.map((c) => c.toPersistenceDTO()))
        : null,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    identityId: IdentityId;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    actions?: NotificationActionDTO[];
    metadata?: NotificationMetadataDTO;
  }): Notification {
    logger.info('🔨 [聚合根] 创建 Notification 实例', {
      identityId: String(params.identityId),
      title: params.title,
      type: params.type,
      category: params.category,
    });

    const id = NotificationId.of(NotificationId.generate());
    const now = new Date();

    const notification = new Notification(id, {
      identityId: params.identityId,
      title: params.title,
      content: params.content,
      type: params.type,
      category: params.category,
      importance: params.importance ?? ('Moderate' as ImportanceLevel),
      status: NotificationStatus.Pending,
      isRead: false,
      actions: params.actions?.map((a) => NotificationAction.fromDTO(a)) ?? null,
      metadata: params.metadata ? NotificationMetadata.fromDTO(params.metadata) : null,
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    logger.info('✅ [聚合根] Notification 实例已创建', {
      id: String(notification.id),
      status: notification.status,
    });

    return notification;
  }

  public static fromServerDTO(dto: NotificationServerDTO): Notification {
    const id = NotificationId.of(dto.id);

    const notification = new Notification(id, {
      identityId: IdentityIdType.of(dto.identityId),
      title: dto.title,
      content: dto.content,
      type: dto.type,
      category: dto.category,
      importance: dto.importance,
      status: dto.status,
      isRead: dto.isRead,
      readAt: dto.readAt ?? null,
      actions: dto.actions?.map((a) => NotificationAction.fromDTO(a)) ?? null,
      metadata: dto.metadata ? NotificationMetadata.fromDTO(dto.metadata) : null,
      version: dto.version,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });

    if (dto.notificationChannels) {
      for (const channelDto of dto.notificationChannels) {
        notification._notificationChannels.push(NotificationChannel.fromServerDTO(channelDto));
      }
    }

    return notification;
  }

  public static fromPersistenceDTO(dto: NotificationPersistenceDTO): Notification {
    const id = NotificationId.of(dto.id);

    const notification = new Notification(id, {
      identityId: IdentityIdType.of(dto.identityId),
      title: dto.title,
      content: dto.content,
      type: dto.type,
      category: dto.category,
      importance: dto.importance,
      status: dto.status,
      isRead: dto.isRead,
      readAt: dto.readAt ? dto.readAt.getTime() : null,
      actions: dto.actions?.map((a) => NotificationAction.fromPersistenceDTO(a)) ?? null,
      metadata: dto.metadata ? NotificationMetadata.fromPersistenceDTO(dto.metadata) : null,
      version: dto.version,
      deletedAt: dto.deletedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });

    if (dto.notificationChannels) {
      const channelDtos = JSON.parse(dto.notificationChannels);
      for (const channelDto of channelDtos) {
        notification._notificationChannels.push(NotificationChannel.fromPersistenceDTO(channelDto));
      }
    }

    return notification;
  }
}
