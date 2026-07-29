/**
 * Clone Goal Use Case
 *
 * Reads the original goal, builds a CreateGoalReq with defaults (name="${original} (Copy)"),
 * and delegates to CreateGoalUseCase.
 * Replaces the inline workflow previously in GoalController.cloneGoal().
 */

import type { IGoalRepository } from '../../../domain';
import { CreateGoalSchema } from '@memoflow/contracts/goal';
import type { CloneGoalReq, CreateGoalReq, GoalClientDTO } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { CreateGoalUseCase } from './create-goal.use-case';

export class CloneGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly createGoal: CreateGoalUseCase,
  ) {}

  async execute(
    goalId: string,
    params: CloneGoalReq,
    cx: ExecutionContext,
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findByIdForIdentity(cx.identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    const createData = toCreateGoalReqFromCloneSource(goal, params);

    return this.createGoal.execute(createData, cx);
  }
}

function toCreateGoalReqFromCloneSource(
  original: Pick<
    GoalClientDTO,
    'name' | 'description' | 'importance' | 'category' | 'tags'
  >,
  params: CloneGoalReq,
): CreateGoalReq {
  return CreateGoalSchema.parse({
    name: params.name ?? `${original.name} (Copy)`,
    description: params.description ?? original.description ?? undefined,
    importance: original.importance,
    category: original.category ?? undefined,
    tags: original.tags.length > 0 ? original.tags : undefined,
  });
}
