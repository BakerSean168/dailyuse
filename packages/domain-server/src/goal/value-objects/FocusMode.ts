/**
 * FocusMode 值对象
 * 专注周期聚焦模式领域对象
 */

import type { FocusModeClientDTO, FocusModeServerDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';

/**
 * FocusMode Persistence DTO
 * 本地定义，用于数据库映射
 */
export interface FocusModePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  actualEndTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 聚焦模式值对象
 * 
 * @description
 * 表示用户的专注周期配置，支持选择 1-3 个目标进行聚焦，
 * 隐藏其他目标，减少视觉干扰。
 * 
 * **业务规则**:
 * - 聚焦目标数量：1-3 个
 * - 结束时间必须晚于开始时间
 * - 每个用户同时只能有一个激活的聚焦模式
 * 
 * **不可变性**:
 * 所有属性都是 readonly，修改操作返回新实例
 */
export class FocusMode {
  constructor(
    readonly uuid: string,
    readonly accountUuid: string,
    readonly focusedGoalUuids: readonly string[],
    readonly startTime: number,
    readonly endTime: number,
    readonly hiddenGoalsMode: HiddenGoalsMode,
    readonly isActive: boolean,
    readonly actualEndTime: number | null,
    readonly createdAt: number,
    readonly updatedAt: number,
  ) {
    this.validate();
  }

  /**
   * 验证业务规则
   */
  private validate(): void {
    // 验证聚焦目标数量 (1-3个)
    if (this.focusedGoalUuids.length < 1 || this.focusedGoalUuids.length > 3) {
      throw new Error('聚焦目标数量必须在 1-3 个之间');
    }

    // 验证时间范围
    if (this.endTime <= this.startTime) {
      throw new Error('结束时间必须晚于开始时间');
    }

    // 验证 UUID 格式
    if (!this.uuid || !this.accountUuid) {
      throw new Error('UUID 和 AccountUUID 不能为空');
    }
  }

  /**
   * 计算剩余天数
   * 
   * @returns 剩余天数（向上取整）
   */
  getRemainingDays(): number {
    const now = Date.now();
    const remaining = this.endTime - now;
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    return days > 0 ? days : 0;
  }

  /**
   * 检查是否已过期
   * 
   * @returns true 如果当前时间已超过结束时间
   */
  isExpired(): boolean {
    return Date.now() > this.endTime;
  }

  /**
   * 延长聚焦周期
   * 
   * @param newEndTime - 新的结束时间 (timestamp)
   * @returns 新的 FocusMode 实例
   * @throws {Error} 如果新结束时间不晚于当前结束时间
   */
  extend(newEndTime: number): FocusMode {
    if (newEndTime <= this.endTime) {
      throw new Error('新结束时间必须晚于当前结束时间');
    }

    return new FocusMode(
      this.uuid,
      this.accountUuid,
      this.focusedGoalUuids,
      this.startTime,
      newEndTime, // 更新结束时间
      this.hiddenGoalsMode,
      this.isActive,
      this.actualEndTime,
      this.createdAt,
      Date.now(), // 更新 updatedAt
    );
  }

  /**
   * 提前结束聚焦（停用）
   * 
   * @returns 新的 FocusMode 实例，isActive 设为 false
   */
  deactivate(): FocusMode {
    if (!this.isActive) {
      throw new Error('聚焦模式已经停用');
    }

    return new FocusMode(
      this.uuid,
      this.accountUuid,
      this.focusedGoalUuids,
      this.startTime,
      this.endTime,
      this.hiddenGoalsMode,
      false, // isActive = false
      Date.now(), // 记录实际结束时间
      this.createdAt,
      Date.now(), // 更新 updatedAt
    );
  }

  /**
   * transform to Persistence DTO
   */
  toPersistenceDTO(): FocusModePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: `${this.focusedGoalUuids.join(',')}-${this.startTime}`,
      startTime: new Date(this.startTime),
      endTime: new Date(this.endTime),
      isActive: this.isActive,
      actualEndTime: this.actualEndTime ? new Date(this.actualEndTime) : null,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    };
  }

  /**
   * 转换为服务端 DTO
   */
  toServerDTO(): FocusModeServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      focusedGoalUuids: [...this.focusedGoalUuids],
      startTime: this.startTime,
      endTime: this.endTime,
      hiddenGoalsMode: this.hiddenGoalsMode,
      isActive: this.isActive,
      actualEndTime: this.actualEndTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 转换为客户端 DTO
   */
  toClientDTO(): FocusModeClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      focusedGoalUuids: [...this.focusedGoalUuids],
      startTime: this.startTime,
      endTime: this.endTime,
      isActive: this.isActive,
      remainingDays: this.getRemainingDays(),
      hiddenGoalsMode: this.hiddenGoalsMode,
    };
  }

  /**
   * 从服务端 DTO 创建实例
   */
  static fromServerDTO(dto: FocusModeServerDTO): FocusMode {
    return new FocusMode(
      dto.uuid,
      dto.accountUuid,
      dto.focusedGoalUuids,
      dto.startTime,
      dto.endTime,
      dto.hiddenGoalsMode,
      dto.isActive,
      dto.actualEndTime,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  /**
   * 创建新的聚焦模式
   * 
   * @param accountUuid - 用户 UUID
   * @param focusedGoalUuids - 聚焦的目标 UUID 列表
   * @param endTime - 结束时间
   * @param hiddenGoalsMode - 隐藏模式
   * @returns 新的 FocusMode 实例
   */
  static create(
    uuid: string,
    accountUuid: string,
    focusedGoalUuids: string[],
    endTime: number,
    hiddenGoalsMode: HiddenGoalsMode = 'hide',
  ): FocusMode {
    const now = Date.now();

    return new FocusMode(
      uuid,
      accountUuid,
      focusedGoalUuids,
      now, // startTime = 当前时间
      endTime,
      hiddenGoalsMode,
      true, // isActive = true
      null, // actualEndTime = null
      now, // createdAt
      now, // updatedAt
    );
  }
}
