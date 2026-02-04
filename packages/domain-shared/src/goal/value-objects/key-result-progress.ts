/**
 * KeyResultProgress 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 关键成果的进度信息：目标值、当前值、计算方法等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  KeyResultProgress as IKeyResultProgress,
  KeyResultProgressDTO,
  KeyResultProgressPersistenceDTO,
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

  // ================= 工厂方法 4: 从持久化 DTO 恢复 =================
  /**
   * 从数据库持久化 DTO 恢复值对象
   */
  public static fromPersistenceDTO(dto: KeyResultProgressPersistenceDTO): KeyResultProgress {
    return new KeyResultProgress({
      valueType: dto.valueType as KeyResultValueType,
      aggregationMethod: dto.aggregationMethod as KeyResultCalculationMethod,
      initialValue: dto.initialValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit,
    });
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

  // ================= 计算属性（Rich Logic）=================

  /**
   * 进度百分比（0-100）
   * 公式：(currentValue - initialValue) / (targetValue - initialValue) * 100
   */
  public getProgressPercentage(): number {
    const range = this.props.targetValue - this.props.initialValue;
    if (range === 0) return 0;

    const progress = this.props.currentValue - this.props.initialValue;
    let percentage = (progress / range) * 100;

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

  /**
   * 转换为持久化 DTO（用于数据库存储）
   */
  public toPersistenceDTO(): KeyResultProgressPersistenceDTO {
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
