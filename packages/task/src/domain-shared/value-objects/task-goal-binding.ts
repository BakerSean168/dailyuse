/**
 * TaskGoalBinding 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 任务目标绑定：关联任务与 OKR 目标/关键成果
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  TaskGoalBinding as ITaskGoalBinding,
  TaskGoalBindingDTO,
  TaskGoalBindingPersistenceDTO,
  TaskGoalBindingTrigger as TaskGoalBindingTriggerValue,
} from '@dailyuse/contracts/task';
import { TaskGoalBindingTrigger } from '@dailyuse/contracts/task';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';

/**
 * TaskGoalBinding 值对象实现
 * 
 * 包含：
 * - goalId: 关联的目标 ID
 * - keyResultId: 关联的关键成果 ID
 * - goalRecordValue: 完成任务时对 KR 的贡献值
 */
export class TaskGoalBinding extends ValueObject<TaskGoalBindingDTO> implements ITaskGoalBinding {

  private constructor(props: TaskGoalBindingDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   */
  public static create(props: TaskGoalBindingDTO): TaskGoalBinding {
    const normalized = this.normalize(props);
    this.validate(normalized);
    return new TaskGoalBinding(normalized);
  }

  // ================= 工厂方法 2: 快速创建 =================
  /**
   * 快速创建绑定
   */
  public static bindToGoal(
    goalId: GoalId,
    keyResultId: KeyResultId,
    goalRecordValue: number = 1,
    progressTrigger: TaskGoalBindingTriggerValue = TaskGoalBindingTrigger.PerInstance,
  ): TaskGoalBinding {
    return TaskGoalBinding.create({
      goalId,
      keyResultId,
      goalRecordValue,
      progressTrigger,
    });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   */
  public static fromDTO(dto: TaskGoalBindingDTO): TaskGoalBinding {
    return new TaskGoalBinding(TaskGoalBinding.normalize(dto));
  }

  // ================= 工厂方法 4: 从持久化 DTO 恢复 =================
  /**
   * 从数据库持久化 DTO 恢复值对象
   */
  public static fromPersistenceDTO(dto: TaskGoalBindingPersistenceDTO): TaskGoalBinding {
    return new TaskGoalBinding(TaskGoalBinding.normalize({
      goalId: dto.goalId as GoalId,
      keyResultId: dto.keyResultId as KeyResultId,
      goalRecordValue: dto.goalRecordValue,
      progressTrigger: dto.progressTrigger,
    }));
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: TaskGoalBindingDTO): void {
    if (!props.goalId || props.goalId.trim().length === 0) {
      throw new Error('Goal ID is required');
    }

    if (!props.keyResultId || props.keyResultId.trim().length === 0) {
      throw new Error('Key Result ID is required');
    }

    if (props.goalRecordValue < 0) {
      throw new Error('Goal record value must be non-negative');
    }

    if (!Object.values(TaskGoalBindingTrigger).includes(props.progressTrigger)) {
      throw new Error('Task goal binding trigger is invalid');
    }
  }

  private static normalize(
    props: Omit<TaskGoalBindingDTO, 'progressTrigger'> & {
      progressTrigger?: TaskGoalBindingTriggerValue;
    },
  ): TaskGoalBindingDTO {
    return {
      ...props,
      progressTrigger: props.progressTrigger ?? TaskGoalBindingTrigger.PerInstance,
    };
  }

  // ================= Getters（只读暴露）=================

  public get goalId(): GoalId {
    return this.props.goalId as GoalId;
  }

  public get keyResultId(): KeyResultId {
    return this.props.keyResultId as KeyResultId;
  }

  public get goalRecordValue(): number {
    return this.props.goalRecordValue;
  }

  public get progressTrigger(): TaskGoalBindingTriggerValue {
    return this.props.progressTrigger;
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 更新贡献值
   */
  public updateGoalRecordValue(value: number): TaskGoalBinding {
    const newProps = { ...this.props, goalRecordValue: value };
    TaskGoalBinding.validate(newProps);
    return new TaskGoalBinding(newProps);
  }

  public updateProgressTrigger(progressTrigger: TaskGoalBindingTriggerValue): TaskGoalBinding {
    const newProps = { ...this.props, progressTrigger };
    TaskGoalBinding.validate(newProps);
    return new TaskGoalBinding(newProps);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否有贡献值
   */
  public get hasContribution(): boolean {
    return this.props.goalRecordValue > 0;
  }

  /**
   * 获取显示文本
   */
  public getDisplayText(): string {
    return `Goal: ${this.props.goalId}, KR: ${this.props.keyResultId}, Value: ${this.props.goalRecordValue}, Trigger: ${this.props.progressTrigger}`;
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): TaskGoalBindingDTO {
    return {
      goalId: this.props.goalId,
      keyResultId: this.props.keyResultId,
      goalRecordValue: this.props.goalRecordValue,
      progressTrigger: this.props.progressTrigger,
    };
  }

  /**
   * 转换为持久化 DTO（用于数据库存储）
   */
  public toPersistenceDTO(): TaskGoalBindingPersistenceDTO {
    return {
      goalId: this.props.goalId,
      keyResultId: this.props.keyResultId,
      goalRecordValue: this.props.goalRecordValue,
      progressTrigger: this.props.progressTrigger,
    };
  }
}
