/**
 * SyncDeviceInfo 值对象
 * 同步设备信息（与 authentication 模块的 DeviceInfo 区分）
 */

import { ValueObject } from '@dailyuse/utils';
import type { DeviceInfoDTO } from '@dailyuse/contracts/sync';

/**
 * SyncDeviceInfo 值对象
 *
 * 描述参与同步的设备
 */
export class SyncDeviceInfo extends ValueObject {
  public readonly deviceId: string;
  public readonly deviceName: string;
  public readonly deviceType: 'desktop' | 'web' | 'mobile';
  public readonly os: string;
  public readonly appVersion: string;
  public readonly lastActiveAt: number;

  private constructor(params: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'web' | 'mobile';
    os: string;
    appVersion: string;
    lastActiveAt: number;
  }) {
    super();
    this.deviceId = params.deviceId;
    this.deviceName = params.deviceName;
    this.deviceType = params.deviceType;
    this.os = params.os;
    this.appVersion = params.appVersion;
    this.lastActiveAt = params.lastActiveAt;
    Object.freeze(this);
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建设备信息
   */
  static create(params: {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'web' | 'mobile';
    os: string;
    appVersion: string;
  }): SyncDeviceInfo {
    if (!params.deviceId || params.deviceId.trim() === '') {
      throw new Error('SyncDeviceInfo: deviceId cannot be empty');
    }
    return new SyncDeviceInfo({
      ...params,
      lastActiveAt: Date.now(),
    });
  }

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: DeviceInfoDTO): SyncDeviceInfo {
    return new SyncDeviceInfo({
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      deviceType: dto.deviceType,
      os: dto.os,
      appVersion: dto.appVersion,
      lastActiveAt: dto.lastActiveAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新最后活跃时间
   */
  touch(): SyncDeviceInfo {
    return new SyncDeviceInfo({
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType,
      os: this.os,
      appVersion: this.appVersion,
      lastActiveAt: Date.now(),
    });
  }

  /**
   * 判断设备是否离线
   */
  isOffline(thresholdMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this.lastActiveAt > thresholdMs;
  }

  // ===== ValueObject 方法 =====

  equals(other: ValueObject): boolean {
    if (!(other instanceof SyncDeviceInfo)) return false;
    return this.deviceId === other.deviceId;
  }

  // ===== DTO 转换 =====

  toDTO(): DeviceInfoDTO {
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType,
      os: this.os,
      appVersion: this.appVersion,
      lastActiveAt: this.lastActiveAt,
    };
  }
}
