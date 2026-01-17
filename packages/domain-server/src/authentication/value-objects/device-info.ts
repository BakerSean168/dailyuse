/**
 * DeviceInfo 值对象实现
 * 实现 DeviceInfoServer 接口
 */

import type { DeviceInfoClientDTO, DeviceInfoServer, DeviceInfoServerDTO } from '@dailyuse/contracts/authentication';
import { ValueObject } from '@dailyuse/utils';
import crypto from 'crypto';

export class DeviceInfo extends ValueObject implements DeviceInfoServer {
  public readonly deviceId: string;
  public readonly deviceFingerprint: string;
  public readonly deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
  public readonly deviceName: string | null;
  public readonly os: string | null;
  public readonly browser: string | null;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;
  public readonly location: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  public readonly firstSeenAt: number;
  public readonly lastSeenAt: number;

  constructor(params: {
    deviceId: string;
    deviceFingerprint: string;
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    deviceName?: string | null;
    os?: string | null;
    browser?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    location?: {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;
    firstSeenAt: number;
    lastSeenAt: number;
  }) {
    super();
    this.deviceId = params.deviceId;
    this.deviceFingerprint = params.deviceFingerprint;
    this.deviceType = params.deviceType;
    this.deviceName = params.deviceName ?? null;
    this.os = params.os ?? null;
    this.browser = params.browser ?? null;
    this.ipAddress = params.ipAddress ?? null;
    this.userAgent = params.userAgent ?? null;
    this.location = params.location ?? null;
    this.firstSeenAt = params.firstSeenAt;
    this.lastSeenAt = params.lastSeenAt;

    Object.freeze(this);
  }

  // Factory methods
  public static create(params: {
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    os?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): DeviceInfo {
    const now = Date.now();
    const deviceId = crypto.randomUUID();
    const fingerprint = DeviceInfo.generateFingerprint({
      deviceType: params.deviceType,
      os: params.os,
      browser: params.browser,
      userAgent: params.userAgent,
    });

    return new DeviceInfo({
      deviceId,
      deviceFingerprint: fingerprint,
      deviceType: params.deviceType,
      os: params.os,
      browser: params.browser,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      location: params.location,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  public static fromServerDTO(dto: DeviceInfoServerDTO): DeviceInfo {
    return new DeviceInfo({
      deviceId: dto.deviceId,
      deviceFingerprint: dto.deviceFingerprint,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
      os: dto.os,
      browser: dto.browser,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      location: dto.location,
      firstSeenAt: dto.firstSeenAt,
      lastSeenAt: dto.lastSeenAt,
    });
  }

  // Business methods
  public updateLastSeen(): DeviceInfo {
    return new DeviceInfo({
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: this.deviceName,
      os: this.os,
      browser: this.browser,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: Date.now(),
    });
  }

  public updateName(name: string): DeviceInfo {
    return new DeviceInfo({
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: name,
      os: this.os,
      browser: this.browser,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
    });
  }

  public updateIpAddress(ipAddress: string): DeviceInfo {
    return new DeviceInfo({
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: this.deviceName,
      os: this.os,
      browser: this.browser,
      ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
    });
  }

  public matchesFingerprint(fingerprint: string): boolean {
    return this.deviceFingerprint === fingerprint;
  }

  // DTO conversion
  public toServerDTO(): DeviceInfoServerDTO {
    return {
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: this.deviceName,
      os: this.os,
      browser: this.browser,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
    };
  }

  public toClientDTO(): DeviceInfoClientDTO {
    return {
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: this.deviceName,
      os: this.os,
      browser: this.browser,
      ipAddress: this.ipAddress,
      location: this.location,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
    };
  }

  // Helper method
  private static generateFingerprint(params: {
    deviceType: string;
    os?: string;
    browser?: string;
    userAgent?: string;
  }): string {
    const data = `${params.deviceType}|${params.os || ''}|${params.browser || ''}|${params.userAgent || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  public equals(other: DeviceInfo): boolean {
    return this.deviceFingerprint === other.deviceFingerprint;
  }
}
