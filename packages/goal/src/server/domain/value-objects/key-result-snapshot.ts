/**
 * KeyResultSnapshot 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-class-value-object-spec.md】
 * 
 * 关键成果快照：用于复盘记录时的数据快照
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@memoflow/utils/domain';
import type {
  KeyResultSnapshot as IKeyResultSnapshot,
  KeyResultSnapshotDTO,
} from '@memoflow/contracts/goal';
import type { KeyResultId } from '@memoflow/contracts/primitives';

/**
 * KeyResultSnapshot 值对象实现
 * 
 * 包含：
 * - keyResultId: KR 的 ID
 * - title: KR 的标题
 * - targetValue: 目标值
 * - currentValue: 当前值
 * - progressPercentage: 进度百分比
 */
export class KeyResultSnapshot extends ValueObject<KeyResultSnapshotDTO> implements IKeyResultSnapshot {

  private constructor(props: KeyResultSnapshotDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: KeyResultSnapshotDTO): KeyResultSnapshot {
    this.validate(props);
    return new KeyResultSnapshot(props);
  }

  // ================= 工厂方法 2: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: KeyResultSnapshotDTO): KeyResultSnapshot {
    return new KeyResultSnapshot(dto);
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: KeyResultSnapshotDTO): void {
    // 标题校验
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (props.title.length > 200) {
      throw new Error('Title too long (max 200 characters)');
    }

    // 进度百分比校验
    if (props.progressPercentage < 0 || props.progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0-100');
    }

    // 值的逻辑校验
    if (props.targetValue <= 0) {
      throw new Error('Target value must be positive');
    }

    if (props.currentValue < 0) {
      throw new Error('Current value cannot be negative');
    }
  }

  // ================= Getters（只读暴露）=================

  public get keyResultId(): KeyResultId {
    return this.props.keyResultId;
  }

  public get title(): string {
    return this.props.title;
  }

  public get targetValue(): number {
    return this.props.targetValue;
  }

  public get currentValue(): number {
    return this.props.currentValue;
  }

  public get progressPercentage(): number {
    return this.props.progressPercentage;
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否完成（进度百分比 >= 100）
   */
  public get isCompleted(): boolean {
    return this.props.progressPercentage >= 100;
  }

  /**
   * 剩余值
   */
  public getRemainingValue(): number {
    return Math.max(0, this.props.targetValue - this.props.currentValue);
  }

  /**
   * 获取进度等级
   */
  public getProgressLevel(): 'not-started' | 'in-progress' | 'completed' {
    if (this.props.progressPercentage === 0) {
      return 'not-started';
    }
    if (this.props.progressPercentage >= 100) {
      return 'completed';
    }
    return 'in-progress';
  }

  /**
   * 获取显示文本
   */
  public getDisplayText(): string {
    return `${this.props.title}: ${this.props.currentValue}/${this.props.targetValue} (${Math.round(this.props.progressPercentage)}%)`;
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): KeyResultSnapshotDTO {
    return {
      keyResultId: this.props.keyResultId,
      title: this.props.title,
      targetValue: this.props.targetValue,
      currentValue: this.props.currentValue,
      progressPercentage: this.props.progressPercentage,
    };
  }

}
