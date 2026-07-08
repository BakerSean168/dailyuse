/**
 * KeyResultProgress 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-class-value-object-spec.md】
 * 
 * 关键成果的进度信息：目标值、当前值、计算方法等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  KeyResultProgress as IKeyResultProgress,
  KeyResultProgressDTO,
  KeyResultValueType,
  KeyResultCalculationMethod,
} from '@dailyuse/contracts/goal';

/**
 * KeyResultProgress 值对象实现
 * 
 * 包含：
 * - valueType: 值类型（数值、百分比等）
 * - aggregationMethod: 聚合方法（求和、平均值等）
 * - initialValue: 起始值
 * - targetValue: 目标值
 * - currentValue: 当前值
 * - unit: 单位（可选，如 "%"、"个"）
 */
export class KeyResultProgress extends ValueObject<KeyResultProgressDTO> implements IKeyResultProgress {

  private constructor(props: KeyResultProgressDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: KeyResultProgressDTO): KeyResultProgress {
    this.validate(props);
    return new KeyResultProgress(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 场景: 创建新 KR 时，生成默认进度
   */
  public static createDefault(targetValue: number): KeyResultProgress {
    return new KeyResultProgress({
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      initialValue: 0,
      targetValue,
      currentValue: 0,
      unit: null,
    });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: KeyResultProgressDTO): KeyResultProgress {
    return new KeyResultProgress(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: KeyResultProgressDTO): void {
    // 值的逻辑校验
    if (props.initialValue === undefined || props.initialValue === null) {
      throw new Error('Initial value is required');
    }

    if (props.targetValue === props.initialValue) {
      throw new Error('Target value must be different from initial value');
    }

    // 百分比类型的值范围校验
    if (props.valueType === 'Percentage') {
      if (props.initialValue < 0 || props.initialValue > 100) {
        throw new Error('Percentage initial value must be between 0-100');
      }
      if (props.targetValue < 0 || props.targetValue > 100) {
        throw new Error('Percentage target value must be between 0-100');
      }
      if (props.currentValue < 0 || props.currentValue > 100) {
        throw new Error('Percentage current value must be between 0-100');
      }
    }

    // 单位长度校验
    if (props.unit && props.unit.length > 20) {
      throw new Error('Unit too long (max 20 characters)');
    }
  }

  // ================= Getters（只读暴露）=================

  public get valueType(): KeyResultValueType {
    return this.props.valueType;
  }

  public get aggregationMethod(): KeyResultCalculationMethod {
    return this.props.aggregationMethod;
  }

  public get initialValue(): number {
    return this.props.initialValue;
  }

  public get targetValue(): number {
    return this.props.targetValue;
  }

  public get currentValue(): number {
    return this.props.currentValue;
  }

  public get unit(): string | null {
    return this.props.unit;
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 更新当前值
   */
  public updateCurrentValue(currentValue: number): KeyResultProgress {
    const newProps = { ...this.props, currentValue };
    KeyResultProgress.validate(newProps);
    return new KeyResultProgress(newProps);
  }

  /**
   * 增加进度
   */
  public increment(delta: number): KeyResultProgress {
    return this.updateCurrentValue(this.props.currentValue + delta);
  }

  /**
   * 递减进度
   */
  public decrement(delta: number): KeyResultProgress {
    return this.updateCurrentValue(this.props.currentValue - delta);
  }

  /**
   * 重置为初始值
   */
  public reset(): KeyResultProgress {
    return this.updateCurrentValue(this.props.initialValue);
  }

  /**
   * 设置为目标值
   */
  public setToTarget(): KeyResultProgress {
    return this.updateCurrentValue(this.props.targetValue);
  }

  // ================= 聚合计算方法（根据不同的计算类型）=================

  /**
   * 根据聚合方法计算聚合值
   * 
   * @param values 需要聚合的数值数组
   * @returns 计算后的聚合值
   * 
   * 支持的计算方式：
   * - Sum: 求和
   * - Average: 平均值
   * - Max: 最大值
   * - Min: 最小值
   * - Last: 最后一个值
   */
  public calculateAggregatedValue(values: number[]): number {
    if (values.length === 0) return this.props.initialValue;

    switch (this.props.aggregationMethod) {
      case 'Sum':
        return this.props.initialValue + values.reduce((sum, val) => sum + val, 0);

      case 'Average':
        return values.reduce((sum, val) => sum + val, 0) / values.length;

      case 'Max':
        return Math.max(...values);

      case 'Min':
        return Math.min(...values);

      case 'Last':
        return values[values.length - 1];

      default:
        return this.props.initialValue;
    }
  }

  /**
   * 根据聚合方法更新当前值
   * 
   * @param values 新的数值数组
   * @returns 更新后的新实例
   * @deprecated 建议使用 recalculateFromHistory 方法，更清晰地表达语义
   */
  public updateCurrentValueByAggregation(values: number[]): KeyResultProgress {
    return this.recalculateFromHistory(values);
  }

  /**
   * ✅ 纯计算方法：根据历史数据重新计算当前状态
   * 
   * 【DDD 原则】
   * - 值对象是纯内存操作，不依赖任何外部数据源
   * - 所有输入都通过参数传入
   * - 返回新的不可变实例
   * 
   * 【使用场景】
   * 1. 用户添加新的进度记录
   * 2. 用户删除或修改历史记录
   * 3. 系统需要重新计算进度（数据迁移、修复等）
   * 
   * @param historyValues 历史记录的值数组（按时间排序）
   * @returns 计算后的新 KeyResultProgress 实例
   * 
   * @example
   * // 在 GoalProgressCalculator 领域服务中使用
   * const values = [10, 20, 30]; // 从 Repository 查询得到
   * const newProgress = keyResult.progress.recalculateFromHistory(values);
   */
  public recalculateFromHistory(historyValues: number[]): KeyResultProgress {
    // 如果没有历史记录，重置为初始值
    if (historyValues.length === 0) {
      return this.updateCurrentValue(this.props.initialValue);
    }

    const aggregatedValue = this.calculateAggregatedValue(historyValues);
    return this.updateCurrentValue(aggregatedValue);
  }

  /**
   * 获取当前聚合方法的描述
   */
  public getAggregationMethodDescription(): string {
    const descriptions: Record<KeyResultCalculationMethod, string> = {
      'Sum': '求和所有子项值',
      'Average': '计算所有子项的平均值',
      'Max': '取最大的子项值',
      'Min': '取最小的子项值',
      'Last': '取最后一个子项的值',
    };
    return descriptions[this.props.aggregationMethod] || '未知计算方式';
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 进度百分比（0-100）
   * 公式：(currentValue - initialValue) / (targetValue - initialValue) * 100
   */
  public getProgressPercentage(): number {
    const range = this.props.targetValue - this.props.initialValue;
    if (range === 0) return 0;

    const progress = this.props.currentValue - this.props.initialValue;
    const percentage = (progress / range) * 100;

    // 限制在 0-100 范围内（超过目标值会显示 >100%）
    return Math.max(0, Math.min(percentage, 100));
  }

  /**
   * 是否已达成目标
   */
  public get isCompleted(): boolean {
    // 上升型：当前值 >= 目标值
    if (this.props.targetValue > this.props.initialValue) {
      return this.props.currentValue >= this.props.targetValue;
    }
    // 下降型：当前值 <= 目标值
    return this.props.currentValue <= this.props.targetValue;
  }

  /**
   * 剩余需要达成的值
   */
  public getRemainingValue(): number {
    return Math.abs(this.props.targetValue - this.props.currentValue);
  }

  /**
   * 已完成的值
   */
  public getCompletedValue(): number {
    return Math.abs(this.props.currentValue - this.props.initialValue);
  }

  /**
   * 进度方向：up（上升）或 down（下降）
   */
  public getDirection(): 'up' | 'down' {
    return this.props.targetValue > this.props.initialValue ? 'up' : 'down';
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): KeyResultProgressDTO {
    return {
      valueType: this.props.valueType,
      aggregationMethod: this.props.aggregationMethod,
      initialValue: this.props.initialValue,
      targetValue: this.props.targetValue,
      currentValue: this.props.currentValue,
      unit: this.props.unit,
    };
  }

}
