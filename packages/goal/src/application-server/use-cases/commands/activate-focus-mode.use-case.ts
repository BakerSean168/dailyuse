import type { IFocusModeRepository, IGoalRepository } from '@/domain-server';
import { GoalPolicy, FocusSessionPolicy, FocusMode, Goal } from '@/domain-server';
import { FocusModeId } from '@/domain-shared';
import { createLogger } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ActivateFocusModeRequest, FocusModeClientDTO } from '@dailyuse/contracts/goal';

const DAY_MS = 24 * 60 * 60 * 1000;

export class ActivateFocusModeUseCase {
  private readonly logger = createLogger('goal:activate-focus-mode');

  constructor(
    private readonly focusModeRepository: IFocusModeRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
    private readonly focusSessionPolicy: FocusSessionPolicy,
  ) {}

  async execute(
    identityId: string,
    input: ActivateFocusModeRequest,
  ): Promise<Result<FocusModeClientDTO>> {
    this.logger.info('开始启用专注模式', {
      identityId,
      focusedGoalIds: input.focusedGoalIds,
      hiddenGoalsMode: input.hiddenGoalsMode,
    });
    if (!identityId?.trim()) {
      return error('UNAUTHORIZED', 'Identity ID is required');
    }

    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    this.logger.info('检查现有专注模式', {
      identityId,
      hasActiveFocusMode: !!activeFocusMode,
      activeFocusModeId: activeFocusMode?.id ?? null,
    });
    if (activeFocusMode) {
      return error('CONFLICT', 'Focus mode is already active');
    }

    const goals = await Promise.all(
      input.focusedGoalIds.map((goalId) => this.goalRepository.findById(goalId)),
    );
    const validGoals: Goal[] = [];

    for (const goal of goals) {
      if (!goal) {
        return error('NOT_FOUND', 'Selected goal not found');
      }
      this.goalPolicy.ensureGoalCanBeModified(goal);
      validGoals.push(goal);
    }

    this.focusSessionPolicy.ensureNoActiveSession([]);

    const endTime = Math.max(...validGoals.map((goal) => goal.targetDate?.getTime() ?? 0));
    const startTime = Date.now();
    if (endTime <= startTime) {
      return error('VALIDATION_ERROR', 'Focus mode end time must be later than now');
    }

    const focusMode = FocusMode.create(
      FocusModeId.generate(),
      identityId,
      input.focusedGoalIds,
      startTime,
      endTime,
      input.hiddenGoalsMode ?? 'Hide',
    );

    await this.focusModeRepository.save(focusMode);
    this.logger.info('专注模式已保存', {
      identityId,
      focusModeId: focusMode.id,
      isActive: focusMode.isActive,
      remainingDays: focusMode.getRemainingDays(),
    });
    return ok(focusMode.toClientDTO());
  }
}
