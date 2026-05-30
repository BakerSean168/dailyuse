/**
 * GoalTimeRange 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 目标的时间范围：开始日期、目标日期、完成日期、归档日期
 * 
 * 注意：
 * - 内部存储为 TransferDate (number/时间戳)
 * - Getter 返回 DomainDate (Date 对象)
 * - 方法参数接受 DomainDate (Date 对象)，内部转为时间戳
 * 
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  GoalTimeRange as IGoalTimeRange,
  GoalTimeRangeDTO,
} from '@dailyuse/contracts/goal';
import type { DomainDate } from '@dailyuse/contracts/primitives';

/**
 * GoalTimeRange 值对象实现
 * 
 * 包含：
 * - startDate: 开始日期（可选）
 * - targetDate: 目标完成日期（可选）
 * - completedAt: 实际完成时间（可选）
 * - archivedAt: 归档时间（可选）
 */
export class GoalTimeRange extends ValueObject<GoalTimeRangeDTO> implements IGoalTimeRange {

  private constructor(props: GoalTimeRangeDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   * 
   * 注意：接受 TransferDate (number) 格式的 DTO
   */
  public static create(props: GoalTimeRangeDTO): GoalTimeRange {
    this.validate(props);
    return new GoalTimeRange(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 场景: 创建新目标时，生成默认时间范围
   * 
   * 接受 DomainDate，会转为 TransferDate (时间戳)
   */
  public static createDefault(startDate?: DomainDate): GoalTimeRange {
    return new GoalTimeRange({
      startDate: startDate ? startDate.getTime() : null,
      targetDate: null,
      completedAt: null,
      archivedAt: null,
    });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   * 接受 TransferDate (number) 格式
   */
  public static fromDTO(dto: GoalTimeRangeDTO): GoalTimeRange {
    return new GoalTimeRange(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   * 
   * 规则：
   * - startDate <= targetDate（如果都存在）
   * - targetDate <= completedAt（如果都存在）
   * - completedAt 和 archivedAt 不能同时存在
   */
  private static validate(props: GoalTimeRangeDTO): void {
    const { startDate, targetDate, completedAt, archivedAt } = props;

    // 日期顺序校验
    if (startDate !== null && targetDate !== null && startDate > targetDate) {
      throw new Error('Start date must be before or equal to target date');
    }

    if (targetDate !== null && completedAt !== null && targetDate > completedAt) {
      throw new Error('Target date must be before or equal to completed date');
    }

    // 逻辑一致性校验
    if (completedAt !== null && archivedAt !== null) {
      throw new Error('Goal cannot be both completed and archived');
    }
  }

  // ================= Getters（只读暴露）=================
  // 返回 DomainDate (Date) 对象

  public get startDate(): DomainDate | null {
    return this.props.startDate !== null ? new Date(this.props.startDate) : null;
  }

  public get targetDate(): DomainDate | null {
    return this.props.targetDate !== null ? new Date(this.props.targetDate) : null;
  }

  public get completedAt(): DomainDate | null {
    return this.props.completedAt !== null ? new Date(this.props.completedAt) : null;
  }

  public get archivedAt(): DomainDate | null {
    return this.props.archivedAt !== null ? new Date(this.props.archivedAt) : null;
  }

  // ================= 行为方法（不可变变更）=================
  // 接受 DomainDate，转为时间戳存储

  /**
   * 设置开始日期
   */
  public setStartDate(startDate: DomainDate | null): GoalTimeRange {
    const newProps = {
      ...this.props,
      startDate: startDate ? startDate.getTime() : null,
    };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  /**
   * 设置目标日期
   */
  public setTargetDate(targetDate: DomainDate | null): GoalTimeRange {
    const newProps = {
      ...this.props,
      targetDate: targetDate ? targetDate.getTime() : null,
    };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  /**
   * 标记为已完成
   */
  public markAsCompleted(completedAt: DomainDate = new Date()): GoalTimeRange {
    const newProps = {
      ...this.props,
      completedAt: completedAt.getTime(),
      archivedAt: null,
    };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  /**
   * 标记为已归档
   */
  public markAsArchived(archivedAt: DomainDate = new Date()): GoalTimeRange {
    const newProps = {
      ...this.props,
      archivedAt: archivedAt.getTime(),
      completedAt: null,
    };
    GoalTimeRange.validate(newProps);
    return new GoalTimeRange(newProps);
  }

  /**
   * 取消完成状态
   */
  public unmarkAsCompleted(): GoalTimeRange {
    return new GoalTimeRange({ ...this.props, completedAt: null });
  }

  /**
   * 取消归档状态
   */
  public unmarkAsArchived(): GoalTimeRange {
    return new GoalTimeRange({ ...this.props, archivedAt: null });
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否已完成
   */
  public get isCompleted(): boolean {
    return this.props.completedAt !== null;
  }

  /**
   * 是否已归档
   */
  public get isArchived(): boolean {
    return this.props.archivedAt !== null;
  }

  /**
   * 是否已终止（完成或归档）
   */
  public get isTerminal(): boolean {
    return this.isCompleted || this.isArchived;
  }

  /**
   * 是否超期（当前时间 > 目标日期，且未完成）
   */
  public get isOverdue(): boolean {
    if (this.props.targetDate === null || this.isCompleted || this.isArchived) {
      return false;
    }
    return Date.now() > this.props.targetDate;
  }

  /**
   * 距离目标日期的天数（正数表示还剩多少天，负数表示已超期多少天）
   */
  public getDaysToTargetDate(): number | null {
    if (this.props.targetDate === null) return null;

    const today = new Date();
    const timeDiff = this.props.targetDate - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取已用时长（天数，从 startDate 到现在或 completedAt）
   */
  public getElapsedDays(): number | null {
    if (this.props.startDate === null) return null;

    const end = this.props.completedAt ?? Date.now();
    const timeDiff = end - this.props.startDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * 计划时长（天数，从 startDate 到 targetDate）
   */
  public getPlannedDays(): number | null {
    if (this.props.startDate === null || this.props.targetDate === null) return null;

    const timeDiff = this.props.targetDate - this.props.startDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   * 返回 TransferDate (number/时间戳) 格式
   */
  public toDTO(): GoalTimeRangeDTO {
    return {
      startDate: this.props.startDate,
      targetDate: this.props.targetDate,
      completedAt: this.props.completedAt,
      archivedAt: this.props.archivedAt,
    };
  }

}
