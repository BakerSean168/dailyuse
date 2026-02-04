/**
 * KeyResultWeightSnapshot 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 关键成果权重快照：记录 KR 权重的历史变更
 * 用于权重调整的完整追溯和审计
 * 
 * 注意：
 * - 内部存储为 TransferDate (number/时间戳)
 * - Getter 返回 DomainDate (Date 对象)
 * 
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  KeyResultWeightSnapshot as IKeyResultWeightSnapshot,
  KeyResultWeightSnapshotDTO,
  KeyResultWeightSnapshotPersistenceDTO,
  SnapshotTrigger,
} from '@dailyuse/contracts/goal';
import type { GoalId, KeyResultId, IdentityId, KeyResultWeightSnapshotId } from '@dailyuse/contracts/primitives';

/**
 * KeyResultWeightSnapshot 值对象实现
 * 
 * 包含：
 * - id: 快照 ID
 * - goalId: 所属目标 ID
 * - keyResultId: 所属 KR ID
 * - oldWeight: 旧权重
 * - newWeight: 新权重
 * - weightDelta: 权重变化量
 * - snapshotTime: 快照记录时间（存储为时间戳）
 * - trigger: 触发方式（手动、自动、恢复、导入）
 * - reason: 变更原因（可选）
 * - operatorId: 操作人 ID
 * - createdAt: 创建时间（存储为时间戳）
 */
export class KeyResultWeightSnapshot
  extends ValueObject<KeyResultWeightSnapshotDTO>
  implements IKeyResultWeightSnapshot
{

  private constructor(props: KeyResultWeightSnapshotDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: KeyResultWeightSnapshotDTO): KeyResultWeightSnapshot {
    this.validate(props);
    return new KeyResultWeightSnapshot(props);
  }

  // ================= 工厂方法 2: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: KeyResultWeightSnapshotDTO): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot(dto);
  }

  // ================= 工厂方法 3: 从持久化 DTO 恢复 =================
  /**
   * 从数据库持久化 DTO 恢复值对象
   * 将 Date 对象转为时间戳
   */
  public static fromPersistenceDTO(
    dto: KeyResultWeightSnapshotPersistenceDTO,
  ): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot({
      id: dto.id,
      goalId: dto.goalId,
      keyResultId: dto.keyResultId,
      oldWeight: dto.oldWeight,
      newWeight: dto.newWeight,
      weightDelta: dto.weightDelta,
      snapshotTime: new Date(dto.snapshotTime).getTime(),
      trigger: dto.trigger as SnapshotTrigger,
      reason: dto.reason,
      operatorId: dto.operatorId,
      createdAt: new Date(dto.createdAt).getTime(),
    });
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: KeyResultWeightSnapshotDTO): void {
    // 权重值校验：0-100 之间
    if (props.oldWeight < 0 || props.oldWeight > 100) {
      throw new Error('Old weight must be between 0-100');
    }

    if (props.newWeight < 0 || props.newWeight > 100) {
      throw new Error('New weight must be between 0-100');
    }

    // 权重变化量校验：必须与实际差异相符
    const calculatedDelta = props.newWeight - props.oldWeight;
    if (Math.abs(calculatedDelta - props.weightDelta) > 0.0001) {
      throw new Error('Weight delta does not match (newWeight - oldWeight)');
    }

    // 日期顺序校验：snapshotTime <= createdAt
    if (props.snapshotTime > props.createdAt) {
      throw new Error('Snapshot time must be before or equal to created time');
    }

    // 原因校验：可选，但有长度限制
    if (props.reason && props.reason.length > 500) {
      throw new Error('Reason too long (max 500 characters)');
    }
  }

  // ================= Getters（只读暴露）=================
  // 返回对应的类型

  public get id(): KeyResultWeightSnapshotId {
    return this.props.id;
  }

  public get goalId(): GoalId {
    return this.props.goalId;
  }

  public get keyResultId(): KeyResultId {
    return this.props.keyResultId;
  }

  public get oldWeight(): number {
    return this.props.oldWeight;
  }

  public get newWeight(): number {
    return this.props.newWeight;
  }

  public get weightDelta(): number {
    return this.props.weightDelta;
  }

  /**
   * 返回 DomainDate (Date) 对象
   */
  public get snapshotTime(): Date {
    return new Date(this.props.snapshotTime);
  }

  public get trigger(): SnapshotTrigger {
    return this.props.trigger;
  }

  public get reason(): string | null {
    return this.props.reason;
  }

  public get operatorId(): IdentityId {
    return this.props.operatorId;
  }

  /**
   * 返回 DomainDate (Date) 对象
   */
  public get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否权重增加
   */
  public get isIncreased(): boolean {
    return this.props.weightDelta > 0;
  }

  /**
   * 是否权重减少
   */
  public get isDecreased(): boolean {
    return this.props.weightDelta < 0;
  }

  /**
   * 是否权重未变
   */
  public get isUnchanged(): boolean {
    return this.props.weightDelta === 0;
  }

  /**
   * 权重变化的百分比
   * 基于旧权重计算：(weightDelta / oldWeight) * 100
   */
  public getPercentageChange(): number {
    if (this.props.oldWeight === 0) {
      return this.props.newWeight > 0 ? 100 : 0;
    }
    return (this.props.weightDelta / this.props.oldWeight) * 100;
  }

  /**
   * 是否为手动调整
   */
  public get isManual(): boolean {
    return this.props.trigger === 'manual';
  }

  /**
   * 是否为自动调整
   */
  public get isAuto(): boolean {
    return this.props.trigger === 'auto';
  }

  /**
   * 是否为恢复操作
   */
  public get isRestore(): boolean {
    return this.props.trigger === 'restore';
  }

  /**
   * 是否为导入操作
   */
  public get isImport(): boolean {
    return this.props.trigger === 'import';
  }

  /**
   * 是否有原因说明
   */
  public get hasReason(): boolean {
    return this.props.reason !== null && this.props.reason.length > 0;
  }

  /**
   * 获取触发方式的显示文本
   */
  public getTriggerDisplayText(): string {
    const triggerMap: Record<SnapshotTrigger, string> = {
      manual: '手动调整',
      auto: '自动调整',
      restore: '恢复历史',
      import: '外部导入',
    };
    return triggerMap[this.props.trigger] || this.props.trigger;
  }

  /**
   * 获取权重变化的显示文本
   */
  public getDisplayText(): string {
    const changeText = this.isIncreased
      ? `↑ +${this.props.weightDelta.toFixed(2)}`
      : this.isDecreased
        ? `↓ ${this.props.weightDelta.toFixed(2)}`
        : '→ 无变化';

    return `${this.props.oldWeight.toFixed(2)} → ${this.props.newWeight.toFixed(2)} ${changeText}`;
  }

  /**
   * 距离现在经过的时间（秒数）
   */
  public getAgeInSeconds(): number {
    return Math.floor((Date.now() - this.props.createdAt) / 1000);
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   * 返回 TransferDate (number/时间戳) 格式
   */
  public toDTO(): KeyResultWeightSnapshotDTO {
    return {
      id: this.props.id,
      goalId: this.props.goalId,
      keyResultId: this.props.keyResultId,
      oldWeight: this.props.oldWeight,
      newWeight: this.props.newWeight,
      weightDelta: this.props.weightDelta,
      snapshotTime: this.props.snapshotTime,
      trigger: this.props.trigger,
      reason: this.props.reason,
      operatorId: this.props.operatorId,
      createdAt: this.props.createdAt,
    };
  }

  /**
   * 转换为持久化 DTO（用于数据库存储）
   * 将时间戳转为 Date 对象
   */
  public toPersistenceDTO(): KeyResultWeightSnapshotPersistenceDTO {
    return {
      id: this.props.id,
      goalId: this.props.goalId,
      keyResultId: this.props.keyResultId,
      oldWeight: this.props.oldWeight,
      newWeight: this.props.newWeight,
      weightDelta: this.props.weightDelta,
      snapshotTime: new Date(this.props.snapshotTime),
      trigger: this.props.trigger,
      reason: this.props.reason,
      operatorId: this.props.operatorId,
      createdAt: new Date(this.props.createdAt),
    };
  }
}
