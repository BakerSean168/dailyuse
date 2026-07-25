/**
 * DeviceInfo Value Object
 * 设备信息值对象
 *
 * Residual 847: DeviceInfoDTO dual retired — sole DeviceInfo interface + type alias.
 * (OpenAPI AuthSession uses a slim DeviceInfoSchema subset in api/response-schemas.ts —
 * that is intentionally not the full VO shape.)
 * Residual 881: DeviceInfoClientDTO (desktop protocol) remains separate slim client dual.
 */

import type { DeviceType } from './device-type';

// ============ 值对象接口（sole body） ============

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

// Residual 847: DeviceInfoDTO dual retired — DTO is the DeviceInfo shape (no second interface body).
export type DeviceInfoDTO = DeviceInfo;
