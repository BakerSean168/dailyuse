/**
 * DeviceInfo Value Object
 * 设备信息值对象
 */

import type { DeviceType } from './device-type';

// ============ 值对象接口 ============

export interface DeviceInfo {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: DeviceType;
  deviceName: string | null;
  os: string | null;
  osVersion: string | null;
  browser: string | null;
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

// ============ DTO 定义 ============

export interface DeviceInfoDTO {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: DeviceType;
  deviceName: string | null;
  os: string | null;
  /** 操作系统版本 */
  osVersion: string | null;
  browser: string | null;
  /** 应用版本（Desktop/Mobile） */
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface DeviceInfoPersistenceDTO {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: DeviceType;
  deviceName: string | null;
  os: string | null;
  /** 操作系统版本 */
  osVersion: string | null;
  browser: string | null;
  /** 应用版本（Desktop/Mobile） */
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
  } | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
}
