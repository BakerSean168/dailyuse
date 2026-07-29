/**
 * NotificationPreference 聚合根实现
 */

import type {
  NotificationPreferenceServerDTO,
  NotificationPreferenceClientDTO,
  NotificationChannelType,
} from '@memoflow/contracts/notification';
import type { IdentityId, NotificationPreferenceId as NotificationPreferenceIdBranded } from '@memoflow/contracts/primitives';
import { AggregateRoot } from '@memoflow/utils/domain';
import {
  NotificationPreferenceId,
} from '../value-objects/notification-preference-id';

/**
 * NotificationPreference 内部状态接口
 */
export interface NotificationPreferenceState {
  id: NotificationPreferenceId;
  identityId: IdentityId;
  settings: Map<string, NotificationChannelType[]>;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationPreference 聚合根
 * 负责用户通知偏好设置的管理
 * 
 * 设计说明:
 * - settings: Map<moduleName, channelTypes[]> 记录每个模块启用的渠道
 * - 例如: task -> [InApp, Email], system -> [InApp]
 */
export class NotificationPreference extends AggregateRoot<NotificationPreferenceId> {
  // ===== 私有状态 =====
  private _props: NotificationPreferenceState;

  // ===== 构造函数（私有） =====
  private constructor(state: NotificationPreferenceState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get settings(): Map<string, NotificationChannelType[]> {
    return new Map(this._props.settings);
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

  // ===== 业务方法 =====

  /**
   * 获取模块的渠道配置
   */
  public getModuleChannels(moduleName: string): NotificationChannelType[] {
    return this._props.settings.get(moduleName) ?? [];
  }

  /**
   * 设置模块的渠道配置
   */
  public setModuleChannels(moduleName: string, channels: NotificationChannelType[]): void {
    this._props.settings.set(moduleName, [...channels]);
  }

  /**
   * 启用模块的某个渠道
   */
  public enableChannel(moduleName: string, channel: NotificationChannelType): void {
    const channels = this._props.settings.get(moduleName) ?? [];
    if (!channels.includes(channel)) {
      channels.push(channel);
      this._props.settings.set(moduleName, channels);
    }
  }

  /**
   * 禁用模块的某个渠道
   */
  public disableChannel(moduleName: string, channel: NotificationChannelType): void {
    const channels = this._props.settings.get(moduleName) ?? [];
    const index = channels.indexOf(channel);
    if (index !== -1) {
      channels.splice(index, 1);
      this._props.settings.set(moduleName, channels);
    }
  }

  /**
   * 禁用模块的所有通知
   */
  public disableModule(moduleName: string): void {
    this._props.settings.set(moduleName, []);
  }

  /**
   * 判断是否应该发送通知
   */
  public shouldSendNotification(moduleName: string, channel: NotificationChannelType): boolean {
    const channels = this._props.settings.get(moduleName);
    if (!channels) {
      return false; // 未配置的模块不发送
    }
    return channels.includes(channel);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationPreferenceServerDTO {
    const settingsRecord: Record<string, NotificationChannelType[]> = {};
    for (const [key, value] of this._props.settings) {
      settingsRecord[key] = [...value];
    }

    return {
      id: this.id as NotificationPreferenceIdBranded,
      identityId: this._props.identityId,
      settings: settingsRecord,
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  public toClientDTO(): NotificationPreferenceClientDTO {
    const settingsRecord: Record<string, NotificationChannelType[]> = {};
    for (const [key, value] of this._props.settings) {
      settingsRecord[key] = [...value];
    }
    return {
      id: this.id as NotificationPreferenceIdBranded,
      identityId: this._props.identityId,
      settings: settingsRecord,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  // ===== 静态工厂方法 =====

  public static load(state: NotificationPreferenceState): NotificationPreference {
    return new NotificationPreference(state);
  }

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
    return new NotificationPreference({
      id,
      identityId: params.identityId,
      settings,
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
