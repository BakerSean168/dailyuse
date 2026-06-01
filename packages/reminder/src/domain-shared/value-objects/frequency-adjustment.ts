/**
 * FrequencyAdjustment 值对象
 * 
 * 频率调整记录：原始/调整后间隔、调整原因、用户确认状态
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  FrequencyAdjustment as IFrequencyAdjustment,
  FrequencyAdjustmentDTO,
} from '@dailyuse/contracts/reminder';

/**
 * FrequencyAdjustment 值对象实现
 */
export class FrequencyAdjustment extends ValueObject<FrequencyAdjustmentDTO> implements IFrequencyAdjustment {

  private constructor(props: FrequencyAdjustmentDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: FrequencyAdjustmentDTO): FrequencyAdjustment {
    return new FrequencyAdjustment(props);
  }

  public static createAuto(
    originalInterval: number,
    adjustedInterval: number,
    reason: string,
  ): FrequencyAdjustment {
    return new FrequencyAdjustment({
      originalInterval,
      adjustedInterval,
      adjustmentReason: reason,
      adjustmentTime: Date.now(),
      isAutoAdjusted: true,
      userConfirmed: false,
      rejectionReason: null,
    });
  }

  public static createManual(
    originalInterval: number,
    adjustedInterval: number,
    reason: string,
  ): FrequencyAdjustment {
    return new FrequencyAdjustment({
      originalInterval,
      adjustedInterval,
      adjustmentReason: reason,
      adjustmentTime: Date.now(),
      isAutoAdjusted: false,
      userConfirmed: true,
      rejectionReason: null,
    });
  }

  public static fromDTO(dto: FrequencyAdjustmentDTO): FrequencyAdjustment {
    return new FrequencyAdjustment(dto);
  }

  // ================= Getters =================

  public get originalInterval(): number {
    return this.props.originalInterval;
  }

  public get adjustedInterval(): number {
    return this.props.adjustedInterval;
  }

  public get adjustmentReason(): string {
    return this.props.adjustmentReason;
  }

  public get adjustmentTime(): number {
    return this.props.adjustmentTime;
  }

  public get isAutoAdjusted(): boolean {
    return this.props.isAutoAdjusted;
  }

  public get userConfirmed(): boolean {
    return this.props.userConfirmed;
  }

  public get rejectionReason(): string | null | undefined {
    return this.props.rejectionReason;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<FrequencyAdjustmentDTO>,
  ): FrequencyAdjustment {
    return new FrequencyAdjustment({ ...this.props, ...updates });
  }

  public confirm(): FrequencyAdjustment {
    return this.with({ userConfirmed: true, rejectionReason: null });
  }

  public reject(reason: string): FrequencyAdjustment {
    return this.with({ userConfirmed: false, rejectionReason: reason });
  }

  // ================= 计算属性 =================

  public get isPending(): boolean {
    return this.props.isAutoAdjusted && !this.props.userConfirmed && !this.props.rejectionReason;
  }

  public get isConfirmed(): boolean {
    return this.props.userConfirmed;
  }

  public get isRejected(): boolean {
    return !this.props.userConfirmed && !!this.props.rejectionReason;
  }

  public get changeRate(): number {
    if (this.props.originalInterval === 0) return 0;
    const change = ((this.props.adjustedInterval - this.props.originalInterval) / this.props.originalInterval) * 100;
    return Math.round(change);
  }

  // ================= 序列化 =================

  public toDTO(): FrequencyAdjustmentDTO {
    return { ...this.props };
  }
}
