/**
 * Notification Aggregate Root - Domain Client
 * 通知聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 NotificationClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: NotificationClientDTO): Notification
 * - Instance toDTO(): NotificationClientDTO
 */

import type {
  NotificationClient,
  NotificationClientDTO,
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '@dailyuse/contracts/notification';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { IdentityId as IIdentityId, NotificationId as INotificationId } from '@dailyuse/contracts/primitives';
import { AggregateRoot } from '@dailyuse/utils';
import {
  NotificationId,
  NotificationAction,
  NotificationMetadata,
} from '@dailyuse/domain-shared/notification';
import { IdentityId } from '@dailyuse/domain-shared';
import { NotificationChannel } from '../entities/notification-channel.js';

// 内部状态接口
interface NotificationState {
  id: NotificationId;
  identityId: IdentityId;
  title: string;
  content: string;
  type: NotificationType;
  category: NotificationCategory;
  importance: ImportanceLevel;
  status: NotificationStatus;
  readAt: Date | null;
  actions: NotificationAction[] | null;
  metadata: NotificationMetadata | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  notificationChannels: NotificationChannel[] | null;
}

export class Notification extends AggregateRoot<NotificationId> implements NotificationClient {
  // ================= 1. Props =================
  private readonly _props: NotificationState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: NotificationState) {
    super(NotificationId.of(props.id));
    this._props = props;
  }

  // ================= 3. Getters =================
  get identityId(): IIdentityId {
    return this._props.identityId;
  }

  get title(): string {
    return this._props.title;
  }

  get content(): string {
    return this._props.content;
  }

  get type(): NotificationType {
    return this._props.type;
  }

  get category(): NotificationCategory {
    return this._props.category;
  }

  get importance(): ImportanceLevel {
    return this._props.importance;
  }

  get status(): NotificationStatus {
    return this._props.status;
  }

  get readAt(): Date | null | undefined {
    return this._props.readAt as Date | null | undefined;
  }

  get actions(): NotificationAction[] | null | undefined {
    return this._props.actions as NotificationAction[] | null | undefined;
  }

  get metadata(): NotificationMetadata | null | undefined {
    return this._props.metadata as NotificationMetadata | null | undefined;
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

  get notificationChannels(): NotificationChannel[] | null | undefined {
    return this._props.notificationChannels as NotificationChannel[] | null | undefined;
  }

  // UI 计算属性
  get isRead(): boolean {
    return this._props.readAt !== null && this._props.readAt !== undefined;
  }

  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isPending(): boolean {
    return this._props.status === 'Pending';
  }

  get isSent(): boolean {
    return this._props.status === 'Sent';
  }

  get isDelivered(): boolean {
    return this._props.status === 'Delivered';
  }

  get isFailed(): boolean {
    return this._props.status === 'Failed';
  }

  get hasActions(): boolean {
    const actions = this._props.actions;
    return actions !== null && actions !== undefined && actions.length > 0;
  }

  get displayTitle(): string {
    return this._props.title;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: NotificationClientDTO): Notification {
    return new Notification({
      id: NotificationId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      title: dto.title,
      content: dto.content,
      type: dto.type,
      category: dto.category,
      importance: dto.importance,
      status: dto.status,
      readAt: dto.readAt ? new Date(dto.readAt) : null,
      actions: dto.actions?.map(a => NotificationAction.fromDTO(a)) ?? null,
      metadata: dto.metadata ? NotificationMetadata.fromDTO(dto.metadata) : null,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      notificationChannels: dto.notificationChannels?.map(c => NotificationChannel.fromDTO(c)) ?? null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): NotificationClientDTO {
    const actions = this._props.actions as NotificationAction[] | null | undefined;
    const metadata = this._props.metadata as NotificationMetadata | null | undefined;
    const readAt = this._props.readAt as Date | null | undefined;
    const createdAt = this._props.createdAt as Date;
    const updatedAt = this._props.updatedAt as Date;
    const deletedAt = this._props.deletedAt as Date | null;
    const notificationChannels = this._props.notificationChannels as NotificationChannel[] | null | undefined;
    return {
      id: this.id as unknown as string,
      identityId: this._props.identityId as unknown as string,
      title: this._props.title,
      content: this._props.content,
      type: this._props.type,
      category: this._props.category,
      importance: this._props.importance,
      status: this._props.status,
      isRead: this.isRead,
      readAt: readAt?.getTime() ?? null,
      actions: actions?.map(a => a.toDTO()) ?? null,
      metadata: metadata?.toDTO() ?? null,
      version: this._props.version,
      createdAt: createdAt.getTime(),
      updatedAt: updatedAt.getTime(),
      deletedAt: deletedAt?.getTime() ?? null,
      notificationChannels: notificationChannels?.map(c => c.toDTO()) ?? null,
    };
  }
}
