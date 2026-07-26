/**
 * CompletionRecord 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-class-value-object-spec.md】
 * 
 * 任务完成记录：完成时间、实际时长、备注、评分
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  CompletionRecord as ICompletionRecord,
  CompletionRecordDTO,
} from '@dailyuse/contracts/task';
import type { Instant } from '@dailyuse/contracts/primitives';

/**
 * CompletionRecord 值对象实现
 * 
 * 包含：
 * - completedAt: 完成时间（存储为时间戳）
 * - actualDuration: 实际耗时（分钟，可选）
 * - note: 完成备注（可选）
 * - rating: 评分（1-5，可选）
 */
export class CompletionRecord extends ValueObject<CompletionRecordDTO> implements ICompletionRecord {

  private constructor(props: CompletionRecordDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: CompletionRecordDTO): CompletionRecord {
    this.validate(props);
    return new CompletionRecord(props);
  }

  // ================= 工厂方法 2: 快速完成 =================
  /**
   * 快速创建完成记录（仅记录时间）
   */
  public static complete(completedAt: Instant = Date.now()): CompletionRecord {
    return new CompletionRecord({
      completedAt,
      actualDuration: null,
      note: null,
      rating: null,
    });
  }

  // ================= 工厂方法 3: 带时长完成 =================
  /**
   * 创建带时长的完成记录
   */
  public static completeWithDuration(
    actualDuration: number,
    completedAt: Instant = Date.now(),
  ): CompletionRecord {
    return new CompletionRecord({
      completedAt,
      actualDuration,
      note: null,
      rating: null,
    });
  }

  // ================= 工厂方法 4: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: CompletionRecordDTO): CompletionRecord {
    return new CompletionRecord(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: CompletionRecordDTO): void {
    // 完成时间必须存在
    if (!props.completedAt) {
      throw new Error('Completed time is required');
    }

    // 实际时长必须为正数
    if (props.actualDuration !== null && props.actualDuration < 0) {
      throw new Error('Actual duration must be non-negative');
    }

    // 评分范围：1-5
    if (props.rating !== null && (props.rating < 1 || props.rating > 5)) {
      throw new Error('Rating must be between 1-5');
    }

    // 备注长度限制
    if (props.note && props.note.length > 500) {
      throw new Error('Note too long (max 500 characters)');
    }
  }

  // ================= Getters（只读暴露）=================

  /** ADR-037: Instant epoch ms (no mutable Date leakage). */
  public get completedAt(): Instant {
    return this.props.completedAt;
  }

  public get actualDuration(): number | null {
    return this.props.actualDuration;
  }

  public get note(): string | null {
    return this.props.note;
  }

  public get rating(): number | null {
    return this.props.rating;
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 设置实际时长
   */
  public setActualDuration(duration: number | null): CompletionRecord {
    const newProps = { ...this.props, actualDuration: duration };
    CompletionRecord.validate(newProps);
    return new CompletionRecord(newProps);
  }

  /**
   * 设置备注
   */
  public setNote(note: string | null): CompletionRecord {
    const newProps = { ...this.props, note };
    CompletionRecord.validate(newProps);
    return new CompletionRecord(newProps);
  }

  /**
   * 设置评分
   */
  public setRating(rating: number | null): CompletionRecord {
    const newProps = { ...this.props, rating };
    CompletionRecord.validate(newProps);
    return new CompletionRecord(newProps);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否有实际时长记录
   */
  public get hasDuration(): boolean {
    return this.props.actualDuration !== null;
  }

  /**
   * 是否有备注
   */
  public get hasNote(): boolean {
    return this.props.note !== null && this.props.note.length > 0;
  }

  /**
   * 是否有评分
   */
  public get hasRating(): boolean {
    return this.props.rating !== null;
  }

  /**
   * 是否为高评分（4-5分）
   */
  public get isHighRating(): boolean {
    return this.props.rating !== null && this.props.rating >= 4;
  }

  /**
   * 是否为低评分（1-2分）
   */
  public get isLowRating(): boolean {
    return this.props.rating !== null && this.props.rating <= 2;
  }

  /**
   * 获取格式化的时长字符串
   */
  public getDurationFormatted(): string | null {
    if (this.props.actualDuration === null) return null;
    const hours = Math.floor(this.props.actualDuration / 60);
    const minutes = this.props.actualDuration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * 距离现在经过的时间（秒数）
   */
  public getAgeInSeconds(): number {
    return Math.floor((Date.now() - this.props.completedAt) / 1000);
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): CompletionRecordDTO {
    return {
      completedAt: this.props.completedAt,
      actualDuration: this.props.actualDuration,
      note: this.props.note,
      rating: this.props.rating,
    };
  }

}
