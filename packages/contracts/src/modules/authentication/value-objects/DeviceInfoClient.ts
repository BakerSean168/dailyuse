/**
 * DeviceInfo Value Object - Client Interface
 * 设备信息值对象 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * DeviceInfo Client DTO
 */
export interface DeviceInfoClientDTO {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
  deviceName?: string | null;
  os?: string | null;
  /** 操作系统版本 */
  osVersion?: string | null;
  browser?: string | null;
  /** 应用版本（Desktop/Mobile） */
  appVersion?: string | null;
  ipAddress?: string | null;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

// ============ 值对象接口 ============

export interface DeviceInfoClient {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
  deviceName?: string | null;
  os?: string | null;
  /** 操作系统版本 */
  osVersion?: string | null;
  browser?: string | null;
  /** 应用版本（Desktop/Mobile） */
  appVersion?: string | null;
  ipAddress?: string | null;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;

  toClientDTO(): DeviceInfoClientDTO;
}

export interface DeviceInfoClientStatic {
  fromClientDTO(dto: DeviceInfoClientDTO): DeviceInfoClient;
}
