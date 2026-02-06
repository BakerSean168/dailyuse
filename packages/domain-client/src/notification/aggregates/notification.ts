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
  NotificationChannelClientDTO,
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '@dailyuse/contracts/notification';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import {
  NotificationId,
  NotificationAction,
  NotificationMetadata,
} from '@dailyuse/domain-shared/notification';
import { IdentityId } from '@dailyuse/domain-shared';
import { NotificationChannel } from '../entities/notification-channel.js';

export class Notification extends AggregateRoot<NotificationId> implements NotificationClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _title: string;
  private _content: string;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _importance: ImportanceLevel;
  private _status: NotificationStatus;
  private _isRead: boolean;
  private _readAt: Date | null;
  private _actions: NotificationAction[] | null;
  private _metadata: NotificationMetadata | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _notificationChannels: NotificationChannel[] | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: NotificationId;
    identityId: IdentityId;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance: ImportanceLevel;
    status: NotificationStatus;
    isRead: boolean;
    readAt: Date | null;
    actions: NotificationAction[] | null;
    metadata: NotificationMetadata | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    notificationChannels: NotificationChannel[] | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._title = params.title;
    this._content = params.content;
    this._type = params.type;
    this._category = params.category;
    this._importance = params.importance;
    this._status = params.status;
    this._isRead = params.isRead;
    this._readAt = params.readAt;
    this._actions = params.actions;
    this._metadata = params.metadata;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._notificationChannels = params.notificationChannels;
  }

  // ================= 3. Getters =================
  get identityId(): string {
    return this._identityId as unknown as string;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get type(): NotificationType {
    return this._type;
  }

  get category(): NotificationCategory {
    return this._category;
  }

  get importance(): ImportanceLevel {
    return this._importance;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  get actions(): NotificationAction[] | null {
    return this._actions;
  }

  get metadata(): NotificationMetadata | null {
    return this._metadata;
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

  get notificationChannels(): NotificationChannel[] | null {
    return this._notificationChannels;
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

  get isDelivered(): boolean {
    return this._status === 'Delivered';
  }

  get isFailed(): boolean {
    return this._status === 'Failed';
  }

  get hasActions(): boolean {
    return this._actions !== null && this._actions.length > 0;
  }

  get displayTitle(): string {
    return this._title;
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
      isRead: dto.isRead,
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
    return {
      id: this.id as unknown as string,
      identityId: this._identityId as unknown as string,
      title: this._title,
      content: this._content,
      type: this._type,
      category: this._category,
      importance: this._importance,
      status: this._status,
      isRead: this._isRead,
      readAt: this._readAt?.getTime() ?? null,
      actions: this._actions?.map(a => a.toDTO()) ?? null,
      metadata: this._metadata?.toDTO() ?? null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      notificationChannels: this._notificationChannels?.map(c => c.toDTO()) ?? null,
    };
  }
}
