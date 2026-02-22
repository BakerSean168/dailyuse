/**
 * Notification 聚合根实现
 */

import type {
  NotificationServerDTO,
  NotificationActionDTO,
  NotificationMetadataDTO,
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

  public async send(): Promise<void> {
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

    this._props.status = NotificationStatus.Sent;
    this._props.updatedAt = new Date();

    logger.info('✅ [聚合根] 通知已标记为已发送', {
      id: String(this.id),
      status: this._props.status,
    });
  }

  public markAsDelivered(): void {
    if (this._props.status !== NotificationStatus.Sent) {
      throw new Error('只能将已发送状态的通知标记为已送达');
    }
    this._props.status = NotificationStatus.Delivered;
    this._props.updatedAt = new Date();
  }

  public markAsRead(): void {
    if (this._props.isRead) return;

    this._props.isRead = true;
    this._props.readAt = Date.now();
    this._props.status = NotificationStatus.Read;
    this._props.updatedAt = new Date();
  }

  public markAsUnread(): void {
    if (!this._props.isRead) return;

    this._props.isRead = false;
    this._props.readAt = null;
    this._props.status = NotificationStatus.Delivered;
    this._props.updatedAt = new Date();
  }

  public cancel(): void {
    if (
      this._props.status === NotificationStatus.Delivered ||
      this._props.status === NotificationStatus.Read
    ) {
      throw new Error('无法取消：通知已交付或已读');
    }

    this._props.status = NotificationStatus.Cancelled;
    this._props.updatedAt = new Date();
  }

  public markAsFailed(): void {
    this._props.status = NotificationStatus.Failed;
    this._props.updatedAt = new Date();
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
      id: String(this.id) as NotificationId,
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

    return notification;
  }
}
