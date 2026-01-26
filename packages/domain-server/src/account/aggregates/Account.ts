/**
 * Account 聚合根实现
 * 实现 AccountServer 接口
 */

import type {
  AccountClientDTO,
  AccountPersistenceDTO,
  AccountServer,
  AccountServerDTO,
  SubscriptionServer,
} from '@dailyuse/contracts/account';
import { AggregateRoot } from '@dailyuse/utils';
import { Subscription } from '../entities/Subscription';
import { AccountHistory } from '../entities/AccountHistory';

export class Account extends AggregateRoot implements AccountServer {
  // 基本信息
  private _username: string;
  private _email: string;
  private _emailVerified: boolean;
  private _phoneNumber: string | null;
  private _phoneVerified: boolean;
  private _status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

  // 复杂对象
  private _profile: AccountServerDTO['profile'];
  private _preferences: AccountServerDTO['preferences'];
  private _storage: AccountServerDTO['storage'];
  private _security: AccountServerDTO['security'];
  private _stats: AccountServerDTO['stats'];

  // 时间戳
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastActiveAt: Date | null;
  private _deletedAt: Date | null;

  // 子实体
  private _subscription: Subscription | null;
  private _history: AccountHistory[];

  private constructor(params: {
    uuid?: string;
    username: string;
    email: string;
    emailVerified: boolean;
    phoneNumber?: string | null;
    phoneVerified: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    profile: AccountServerDTO['profile'];
    preferences: AccountServerDTO['preferences'];
    storage: AccountServerDTO['storage'];
    security: AccountServerDTO['security'];
    stats: AccountServerDTO['stats'];
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date | null;
    deletedAt?: Date | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._username = params.username;
    this._email = params.email;
    this._emailVerified = params.emailVerified;
    this._phoneNumber = params.phoneNumber ?? null;
    this._phoneVerified = params.phoneVerified;
    this._status = params.status;
    this._profile = params.profile;
    this._preferences = params.preferences;
    this._storage = params.storage;
    this._security = params.security;
    this._stats = params.stats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._lastActiveAt = params.lastActiveAt ?? null;
    this._deletedAt = params.deletedAt ?? null;
    this._subscription = null;
    this._history = [];
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get username(): string {
    return this._username;
  }
  public get email(): string {
    return this._email;
  }
  public get emailVerified(): boolean {
    return this._emailVerified;
  }
  public get phoneNumber(): string | null {
    return this._phoneNumber;
  }
  public get phoneVerified(): boolean {
    return this._phoneVerified;
  }
  public get status(): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' {
    return this._status;
  }
  public get profile(): AccountServerDTO['profile'] {
    return { ...this._profile };
  }
  public get preferences(): AccountServerDTO['preferences'] {
    return {
      ...this._preferences,
      notifications: { ...this._preferences.notifications },
      privacy: { ...this._preferences.privacy },
    };
  }
  public get subscription(): Subscription | null {
    return this._subscription;
  }
  public get storage(): AccountServerDTO['storage'] {
    return { ...this._storage };
  }
  public get security(): AccountServerDTO['security'] {
    return { ...this._security };
  }
  public get history(): AccountHistory[] {
    return [...this._history];
  }
  public get stats(): AccountServerDTO['stats'] {
    return { ...this._stats };
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get lastActiveAt(): Date | null {
    return this._lastActiveAt;
  }
  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // Factory methods
  public static create(params: {
    username: string;
    email: string;
    displayName: string;
    timezone?: string;
    language?: string;
  }): Account {
    const now = new Date();
    return new Account({
      username: params.username,
      email: params.email,
      emailVerified: false,
      phoneVerified: false,
      status: 'ACTIVE',
      profile: {
        displayName: params.displayName,
        avatar: null,
        bio: null,
        location: null,
        timezone: params.timezone ?? 'UTC',
        language: params.language ?? 'en',
        dateOfBirth: null,
        gender: null,
      },
      preferences: {
        theme: 'AUTO',
        accentColor: null,
        notifications: {
          email: true,
          push: false,
          sms: false,
          inApp: true,
        },
        privacy: {
          profileVisibility: 'PUBLIC',
          showOnlineStatus: true,
          allowSearchByEmail: true,
        },
      },
      storage: {
        used: 0,
        quota: 100 * 1024 * 1024, // 100MB
        quotaType: 'FREE',
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: now,
        loginAttempts: 0,
        lockedUntil: null,
      },
      stats: {
        totalGoals: 0,
        totalTasks: 0,
        totalSchedules: 0,
        totalReminders: 0,
        lastLoginAt: null,
        loginCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: AccountServerDTO): Account {
    const account = new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status,
      profile: dto.profile,
      preferences: dto.preferences,
      storage: dto.storage,
      security: dto.security,
      stats: dto.stats,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      lastActiveAt: dto.lastActiveAt ? new Date(dto.lastActiveAt) : null,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
    if (dto.subscription) {
      account._subscription = Subscription.fromServerDTO(dto.subscription);
    }
    account._history = dto.history.map((h) => AccountHistory.fromServerDTO(h));
    return account;
  }

  public static fromPersistenceDTO(dto: AccountPersistenceDTO): Account {
    const account = new Account({
      uuid: dto.uuid,
      username: dto.username,
      email: dto.email,
      emailVerified: dto.emailVerified,
      phoneNumber: dto.phoneNumber,
      phoneVerified: dto.phoneVerified,
      status: dto.status,
      profile: {
        displayName: dto.displayName,
        avatar: dto.avatar,
        bio: dto.bio,
        location: dto.location,
        timezone: dto.timezone,
        language: dto.language,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
      },
      preferences: JSON.parse(dto.preferences),
      storage: {
        used: dto.storageUsed,
        quota: dto.storageQuota,
        quotaType: dto.storageQuotaType,
      },
      security: {
        twoFactorEnabled: dto.twoFactorEnabled,
        lastPasswordChange: dto.lastPasswordChange,
        loginAttempts: dto.loginAttempts,
        lockedUntil: dto.lockedUntil,
      },
      stats: {
        totalGoals: dto.statsTotalGoals,
        totalTasks: dto.statsTotalTasks,
        totalSchedules: dto.statsTotalSchedules,
        totalReminders: dto.statsTotalReminders,
        lastLoginAt: dto.statsLastLoginAt,
        loginCount: dto.statsLoginCount,
      },
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lastActiveAt: dto.lastActiveAt,
      deletedAt: dto.deletedAt,
    });

    if (
      dto.subscriptionId &&
      dto.subscriptionPlan &&
      dto.subscriptionStatus &&
      dto.subscriptionStartDate
    ) {
      account._subscription = Subscription.fromPersistenceDTO({
        uuid: dto.subscriptionId,
        accountUuid: dto.uuid,
        plan: dto.subscriptionPlan,
        status: dto.subscriptionStatus,
        startDate: dto.subscriptionStartDate,
        endDate: dto.subscriptionEndDate,
        renewalDate: dto.subscriptionRenewalDate,
        autoRenew: dto.subscriptionAutoRenew ?? true,
        paymentMethod: null,
        billingCycle: 'MONTHLY',
        amount: null,
        currency: null,
        createdAt: dto.subscriptionStartDate,
        updatedAt: dto.subscriptionStartDate,
      });
    }

    const historyArray = JSON.parse(dto.history);
    account._history = historyArray.map((h: any) => AccountHistory.fromServerDTO(h));
    return account;
  }

  // 状态管理
  public activate(): void {
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = 'INACTIVE';
    this._updatedAt = new Date();
  }

  public suspend(reason: string): void {
    this._status = 'SUSPENDED';
    this._updatedAt = new Date();
    this.addHistory('ACCOUNT_SUSPENDED', { reason });
  }

  public softDelete(): void {
    this._status = 'DELETED';
    this._deletedAt = new Date();
    this._updatedAt = new Date();
    this.addHistory('ACCOUNT_DELETED', {});
  }

  public restore(): void {
    if (this._status === 'DELETED') {
      this._status = 'ACTIVE';
      this._deletedAt = null;
      this._updatedAt = new Date();
      this.addHistory('ACCOUNT_RESTORED', {});
    }
  }

  // 资料管理
  public updateProfile(profile: Partial<AccountServerDTO['profile']>): void {
    this._profile = { ...this._profile, ...profile };
    this._updatedAt = new Date();
  }

  public updateAvatar(avatarUrl: string): void {
    this._profile.avatar = avatarUrl;
    this._updatedAt = new Date();
  }

  public updateDisplayName(displayName: string): void {
    this._profile.displayName = displayName;
    this._updatedAt = new Date();
  }

  // 偏好管理
  public updatePreferences(preferences: Partial<AccountServerDTO['preferences']>): void {
    this._preferences = {
      ...this._preferences,
      ...preferences,
      notifications: { ...this._preferences.notifications, ...preferences.notifications },
      privacy: { ...this._preferences.privacy, ...preferences.privacy },
    };
    this._updatedAt = new Date();
  }

  public updateTheme(theme: 'LIGHT' | 'DARK' | 'AUTO'): void {
    this._preferences.theme = theme;
    this._updatedAt = new Date();
  }

  // 邮箱与手机
  public verifyEmail(): void {
    this._emailVerified = true;
    this._updatedAt = new Date();
    this.addHistory('EMAIL_VERIFIED', {});
  }

  public updateEmail(newEmail: string): void {
    const oldEmail = this._email;
    this._email = newEmail;
    this._emailVerified = false;
    this._updatedAt = new Date();
    this.addHistory('EMAIL_UPDATED', { oldEmail, newEmail });
  }

  public verifyPhone(): void {
    if (!this._phoneNumber) {
      throw new Error('No phone number to verify');
    }
    this._phoneVerified = true;
    this._updatedAt = new Date();
    this.addHistory('PHONE_VERIFIED', {});
  }

  public updatePhone(newPhone: string): void {
    const oldPhone = this._phoneNumber;
    this._phoneNumber = newPhone;
    this._phoneVerified = false;
    this._updatedAt = new Date();
    this.addHistory('PHONE_UPDATED', { oldPhone, newPhone });
  }

  // 安全管理
  public enableTwoFactor(): void {
    this._security.twoFactorEnabled = true;
    this._updatedAt = new Date();
    this.addHistory('TWO_FACTOR_ENABLED', {});
  }

  public disableTwoFactor(): void {
    this._security.twoFactorEnabled = false;
    this._updatedAt = new Date();
    this.addHistory('TWO_FACTOR_DISABLED', {});
  }

  public changePassword(): void {
    this._security.lastPasswordChange = Date.now();
    this._updatedAt = new Date();
    this.addHistory('PASSWORD_CHANGED', {});
  }

  public incrementLoginAttempts(): void {
    this._security.loginAttempts += 1;
    this._updatedAt = new Date();
    if (this._security.loginAttempts >= 5) {
      this.lockAccount(15); // 锁定15分钟
    }
  }

  public resetLoginAttempts(): void {
    this._security.loginAttempts = 0;
    this._updatedAt = new Date();
  }

  public lockAccount(durationMinutes: number): void {
    this._security.lockedUntil = Date.now() + durationMinutes * 60 * 1000;
    this._updatedAt = new Date();
    this.addHistory('ACCOUNT_LOCKED', { durationMinutes });
  }

  public unlockAccount(): void {
    this._security.lockedUntil = null;
    this._security.loginAttempts = 0;
    this._updatedAt = new Date();
    this.addHistory('ACCOUNT_UNLOCKED', {});
  }

  // 订阅管理
  public updateSubscription(subscription: SubscriptionServer): void {
    this._subscription = Subscription.fromServerDTO(subscription);
    this._updatedAt = new Date();
  }

  public cancelSubscription(): void {
    if (this._subscription) {
      this._subscription.cancel();
      this._updatedAt = new Date();
    }
  }

  // 存储管理
  public checkStorageQuota(requiredBytes: number): boolean {
    return this._storage.used + requiredBytes <= this._storage.quota;
  }

  public updateStorageUsage(bytesUsed: number): void {
    this._storage.used = bytesUsed;
    this._updatedAt = new Date();
  }

  // 历史记录
  public addHistory(action: string, details?: any): void {
    const history = AccountHistory.create({
      accountUuid: this._uuid,
      action,
      details,
    });
    this._history.push(history);
  }

  public getHistory(limit?: number): AccountHistory[] {
    return limit ? this._history.slice(-limit) : [...this._history];
  }

  // 统计更新
  public updateStats(stats: Partial<AccountServerDTO['stats']>): void {
    this._stats = { ...this._stats, ...stats };
    this._updatedAt = new Date();
  }

  public recordLogin(): void {
    this._stats.lastLoginAt = Date.now();
    this._stats.loginCount += 1;
    this._security.loginAttempts = 0;
    this._lastActiveAt = new Date();
    this._updatedAt = new Date();
    this.addHistory('LOGIN', {});
  }

  public recordActivity(): void {
    this._lastActiveAt = new Date();
  }

  // 子实体管理
  public loadSubscription(subscription: Subscription | null): void {
    this._subscription = subscription;
  }

  public loadHistory(history: AccountHistory[]): void {
    this._history = history;
  }

  // DTO conversion
  public toServerDTO(): AccountServerDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      phoneNumber: this._phoneNumber,
      phoneVerified: this._phoneVerified,
      status: this._status,
      profile: this._profile,
      preferences: this._preferences,
      subscription: this._subscription as any, // 实体本身实现了接口
      storage: this._storage,
      security: this._security,
      history: this._history as any, // 实体本身实现了接口
      stats: this._stats,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      lastActiveAt: this._lastActiveAt ? this._lastActiveAt.getTime() : null,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
    };
  }

  public toClientDTO(): AccountClientDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      phoneNumber: this._phoneNumber,
      phoneVerified: this._phoneVerified,
      status: this._status,
      profile: this._profile,
      preferences: this._preferences,
      subscription: this._subscription ?? null,
      storage: this._storage,
      security: this._security,
      history: this._history,
      stats: this._stats,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      lastActiveAt: this._lastActiveAt ? this._lastActiveAt.getTime() : null,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
    };
  }

  public toPersistenceDTO(): AccountPersistenceDTO {
    return {
      uuid: this._uuid,
      username: this._username,
      email: this._email,
      emailVerified: this._emailVerified,
      phoneNumber: this._phoneNumber,
      phoneVerified: this._phoneVerified,
      status: this._status,

      // Flattened profile
      displayName: this._profile.displayName,
      avatar: this._profile.avatar,
      bio: this._profile.bio,
      location: this._profile.location,
      timezone: this._profile.timezone,
      language: this._profile.language,
      dateOfBirth: this._profile.dateOfBirth,
      gender: this._profile.gender,

      preferences: JSON.stringify(this._preferences),

      // Flattened subscription
      subscriptionId: this._subscription?.uuid,
      subscriptionPlan: this._subscription?.plan,
      subscriptionStatus: this._subscription?.status,
      subscriptionStartDate: this._subscription?.startDate,
      subscriptionEndDate: this._subscription?.endDate,
      subscriptionRenewalDate: this._subscription?.renewalDate,
      subscriptionAutoRenew: this._subscription?.autoRenew,

      // Flattened storage
      storageUsed: this._storage.used,
      storageQuota: this._storage.quota,
      storageQuotaType: this._storage.quotaType,

      // Flattened security
      twoFactorEnabled: this._security.twoFactorEnabled,
      lastPasswordChange: this._security.lastPasswordChange,
      loginAttempts: this._security.loginAttempts,
      lockedUntil: this._security.lockedUntil,

      history: JSON.stringify(this._history.map((h) => h.toServerDTO())),

      // Flattened stats
      statsTotalGoals: this._stats.totalGoals,
      statsTotalTasks: this._stats.totalTasks,
      statsTotalSchedules: this._stats.totalSchedules,
      statsTotalReminders: this._stats.totalReminders,
      statsLastLoginAt: this._stats.lastLoginAt,
      statsLoginCount: this._stats.loginCount,

      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastActiveAt: this._lastActiveAt,
      deletedAt: this._deletedAt,
    };
  }
}
