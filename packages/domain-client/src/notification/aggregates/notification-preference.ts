/**
 * NotificationPreference Aggregate Root - Domain Client
 * 通知偏好聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 NotificationPreferenceClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: NotificationPreferenceClientDTO): NotificationPreference
 * - Instance toDTO(): NotificationPreferenceClientDTO
 */

import type {
  NotificationPreferenceClient,
  NotificationPreferenceClientDTO,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import { AggregateRoot } from '@dailyuse/utils';
import { NotificationPreferenceId } from '@dailyuse/domain-shared/notification';
import { IdentityId } from '@dailyuse/domain-shared';

export class NotificationPreference extends AggregateRoot<NotificationPreferenceId> implements NotificationPreferenceClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _settings: Record<string, NotificationChannelType[]>;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: NotificationPreferenceId;
    identityId: IdentityId;
    settings: Record<string, NotificationChannelType[]>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._settings = params.settings;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get settings(): Record<string, NotificationChannelType[]> {
    return this._settings;
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

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * 获取指定模块的通知渠道设置
   */
  getModuleChannels(moduleName: string): NotificationChannelType[] {
    return this._settings[moduleName] ?? [];
  }

  /**
   * 检查指定模块是否启用了特定渠道
   */
  isChannelEnabled(moduleName: string, channelType: NotificationChannelType): boolean {
    const channels = this.getModuleChannels(moduleName);
    return channels.includes(channelType);
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: NotificationPreferenceClientDTO): NotificationPreference {
    return new NotificationPreference({
      id: NotificationPreferenceId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      settings: dto.settings,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): NotificationPreferenceClientDTO {
    return {
      id: this.id as unknown as string,
      identityId: this._identityId as unknown as string,
      settings: this._settings,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
