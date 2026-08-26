/**
 * Task Goal Link value object.
 *
 * ADR-056 separates the contextual Goal/KR link from the optional automatic
 * contribution rule. A link-only Task never emits Goal progress settlement.
 */

import { ValueObject } from '@memoflow/utils/domain';
import type {
  GoalContributionRule,
  TaskGoalBinding as ITaskGoalLink,
  TaskGoalBindingDTO as TaskGoalLinkDTO,
} from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import type { GoalId, KeyResultId } from '@memoflow/contracts/primitives';

export class TaskGoalBinding extends ValueObject<TaskGoalLinkDTO> implements ITaskGoalLink {
  private constructor(props: TaskGoalLinkDTO) {
    super(props);
  }

  public static create(props: TaskGoalLinkDTO): TaskGoalBinding {
    const normalized = this.normalize(props);
    this.validate(normalized);
    return new TaskGoalBinding(normalized);
  }

  public static bindToGoal(
    goalId: GoalId,
    keyResultId: KeyResultId,
    contribution: GoalContributionRule | null = null,
  ): TaskGoalBinding {
    return TaskGoalBinding.create({ goalId, keyResultId, contribution });
  }

  public static fromDTO(dto: TaskGoalLinkDTO): TaskGoalBinding {
    const normalized = TaskGoalBinding.normalize(dto);
    TaskGoalBinding.validate(normalized);
    return new TaskGoalBinding(normalized);
  }

  private static validate(props: TaskGoalLinkDTO): void {
    if (!props.goalId || props.goalId.trim().length === 0) {
      throw new Error('Goal ID is required');
    }
    if (!props.keyResultId || props.keyResultId.trim().length === 0) {
      throw new Error('Key Result ID is required');
    }
    if (!props.contribution) return;
    if (!Number.isFinite(props.contribution.value) || props.contribution.value <= 0) {
      throw new Error('Goal contribution value must be positive');
    }
    if (!Object.values(TaskGoalBindingTrigger).includes(props.contribution.trigger)) {
      throw new Error('Task goal contribution trigger is invalid');
    }
  }

  private static normalize(props: TaskGoalLinkDTO): TaskGoalLinkDTO {
    return {
      goalId: props.goalId,
      keyResultId: props.keyResultId,
      contribution: props.contribution ?? null,
    };
  }

  public get goalId(): GoalId {
    return this.props.goalId as GoalId;
  }

  public get keyResultId(): KeyResultId {
    return this.props.keyResultId as KeyResultId;
  }

  public get contribution(): GoalContributionRule | null {
    return this.props.contribution ? { ...this.props.contribution } : null;
  }

  public get hasContribution(): boolean {
    return this.props.contribution !== null;
  }

  public withContribution(contribution: GoalContributionRule | null): TaskGoalBinding {
    return TaskGoalBinding.create({ ...this.props, contribution });
  }

  public getDisplayText(): string {
    const contribution = this.props.contribution
      ? `, Contribution: ${this.props.contribution.value} (${this.props.contribution.trigger})`
      : ', Contribution: off';
    return `Goal: ${this.props.goalId}, KR: ${this.props.keyResultId}${contribution}`;
  }

  public toDTO(): TaskGoalLinkDTO {
    return {
      goalId: this.props.goalId,
      keyResultId: this.props.keyResultId,
      contribution: this.props.contribution ? { ...this.props.contribution } : null,
    };
  }
}
