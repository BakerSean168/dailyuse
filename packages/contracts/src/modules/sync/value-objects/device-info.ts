/**
 * Device Info Value Object
 * 设备信息值对�?
 */

// ============ DTO 定义 ============

export interface DeviceInfoDTO {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'web' | 'mobile';
  os: string;
  appVersion: string;
  lastActiveAt: number;
}

// ============ 接口定义 ============

export interface IDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'web' | 'mobile';
  os: string;
  appVersion: string;
  lastActiveAt: number;

  equals(other: IDeviceInfo): boolean;
  toDTO(): DeviceInfoDTO;
}

): IDeviceInfo;
  fromDTO(dto: DeviceInfoDTO): IDeviceInfo;
}
