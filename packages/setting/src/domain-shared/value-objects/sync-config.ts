/**
 * SyncConfig 值对象
 * 
 * 同步配置：enabled、syncToCloud、syncToDevices
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  SyncConfigDTO,
  SyncConfigPersistenceDTO,
  SyncConfig as ISyncConfig,
} from '@dailyuse/contracts/setting';

/**
 * SyncConfig 值对象实现
 */
export class SyncConfig extends ValueObject<SyncConfigDTO> implements ISyncConfig {

  private constructor(props: SyncConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: SyncConfigDTO): SyncConfig {
    return new SyncConfig(props);
  }

  public static createDefault(): SyncConfig {
    return new SyncConfig({
      enabled: true,
      syncToCloud: true,
      syncToDevices: true,
    });
  }

  public static createDisabled(): SyncConfig {
    return new SyncConfig({
      enabled: false,
      syncToCloud: false,
      syncToDevices: false,
    });
  }

  public static createCloudOnly(): SyncConfig {
    return new SyncConfig({
      enabled: true,
      syncToCloud: true,
      syncToDevices: false,
    });
  }

  public static fromDTO(dto: SyncConfigDTO): SyncConfig {
    return new SyncConfig(dto);
  }

  public static fromPersistenceDTO(dto: SyncConfigPersistenceDTO): SyncConfig {
    return new SyncConfig({
      enabled: dto.enabled,
      syncToCloud: dto.syncToCloud,
      syncToDevices: dto.syncToDevices,
    });
  }

  // ================= Getters =================

  public get enabled(): boolean {
    return this.props.enabled;
  }

  public get syncToCloud(): boolean {
    return this.props.syncToCloud;
  }

  public get syncToDevices(): boolean {
    return this.props.syncToDevices;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<SyncConfigDTO>,
  ): SyncConfig {
    return new SyncConfig({ ...this.props, ...updates });
  }

  public enable(): SyncConfig {
    return this.with({ enabled: true });
  }

  public disable(): SyncConfig {
    return this.with({
      enabled: false,
      syncToCloud: false,
      syncToDevices: false,
    });
  }

  public setSyncToCloud(syncToCloud: boolean): SyncConfig {
    return this.with({ syncToCloud });
  }

  public setSyncToDevices(syncToDevices: boolean): SyncConfig {
    return this.with({ syncToDevices });
  }

  // ================= 计算属性 =================

  public get isDisabled(): boolean {
    return !this.props.enabled;
  }

  public get isFullSync(): boolean {
    return this.props.enabled && this.props.syncToCloud && this.props.syncToDevices;
  }

  public get isCloudOnly(): boolean {
    return this.props.enabled && this.props.syncToCloud && !this.props.syncToDevices;
  }

  public get isDevicesOnly(): boolean {
    return this.props.enabled && !this.props.syncToCloud && this.props.syncToDevices;
  }

  public get syncDescription(): string {
    if (!this.props.enabled) return '同步已禁用';
    if (this.isFullSync) return '云端 + 设备间同步';
    if (this.isCloudOnly) return '仅云端同步';
    if (this.isDevicesOnly) return '仅设备间同步';
    return '同步已启用';
  }

  // ================= 序列化 =================

  public toDTO(): SyncConfigDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): SyncConfigPersistenceDTO {
    return { ...this.props };
  }
}
