/**
 * RecurrenceRule 值对象
 *
 * 【规范说明：Class 类型值对象 - 参考 domain-class-value-object-spec.md】
 *
 * 任务重复规则：频率、间隔、结束条件等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  RecurrenceRule as IRecurrenceRule,
  RecurrenceRuleDTO,
  RecurrenceFrequency,
  DayOfWeek,
} from '@dailyuse/contracts/task';
import type { DomainDate } from '@dailyuse/contracts/primitives';

/**
 * RecurrenceRule 值对象实现
 *
 * 包含：
 * - frequency: 重复频率（Daily, Weekly, Monthly, Yearly）
 * - interval: 间隔（如每2天、每3周）
 * - daysOfWeek: 星期几（WEEKLY时使用）
 * - endDate: 结束日期（可选，存储为时间戳）
 * - occurrences: 重复次数（可选）
 */
export class RecurrenceRule extends ValueObject<RecurrenceRuleDTO> implements IRecurrenceRule {
  private constructor(props: RecurrenceRuleDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: RecurrenceRuleDTO): RecurrenceRule {
    this.validate(props);
    return new RecurrenceRule(props);
  }

  // ================= 工厂方法 2: 创建每日重复 =================
  /**
   * 创建每日重复规则
   */
  public static createDaily(interval: number = 1): RecurrenceRule {
    return new RecurrenceRule({
      frequency: 'Daily',
      interval,
      daysOfWeek: [],
      endDate: null,
      occurrences: null,
    });
  }

  // ================= 工厂方法 3: 创建每周重复 =================
  /**
   * 创建每周重复规则
   */
  public static createWeekly(daysOfWeek: DayOfWeek[], interval: number = 1): RecurrenceRule {
    return new RecurrenceRule({
      frequency: 'Weekly',
      interval,
      daysOfWeek,
      endDate: null,
      occurrences: null,
    });
  }

  // ================= 工厂方法 4: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: RecurrenceRuleDTO): RecurrenceRule {
    return new RecurrenceRule(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: RecurrenceRuleDTO): void {
    if (props.endDate !== null && props.occurrences !== null) {
      throw new Error('Recurrence rule cannot define both endDate and occurrences');
    }

    // 间隔必须为正数
    if (props.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (props.interval > 365) {
      throw new Error('Interval too large (max 365)');
    }

    // 每周重复必须指定星期几
    if (props.frequency === 'Weekly' && props.daysOfWeek.length === 0) {
      throw new Error('Weekly recurrence requires at least one day of week');
    }

    // 重复次数必须为正数
    if (props.occurrences !== null && props.occurrences < 1) {
      throw new Error('Occurrences must be at least 1');
    }

    // 结束日期必须在将来（如果设置）
    if (props.endDate !== null && props.endDate < Date.now()) {
      // 允许过去的日期，但可以在业务逻辑中警告
    }
  }

  // ================= Getters（只读暴露）=================

  public get frequency(): RecurrenceFrequency {
    return this.props.frequency;
  }

  public get interval(): number {
    return this.props.interval;
  }

  public get daysOfWeek(): DayOfWeek[] {
    return [...this.props.daysOfWeek];
  }

  public get endDate(): DomainDate | null {
    return this.props.endDate !== null ? new Date(this.props.endDate) : null;
  }

  public get occurrences(): number | null {
    return this.props.occurrences;
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 设置间隔
   */
  public setInterval(interval: number): RecurrenceRule {
    const newProps = { ...this.props, interval };
    RecurrenceRule.validate(newProps);
    return new RecurrenceRule(newProps);
  }

  /**
   * 设置结束日期
   */
  public setEndDate(endDate: DomainDate | null): RecurrenceRule {
    const newProps = {
      ...this.props,
      endDate: endDate ? endDate.getTime() : null,
      occurrences: null, // 清除重复次数
    };
    RecurrenceRule.validate(newProps);
    return new RecurrenceRule(newProps);
  }

  /**
   * 设置重复次数
   */
  public setOccurrences(occurrences: number | null): RecurrenceRule {
    const newProps = {
      ...this.props,
      occurrences,
      endDate: null, // 清除结束日期
    };
    RecurrenceRule.validate(newProps);
    return new RecurrenceRule(newProps);
  }

  /**
   * 更新星期几（仅 Weekly 有效）
   */
  public setDaysOfWeek(daysOfWeek: DayOfWeek[]): RecurrenceRule {
    const newProps = { ...this.props, daysOfWeek };
    RecurrenceRule.validate(newProps);
    return new RecurrenceRule(newProps);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否为每日重复
   */
  public get isDaily(): boolean {
    return this.props.frequency === 'Daily';
  }

  /**
   * 是否为每周重复
   */
  public get isWeekly(): boolean {
    return this.props.frequency === 'Weekly';
  }

  /**
   * 是否为每月重复
   */
  public get isMonthly(): boolean {
    return this.props.frequency === 'Monthly';
  }

  /**
   * 是否为每年重复
   */
  public get isYearly(): boolean {
    return this.props.frequency === 'Yearly';
  }

  /**
   * 是否有结束条件
   */
  public get hasEndCondition(): boolean {
    return this.props.endDate !== null || this.props.occurrences !== null;
  }

  /**
   * 获取人类可读的描述
   */
  public getDescription(): string {
    const frequencyText: Record<RecurrenceFrequency, string> = {
      Daily: '天',
      Weekly: '周',
      Monthly: '月',
      Yearly: '年',
    };

    let desc = `每${this.props.interval === 1 ? '' : this.props.interval}${frequencyText[this.props.frequency]}`;

    if (this.props.frequency === 'Weekly' && this.props.daysOfWeek.length > 0) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const days = this.props.daysOfWeek.map((d) => dayNames[d]).join('、');
      desc += `（${days}）`;
    }

    return desc;
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): RecurrenceRuleDTO {
    return {
      frequency: this.props.frequency,
      interval: this.props.interval,
      daysOfWeek: [...this.props.daysOfWeek],
      endDate: this.props.endDate,
      occurrences: this.props.occurrences,
    };
  }

}
