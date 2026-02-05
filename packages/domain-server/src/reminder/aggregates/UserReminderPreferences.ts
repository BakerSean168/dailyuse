/**
 * UserReminderPreferences 聚合根实现
 * 实现 UserReminderPreferencesServer 接口
 */

import type {
  TimeSlotDTO,
  UserReminderPreferencesClientDTO,
  UserReminderPreferencesPersistenceDTO,
  UserReminderPreferencesServer,
  UserReminderPreferencesServerDTO,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';

/**
 * UserReminderPreferences 聚合根
 *
 * DDD 聚合根职责：
 * - 管理用户的提醒偏好设置
 * - 记录最佳/最差提醒时间段
 * - 支持时间段推荐算法
 * - 全局智能频率开关
 */
export class UserReminderPreferences
  extends AggregateRoot<string>
  implements UserReminderPreferencesServer
{
  // ===== 私有字段 =====
  private _identityId: string;
  private _bestTimeSlots: TimeSlotDTO[];
  private _worstTimeSlots: TimeSlotDTO[];
  private _globalSmartFrequency: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    identityId: string;
    bestTimeSlots: TimeSlotDTO[];
    worstTimeSlots: TimeSlotDTO[];
    globalSmartFrequency: boolean;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || generateUUID());
    this._identityId = params.identityId;
    this._bestTimeSlots = [...params.bestTimeSlots];
    this._worstTimeSlots = [...params.worstTimeSlots];
    this._globalSmartFrequency = params.globalSmartFrequency;
    this._createdAt = new Date(params.createdAt);
    this._updatedAt = new Date(params.updatedAt);
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this.id;
  }

  public get identityId(): string {
    return this._identityId;
  }

  /**
   * Alias for identityId to implement UserReminderPreferencesServer interface
   */
  public get accountUuid(): string {
    return this._identityId;
  }

  public get bestTimeSlots(): TimeSlotDTO[] {
    return [...this._bestTimeSlots];
  }

  public get worstTimeSlots(): TimeSlotDTO[] {
    return [...this._worstTimeSlots];
  }

  public get globalSmartFrequency(): boolean {
    return this._globalSmartFrequency;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 UserReminderPreferences 聚合根
   */
  public static create(params: {
    identityId: string;
    bestTimeSlots?: TimeSlotDTO[];
    worstTimeSlots?: TimeSlotDTO[];
    globalSmartFrequency?: boolean;
  }): UserReminderPreferences {
    const now = Date.now();

    return new UserReminderPreferences({
      identityId: params.identityId,
      bestTimeSlots: params.bestTimeSlots ?? [],
      worstTimeSlots: params.worstTimeSlots ?? [],
      globalSmartFrequency: params.globalSmartFrequency ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 Server DTO 创建聚合根
   */
  public static fromServerDTO(dto: UserReminderPreferencesServerDTO): UserReminderPreferences {
    return new UserReminderPreferences({
      uuid: dto.uuid,
      identityId: dto.accountUuid,
      bestTimeSlots: dto.bestTimeSlots,
      worstTimeSlots: dto.worstTimeSlots,
      globalSmartFrequency: dto.globalSmartFrequency,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Persistence DTO 创建聚合根
   */
  public static fromPersistenceDTO(
    dto: UserReminderPreferencesPersistenceDTO,
  ): UserReminderPreferences {
    return new UserReminderPreferences({
      uuid: dto.uuid,
      identityId: dto.accountUuid,
      bestTimeSlots: JSON.parse(dto.bestTimeSlots) as TimeSlotDTO[],
      worstTimeSlots: JSON.parse(dto.worstTimeSlots) as TimeSlotDTO[],
      globalSmartFrequency: dto.globalSmartFrequency,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 添加最佳时间段
   */
  public addBestTimeSlot(timeSlot: TimeSlotDTO): void {
    // 验证时间段有效性
    if (timeSlot.hourStart < 0 || timeSlot.hourStart > 23) {
      throw new Error('hourStart must be between 0 and 23');
    }
    if (timeSlot.hourEnd < 0 || timeSlot.hourEnd > 23) {
      throw new Error('hourEnd must be between 0 and 23');
    }
    if (timeSlot.avgResponseRate < 0 || timeSlot.avgResponseRate > 100) {
      throw new Error('avgResponseRate must be between 0 and 100');
    }

    // 检查是否已存在重叠的时间段
    const existingIndex = this._bestTimeSlots.findIndex(
      (slot) => slot.hourStart === timeSlot.hourStart && slot.hourEnd === timeSlot.hourEnd,
    );

    if (existingIndex >= 0) {
      // 更新现有时间段
      this._bestTimeSlots[existingIndex] = timeSlot;
    } else {
      // 添加新时间段
      this._bestTimeSlots.push(timeSlot);
      // 按响应率降序排序
      this._bestTimeSlots.sort((a, b) => b.avgResponseRate - a.avgResponseRate);
    }

    this._updatedAt = new Date(Date.now());
  }

  /**
   * 添加最差时间段
   */
  public addWorstTimeSlot(timeSlot: TimeSlotDTO): void {
    // 验证时间段有效性
    if (timeSlot.hourStart < 0 || timeSlot.hourStart > 23) {
      throw new Error('hourStart must be between 0 and 23');
    }
    if (timeSlot.hourEnd < 0 || timeSlot.hourEnd > 23) {
      throw new Error('hourEnd must be between 0 and 23');
    }
    if (timeSlot.avgResponseRate < 0 || timeSlot.avgResponseRate > 100) {
      throw new Error('avgResponseRate must be between 0 and 100');
    }

    // 检查是否已存在重叠的时间段
    const existingIndex = this._worstTimeSlots.findIndex(
      (slot) => slot.hourStart === timeSlot.hourStart && slot.hourEnd === timeSlot.hourEnd,
    );

    if (existingIndex >= 0) {
      // 更新现有时间段
      this._worstTimeSlots[existingIndex] = timeSlot;
    } else {
      // 添加新时间段
      this._worstTimeSlots.push(timeSlot);
      // 按响应率升序排序
      this._worstTimeSlots.sort((a, b) => a.avgResponseRate - b.avgResponseRate);
    }

    this._updatedAt = new Date(Date.now());
  }

  /**
   * 更新所有时间段
   */
  public updateTimeSlots(best: TimeSlotDTO[], worst: TimeSlotDTO[]): void {
    this._bestTimeSlots = [...best];
    this._worstTimeSlots = [...worst];
    this._updatedAt = new Date(Date.now());
  }

  /**
   * 切换全局智能频率开关
   */
  public toggleGlobalSmartFrequency(enabled: boolean): void {
    this._globalSmartFrequency = enabled;
    this._updatedAt = new Date(Date.now());
  }

  /**
   * 获取响应率最高的时间段
   */
  public getBestTimeSlot(): TimeSlotDTO | null {
    if (this._bestTimeSlots.length === 0) {
      return null;
    }
    return this._bestTimeSlots[0];
  }

  /**
   * 获取响应率最低的时间段
   */
  public getWorstTimeSlot(): TimeSlotDTO | null {
    if (this._worstTimeSlots.length === 0) {
      return null;
    }
    return this._worstTimeSlots[0];
  }

  /**
   * 判断某个小时是否是好时机
   * @param hour 小时 (0-23)
   */
  public isGoodTimeToRemind(hour: number): boolean {
    if (hour < 0 || hour > 23) {
      throw new Error('hour must be between 0 and 23');
    }

    // 检查是否在最佳时间段内
    const inBestSlot = this._bestTimeSlots.some(
      (slot) => hour >= slot.hourStart && hour <= slot.hourEnd,
    );

    // 检查是否在最差时间段内
    const inWorstSlot = this._worstTimeSlots.some(
      (slot) => hour >= slot.hourStart && hour <= slot.hourEnd,
    );

    // 如果在最佳时间段内，返回 true
    if (inBestSlot) return true;

    // 如果在最差时间段内，返回 false
    if (inWorstSlot) return false;

    // 否则返回 true（中性时间段）
    return true;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): UserReminderPreferencesServerDTO {
    return {
      uuid: this.id,
      accountUuid: this._identityId,
      bestTimeSlots: [...this._bestTimeSlots],
      worstTimeSlots: [...this._worstTimeSlots],
      globalSmartFrequency: this._globalSmartFrequency,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): UserReminderPreferencesClientDTO {
    // 生成最佳时间段文本
    const bestTimeSlotsText = this._bestTimeSlots
      .map(
        (slot) =>
          `${String(slot.hourStart).padStart(2, '0')}:00-${String(slot.hourEnd).padStart(2, '0')}:00`,
      )
      .join(', ');

    // 生成最差时间段文本
    const worstTimeSlotsText = this._worstTimeSlots
      .map(
        (slot) =>
          `${String(slot.hourStart).padStart(2, '0')}:00-${String(slot.hourEnd).padStart(2, '0')}:00`,
      )
      .join(', ');

    return {
      uuid: this.id,
      accountUuid: this._identityId,
      bestTimeSlots: [...this._bestTimeSlots],
      worstTimeSlots: [...this._worstTimeSlots],
      globalSmartFrequency: this._globalSmartFrequency,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      bestTimeSlotsText,
      worstTimeSlotsText,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): UserReminderPreferencesPersistenceDTO {
    return {
      uuid: this.id,
      accountUuid: this._identityId,
      bestTimeSlots: JSON.stringify(this._bestTimeSlots),
      worstTimeSlots: JSON.stringify(this._worstTimeSlots),
      globalSmartFrequency: this._globalSmartFrequency,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
