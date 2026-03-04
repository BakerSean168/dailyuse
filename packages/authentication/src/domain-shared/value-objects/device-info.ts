import type {
  DeviceInfoDTO,
  DeviceInfoPersistenceDTO,
  DeviceInfo as IDeviceInfo,
} from '@dailyuse/contracts/authentication';
import { ValueObject } from '@dailyuse/utils';
import { DeviceType } from './device-type';

/**
 * 📱 设备信息值对�?
 *
 * 责任�?
 * - 存储和管理登录设备的相关信息
 * - 提供设备识别和分类的业务逻辑
 * - 用于设备信任管理和安全策�?
 * - 不可变性：所有修改操作都返回新实�?
 */
export class DeviceInfo extends ValueObject<DeviceInfoDTO> implements IDeviceInfo {
  private constructor(props: DeviceInfoDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的设备信息值对象（包含校验�?
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
      deviceType: DeviceType.BROWSER,
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

  // ================= 工厂方法 2: �?DTO 恢复 =================
  /**
   * �?DTO 恢复设备信息对象
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

  // ================= 内部逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: DeviceInfoDTO): void {
    // 设备类型必须有效
    if (!DeviceType.isValid(props.deviceType)) {
      throw new Error(`Invalid device type: ${props.deviceType}`);
    }

    // 设备名称如果提供则不能为空字符串（null 表示未知设备，允许）
    if (
      props.deviceName !== null &&
      props.deviceName !== undefined &&
      props.deviceName.trim().length === 0
    ) {
      throw new Error('Device name cannot be empty');
    }

    // 设备名称长度限制
    if (props.deviceName && props.deviceName.length > 100) {
      throw new Error('Device name too long (max 100 characters)');
    }

    // User Agent 可以为空，但如果有，长度要限�?
    if (props.userAgent && props.userAgent.length > 500) {
      throw new Error('User agent too long (max 500 characters)');
    }

    // IP 地址格式基本校验
    if (props.ipAddress) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-f0-9:]+$/i;
      if (!ipRegex.test(props.ipAddress)) {
        throw new Error(`Invalid IP address format: ${props.ipAddress}`);
      }
    }

    // 时间戳有效性检�?
    if (!Number.isFinite(props.firstSeenAt) || props.firstSeenAt < 0) {
      throw new Error('Invalid firstSeenAt timestamp');
    }

    if (
      props.lastSeenAt !== undefined &&
      (!Number.isFinite(props.lastSeenAt) || props.lastSeenAt < 0)
    ) {
      throw new Error('Invalid lastSeenAt timestamp');
    }

    // lastSeenAt 应该 >= firstSeenAt
    if (props.lastSeenAt && props.lastSeenAt < props.firstSeenAt) {
      throw new Error('lastSeenAt cannot be earlier than firstSeenAt');
    }
  }

  // ================= 计算属�?=================

  /**
   * 获取设备的显示名�?
   */
  public getDisplayName(): string {
    return this.props.deviceName || '';
  }

  /**
   * 设备是否是移动设�?
   */
  public isMobile(): boolean {
    return DeviceType.isMobile(this.props.deviceType as DeviceType);
  }

  /**
   * 设备是否是网页端
   */
  public isBrowser(): boolean {
    return DeviceType.isBrowser(this.props.deviceType as DeviceType);
  }

  /**
   * 获取设备被首次看到的距今时间（天数）
   */
  public getDaysSinceFirstSeen(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - this.props.firstSeenAt) / dayMs);
  }

  /**
   * 获取设备最后一次被看到的距今时间（天数�?
   * 如果设备从未被使用过，返回该设备从创建到现在的天�?
   */
  public getDaysSinceLastSeen(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    const timestamp = this.props.lastSeenAt || this.props.firstSeenAt;
    return Math.floor((Date.now() - timestamp) / dayMs);
  }

  /**
   * 获取设备�?年龄"描述（从首次看到至今�?
   */
  public getAgeDescription(): string {
    const days = this.getDaysSinceFirstSeen();

    if (days === 0) return '今天首次登录';
    if (days === 1) return '昨天首次登录';
    if (days < 7) return `${days} 天前首次登录`;
    if (days < 30) return `${Math.floor(days / 7)} 周前首次登录`;
    if (days < 365) return `${Math.floor(days / 30)} 个月前首次登录`;
    return `${Math.floor(days / 365)} 年前首次登录`;
  }

  /**
   * 获取最后活动时间的描述
   */
  public getLastActivityDescription(): string {
    const days = this.getDaysSinceLastSeen();

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 周前`;
    if (days < 365) return `${Math.floor(days / 30)} 个月前`;
    return `${Math.floor(days / 365)} 年前`;
  }

  /**
   * 设备是否已成�?熟悉"的设备（超过 7 天）
   */
  public isFamiliar(): boolean {
    return this.getDaysSinceFirstSeen() >= 7;
  }

  /**
   * 设备是否是新设备�?4 小时内）
   */
  public isNewDevice(): boolean {
    return this.getDaysSinceFirstSeen() === 0;
  }

  /**
   * 设备是否已很久没有被使用（超�?30 天）
   */
  public isInactive(): boolean {
    return this.getDaysSinceLastSeen() > 30;
  }

  // ================= 行为方法 =================

  /**
   * 更新最后活动时�?
   * 场景：用户再次从该设备登�?
   */
  public updateLastSeen(): DeviceInfo {
    return new DeviceInfo({
      ...this.props,
      lastSeenAt: Date.now(),
    });
  }

  /**
   * 更新设备名称
   * 场景：用户重命名设备
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

  // ================= 序列�? API / Client =================
  /**
   * 转换�?DTO（用�?API 传输�?
   */
  public toDTO(): DeviceInfoDTO {
    return { ...this.props };
  }

  // ================= 序列�? Persistence =================
  /**
   * 转换为持久化格式（数据库存储�?
   */
  public toPersistence(): DeviceInfoPersistenceDTO {
    return {
      ...this.props,
      firstSeenAt: new Date(this.props.firstSeenAt),
      lastSeenAt: new Date(this.props.lastSeenAt),
    };
  }
}
