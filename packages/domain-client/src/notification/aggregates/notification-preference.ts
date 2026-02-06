/**
 * NotificationPreference Aggregate Root - Domain Client
 * 通知偏好聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 NotificationPreferenceClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
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

// 内部状态接口
interface NotificationPreferenceState {
  id: NotificationPreferenceId;
  identityId: IdentityId;
  settings: Record<string, NotificationChannelType[]>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class NotificationPreference extends AggregateRoot<NotificationPreferenceId> implements NotificationPreferenceClient {
  private readonly _props: NotificationPreferenceState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: NotificationPreferenceState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get settings(): Record<string, NotificationChannelType[]> {
    return this._props.settings;
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

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  /**
   * 获取指定模块的通知渠道设置
   */
  getModuleChannels(moduleName: string): NotificationChannelType[] {
    return this._props.settings[moduleName] ?? [];
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
      identityId: this._props.identityId as unknown as string,
      settings: this._props.settings,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
