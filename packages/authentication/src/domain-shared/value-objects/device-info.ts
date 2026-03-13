import type {
  DeviceInfoDTO,
  DeviceInfoPersistenceDTO,
  DeviceInfo as IDeviceInfo,
} from '@dailyuse/contracts/authentication';
import { ValueObject } from '@dailyuse/utils';
import { DeviceType } from './device-type';

/**
 * Device Info Value Object
 *
 * Responsibilities:
 * - Stores and manages login device information
 * - Provides device identification and classification logic
 * - Used for device trust management and security policies
 * - Immutable: all modifications return a new instance
 */
export class DeviceInfo extends ValueObject<DeviceInfoDTO> implements IDeviceInfo {
  private constructor(props: DeviceInfoDTO) {
    super(props);
  }

  // ================= Factory Method 1: Standard Creation =================
  /**
   * Creates a new DeviceInfo value object (with validation).
   */
  public static create(props: DeviceInfoDTO): DeviceInfo {
    this.validate(props);
    return new DeviceInfo(props);
  }

  public static createDefault(deviceId: string): DeviceInfo {
    const now = Date.now();
    return DeviceInfo.create({
      deviceId,
      deviceFingerprint: '',
      deviceType: DeviceType.Browser,
      deviceName: null,
      os: null,
      osVersion: null,
      browser: null,
      appVersion: null,
      ipAddress: null,
      userAgent: null,
      location: null,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  // ================= Factory Method 2: Restore from DTO =================
  /**
   * Restores a DeviceInfo object from a DTO.
   */
  public static fromDTO(dto: DeviceInfoDTO): DeviceInfo {
    // If a DeviceInfo value-object instance is passed, extract its plain DTO first.
    // Spreading a ValueObject instance only copies the `props` field (getters live
    // on the prototype), which would produce a nested { props: {...} } structure.
    if (dto instanceof DeviceInfo) {
      return new DeviceInfo(dto.toDTO());
    }
    return new DeviceInfo(dto);
  }

  // ================= Getters =================
  public get deviceId(): string {
    return this.props.deviceId;
  }
  public get deviceFingerprint(): string {
    return this.props.deviceFingerprint;
  }
  public get deviceType(): DeviceType {
    return DeviceType.of(this.props.deviceType);
  }
  public get deviceName(): string | null {
    return this.props.deviceName;
  }
  public get os(): string | null {
    return this.props.os;
  }
  public get osVersion(): string | null {
    return this.props.osVersion;
  }
  public get browser(): string | null {
    return this.props.browser;
  }
  public get appVersion(): string | null {
    return this.props.appVersion;
  }
  public get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  public get userAgent(): string | null {
    return this.props.userAgent;
  }
  public get location(): {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
  } | null {
    return this.props.location;
  }
  public get firstSeenAt(): number {
    return this.props.firstSeenAt;
  }
  public get lastSeenAt(): number {
    return this.props.lastSeenAt;
  }

  // ================= Internal Logic =================
  /**
   * Centralized validation logic.
   */
  private static validate(props: DeviceInfoDTO): void {
    // Device type must be valid
    if (!DeviceType.isValid(props.deviceType)) {
      throw new Error(`Invalid device type: ${props.deviceType}`);
    }

    // Device name cannot be empty string if provided (null means unknown device, allowed)
    if (
      props.deviceName !== null &&
      props.deviceName !== undefined &&
      props.deviceName.trim().length === 0
    ) {
      throw new Error('Device name cannot be empty');
    }

    // Device name length limit
    if (props.deviceName && props.deviceName.length > 100) {
      throw new Error('Device name too long (max 100 characters)');
    }

    // User agent may be empty, but if present, enforce length limit
    if (props.userAgent && props.userAgent.length > 500) {
      throw new Error('User agent too long (max 500 characters)');
    }

    // Basic IP address format validation
    if (props.ipAddress) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-f0-9:]+$/i;
      if (!ipRegex.test(props.ipAddress)) {
        throw new Error(`Invalid IP address format: ${props.ipAddress}`);
      }
    }

    // Timestamp validity check
    if (!Number.isFinite(props.firstSeenAt) || props.firstSeenAt < 0) {
      throw new Error('Invalid firstSeenAt timestamp');
    }

    if (
      props.lastSeenAt !== undefined &&
      (!Number.isFinite(props.lastSeenAt) || props.lastSeenAt < 0)
    ) {
      throw new Error('Invalid lastSeenAt timestamp');
    }

    // lastSeenAt must be >= firstSeenAt
    if (props.lastSeenAt && props.lastSeenAt < props.firstSeenAt) {
      throw new Error('lastSeenAt cannot be earlier than firstSeenAt');
    }
  }

  // ================= Computed Properties =================

  /**
   * Returns the device's display name.
   */
  public getDisplayName(): string {
    return this.props.deviceName || '';
  }

  /**
   * Checks if the device is a mobile device.
   */
  public isMobile(): boolean {
    return DeviceType.isMobile(this.props.deviceType as DeviceType);
  }

  /**
   * Checks if the device is a web browser.
   */
  public isBrowser(): boolean {
    return DeviceType.isBrowser(this.props.deviceType as DeviceType);
  }

  /**
   * Returns the number of days since the device was first seen.
   */
  public getDaysSinceFirstSeen(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - this.props.firstSeenAt) / dayMs);
  }

  /**
   * Returns the number of days since the device was last seen.
   * If the device has never been used, returns days since creation.
   */
  public getDaysSinceLastSeen(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    const timestamp = this.props.lastSeenAt || this.props.firstSeenAt;
    return Math.floor((Date.now() - timestamp) / dayMs);
  }

  /**
   * Returns a human-readable description of the device's age (since first seen).
   */
  public getAgeDescription(): string {
    const days = this.getDaysSinceFirstSeen();

    if (days === 0) return 'First login today';
    if (days === 1) return 'First login yesterday';
    if (days < 7) return `First login ${days} days ago`;
    if (days < 30) return `First login ${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `First login ${Math.floor(days / 30)} months ago`;
    return `First login ${Math.floor(days / 365)} years ago`;
  }

  /**
   * Returns a human-readable description of the last activity time.
   */
  public getLastActivityDescription(): string {
    const days = this.getDaysSinceLastSeen();

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  /**
   * Checks if the device is "familiar" (seen for more than 7 days).
   */
  public isFamiliar(): boolean {
    return this.getDaysSinceFirstSeen() >= 7;
  }

  /**
   * Checks if the device is new (within 24 hours).
   */
  public isNewDevice(): boolean {
    return this.getDaysSinceFirstSeen() === 0;
  }

  /**
   * Checks if the device has been inactive for over 30 days.
   */
  public isInactive(): boolean {
    return this.getDaysSinceLastSeen() > 30;
  }

  // ================= Behavior Methods =================

  /**
   * Updates the last seen timestamp.
   * Used when a user logs in again from this device.
   */
  public updateLastSeen(): DeviceInfo {
    return new DeviceInfo({
      ...this.props,
      lastSeenAt: Date.now(),
    });
  }

  /**
   * Renames the device.
   * Used when a user renames their device.
   */
  public rename(newName: string): DeviceInfo {
    DeviceInfo.validate({
      ...this.props,
      deviceName: newName,
    });

    return new DeviceInfo({
      ...this.props,
      deviceName: newName,
    });
  }

  // ================= Serialization: API / Client =================
  /**
   * Converts to DTO (for API transport).
   */
  public toDTO(): DeviceInfoDTO {
    return { ...this.props };
  }

  // ================= Serialization: Persistence =================
  /**
   * Converts to persistence format (for database storage).
   */
  public toPersistence(): DeviceInfoPersistenceDTO {
    return {
      ...this.props,
      firstSeenAt: new Date(this.props.firstSeenAt),
      lastSeenAt: new Date(this.props.lastSeenAt),
    };
  }
}
