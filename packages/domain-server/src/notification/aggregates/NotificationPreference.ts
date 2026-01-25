/**
 * NotificationPreference 聚合根实现
 * 实现 NotificationPreferenceServer 接口
 */

import type {
  CategoryPreferenceServerDTO,
  CategoryPreferences,
  ChannelPreferences,
  DoNotDisturbConfigServer,
  DoNotDisturbConfigServerDTO,
  NotificationPreferencePersistenceDTO,
  NotificationPreferenceServer,
  NotificationPreferenceServerDTO,
  RateLimitServer,
  RateLimitServerDTO,
} from '@dailyuse/contracts/notification';
import { NotificationCategory } from '@dailyuse/contracts/notification';
import { AggregateRoot } from '@dailyuse/utils';
import { CategoryPreference } from '../value-objects/CategoryPreference';
import { DoNotDisturbConfig } from '../value-objects/DoNotDisturbConfig';
import { RateLimit } from '../value-objects/RateLimit';

/**
 * NotificationPreference 聚合根
 * 负责用户通知偏好设置的管理
 */
export class NotificationPreference extends AggregateRoot implements NotificationPreferenceServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _enabled: boolean;
  private _channels: ChannelPreferences;
  private _categories: CategoryPreferences;
  private _doNotDisturb: DoNotDisturbConfig | null;
  private _rateLimit: RateLimit | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    enabled: boolean;
    channels: ChannelPreferences;
    categories: CategoryPreferences;
    doNotDisturb?: DoNotDisturbConfig | null;
    rateLimit?: RateLimit | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._enabled = params.enabled;
    this._channels = params.channels;
    this._categories = params.categories;
    this._doNotDisturb = params.doNotDisturb ?? null;
    this._rateLimit = params.rateLimit ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get enabled(): boolean {
    return this._enabled;
  }
  public get channels(): ChannelPreferences {
    return { ...this._channels };
  }
  public get categories(): CategoryPreferences {
    return {
      task: { ...this._categories.task },
      goal: { ...this._categories.goal },
      schedule: { ...this._categories.schedule },
      reminder: { ...this._categories.reminder },
      account: { ...this._categories.account },
      system: { ...this._categories.system },
    };
  }
  public get doNotDisturb(): DoNotDisturbConfigServer | null {
    return this._doNotDisturb ?? null;
  }
  public get rateLimit(): RateLimitServer | null {
    return this._rateLimit ?? null;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 业务方法 =====

  /**
   * 启用所有通知
   */
  public enableAll(): void {
    this._enabled = true;
    this._updatedAt = new Date();
  }

  /**
   * 禁用所有通知
   */
  public disableAll(): void {
    this._enabled = false;
    this._updatedAt = new Date();
  }

  /**
   * 启用指定渠道
   */
  public enableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void {
    this._channels[channel] = true;
    this._updatedAt = new Date();
  }

  /**
   * 禁用指定渠道
   */
  public disableChannel(channel: 'inApp' | 'email' | 'push' | 'sms'): void {
    this._channels[channel] = false;
    this._updatedAt = new Date();
  }

  /**
   * 更新分类偏好
   */
  public updateCategoryPreference(
    category: NotificationCategory,
    preference: Partial<CategoryPreferenceServerDTO>,
  ): void {
    const categoryKey = category.toLowerCase() as keyof CategoryPreferences;
    if (categoryKey in this._categories) {
      this._categories[categoryKey] = {
        ...this._categories[categoryKey],
        ...preference,
      };
      this._updatedAt = new Date();
    }
  }

  /**
   * 启用免打扰
   */
  public enableDoNotDisturb(startTime: string, endTime: string, daysOfWeek: number[]): void {
    this._doNotDisturb = DoNotDisturbConfig.fromContract({
      enabled: true,
      startTime,
      endTime,
      daysOfWeek,
    });
    this._updatedAt = new Date();
  }

  /**
   * 禁用免打扰
   */
  public disableDoNotDisturb(): void {
    this._doNotDisturb = null;
    this._updatedAt = new Date();
  }

  /**
   * 检查是否在免打扰时段
   */
  public isInDoNotDisturbPeriod(): boolean {
    if (!this._doNotDisturb || !this._doNotDisturb.enabled) {
      return false;
    }
    return this._doNotDisturb.isInPeriod(Date.now());
  }

  /**
   * 检查速率限制
   */
  public checkRateLimit(): boolean {
    if (!this._rateLimit) {
      return true; // 无限制
    }
    // RateLimit 值对象应该有速率检查逻辑，这里简化处理
    return true;
  }

  /**
   * 判断是否应该发送通知
   */
  public shouldSendNotification(category: string, type: string, channel: string): boolean {
    // 1. 检查全局开关
    if (!this._enabled) {
      return false;
    }

    // 2. 检查渠道开关
    const channelKey = channel as keyof ChannelPreferences;
    if (channelKey in this._channels && !this._channels[channelKey]) {
      return false;
    }

    // 3. 检查分类开关
    const categoryKey = category.toLowerCase() as keyof CategoryPreferences;
    if (categoryKey in this._categories) {
      const categoryPref = this._categories[categoryKey];
      if (!categoryPref.enabled) {
        return false;
      }
    }

    // 4. 检查免打扰
    if (this.isInDoNotDisturbPeriod()) {
      return false;
    }

    // 5. 检查速率限制
    if (!this.checkRateLimit()) {
      return false;
    }

    return true;
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationPreferenceServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      enabled: this.enabled,
      channels: this.channels,
      categories: this.categories,
      doNotDisturb: this.doNotDisturb,
      rateLimit: this.rateLimit,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toPersistenceDTO(): NotificationPreferencePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      enabled: this.enabled,
      channels: JSON.stringify(this.channels),
      categories: JSON.stringify(this.categories),
      doNotDisturb: this.doNotDisturb ? JSON.stringify(this.doNotDisturb) : null,
      rateLimit: this.rateLimit ? JSON.stringify(this.rateLimit) : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ===== 静态工厂方法 =====

  private static getDefaultCategoryPreferences(): CategoryPreferences {
    const defaultPref = CategoryPreference.createDefault();

    return {
      task: defaultPref,
      goal: defaultPref,
      schedule: defaultPref,
      reminder: defaultPref,
      account: defaultPref,
      system: defaultPref,
    };
  }

  public static create(params: {
    accountUuid: string;
    enabled?: boolean;
    channels?: Partial<ChannelPreferences>;
    categories?: Partial<CategoryPreferences>;
  }): NotificationPreference {
    const now = Date.now();

    const defaultChannels: ChannelPreferences = {
      inApp: true,
      email: false,
      push: false,
      sms: false,
    };

    const channels = {
      ...defaultChannels,
      ...(params.channels ?? {}),
    };

    const categories = {
      ...NotificationPreference.getDefaultCategoryPreferences(),
      ...(params.categories ?? {}),
    };

    return new NotificationPreference({
      accountUuid: params.accountUuid,
      enabled: params.enabled ?? true,
      channels,
      categories,
      doNotDisturb: null,
      rateLimit: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: NotificationPreferenceServerDTO): NotificationPreference {
    return new NotificationPreference({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      enabled: dto.enabled,
      channels: dto.channels,
      categories: dto.categories,
      doNotDisturb: dto.doNotDisturb ? DoNotDisturbConfig.fromContract(dto.doNotDisturb) : null,
      rateLimit: dto.rateLimit ? RateLimit.fromContract(dto.rateLimit) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  public static fromPersistenceDTO(
    dto: NotificationPreferencePersistenceDTO,
  ): NotificationPreference {
    return new NotificationPreference({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      enabled: dto.enabled,
      channels: JSON.parse(dto.channels),
      categories: JSON.parse(dto.categories),
      doNotDisturb: dto.doNotDisturb
        ? DoNotDisturbConfig.fromContract(JSON.parse(dto.doNotDisturb))
        : null,
      rateLimit: dto.rateLimit ? RateLimit.fromContract(JSON.parse(dto.rateLimit)) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }
}
