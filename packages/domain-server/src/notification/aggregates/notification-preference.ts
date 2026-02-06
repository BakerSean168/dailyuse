/**
 * NotificationPreference 聚合根实现
 * 实现 NotificationPreferenceServer 接口
 */

import type {
  NotificationPreferenceServer,
  NotificationPreferenceServerDTO,
  NotificationPreferencePersistenceDTO,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { AggregateRoot } from '@dailyuse/utils';
import {
  NotificationPreferenceId,
} from '@dailyuse/domain-shared/notification';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';

/**
 * NotificationPreference 聚合根
 * 负责用户通知偏好设置的管理
 * 
 * 设计说明:
 * - settings: Map<moduleName, channelTypes[]> 记录每个模块启用的渠道
 * - 例如: task -> [InApp, Email], system -> [InApp]
 */
export class NotificationPreference
  extends AggregateRoot<NotificationPreferenceId>
  implements NotificationPreferenceServer
{
  // ===== 私有字段 =====
  private _identityId: IdentityId;
  private _settings: Map<string, NotificationChannelType[]>;
  private _version: number;
  private _deletedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(
    id: NotificationPreferenceId,
    identityId: IdentityId,
    settings: Map<string, NotificationChannelType[]>,
    version: number,
    deletedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._identityId = identityId;
    this._settings = settings;
    this._version = version;
    this._deletedAt = deletedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ===== Getter 属性 =====
  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get settings(): Map<string, NotificationChannelType[]> {
    return new Map(this._settings);
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

  // ===== 业务方法 =====

  /**
   * 获取模块的渠道配置
   */
  public getModuleChannels(moduleName: string): NotificationChannelType[] {
    return this._settings.get(moduleName) ?? [];
  }

  /**
   * 设置模块的渠道配置
   */
  public setModuleChannels(moduleName: string, channels: NotificationChannelType[]): void {
    this._settings.set(moduleName, [...channels]);
  }

  /**
   * 启用模块的某个渠道
   */
  public enableChannel(moduleName: string, channel: NotificationChannelType): void {
    const channels = this._settings.get(moduleName) ?? [];
    if (!channels.includes(channel)) {
      channels.push(channel);
      this._settings.set(moduleName, channels);
    }
  }

  /**
   * 禁用模块的某个渠道
   */
  public disableChannel(moduleName: string, channel: NotificationChannelType): void {
    const channels = this._settings.get(moduleName) ?? [];
    const index = channels.indexOf(channel);
    if (index !== -1) {
      channels.splice(index, 1);
      this._settings.set(moduleName, channels);
    }
  }

  /**
   * 禁用模块的所有通知
   */
  public disableModule(moduleName: string): void {
    this._settings.set(moduleName, []);
  }

  /**
   * 判断是否应该发送通知
   */
  public shouldSendNotification(moduleName: string, channel: NotificationChannelType): boolean {
    const channels = this._settings.get(moduleName);
    if (!channels) {
      return false; // 未配置的模块不发送
    }
    return channels.includes(channel);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationPreferenceServerDTO {
    const settingsRecord: Record<string, NotificationChannelType[]> = {};
    for (const [key, value] of this._settings) {
      settingsRecord[key] = [...value];
    }

    return {
      id: String(this.id),
      identityId: this._identityId,
      settings: settingsRecord,
      version: this._version,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toPersistenceDTO(): NotificationPreferencePersistenceDTO {
    const settingsRecord: Record<string, NotificationChannelType[]> = {};
    for (const [key, value] of this._settings) {
      settingsRecord[key] = [...value];
    }

    return {
      id: String(this.id),
      identityId: this._identityId,
      settings: JSON.stringify(settingsRecord),
      version: this._version,
      deletedAt: this._deletedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的通知偏好
   */
  public static create(params: {
    identityId: IdentityId;
    defaultChannels?: NotificationChannelType[];
  }): NotificationPreference {
    const id = NotificationPreferenceId.of(NotificationPreferenceId.generate());
    const settings = new Map<string, NotificationChannelType[]>();

    // 可以为常用模块设置默认渠道
    if (params.defaultChannels && params.defaultChannels.length > 0) {
      const defaultModules = ['task', 'goal', 'schedule', 'reminder', 'system'];
      for (const moduleName of defaultModules) {
        settings.set(moduleName, [...params.defaultChannels]);
      }
    }

    const now = new Date();
    return new NotificationPreference(
      id,
      params.identityId,
      settings,
      1,
      null,
      now,
      now,
    );
  }

  /**
   * 从 Server DTO 还原
   */
  public static fromServerDTO(dto: NotificationPreferenceServerDTO): NotificationPreference {
    const id = NotificationPreferenceId.of(dto.id);
    const settings = new Map<string, NotificationChannelType[]>();

    for (const [key, value] of Object.entries(dto.settings)) {
      settings.set(key, [...value]);
    }

    return new NotificationPreference(
      id,
      IdentityIdType.of(dto.identityId),
      settings,
      dto.version,
      dto.deletedAt ? new Date(dto.deletedAt) : null,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
    );
  }

  /**
   * 从持久化 DTO 还原
   */
  public static fromPersistenceDTO(
    dto: NotificationPreferencePersistenceDTO,
  ): NotificationPreference {
    const id = NotificationPreferenceId.of(dto.id);
    const settingsRecord = JSON.parse(dto.settings) as Record<string, NotificationChannelType[]>;
    const settings = new Map<string, NotificationChannelType[]>();

    for (const [key, value] of Object.entries(settingsRecord)) {
      settings.set(key, [...value]);
    }

    return new NotificationPreference(
      id,
      IdentityIdType.of(dto.identityId),
      settings,
      dto.version,
      dto.deletedAt ? new Date(dto.deletedAt) : null,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
    );
  }
}
