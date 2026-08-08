/**
 * End-to-end integration: Task -> Goal outbox 事件真跑一遍。
 *
 * R2-5b：贡献通道已收敛到 durable outbox（宿主不再直连订阅 task 事件）。
 * 本测试用真实 Prisma 仓储（不 mock 数据库），直接以 outbox 载荷驱动
 * GoalTaskProgressHandler（与 TaskGoalOutboxDispatcher 消费路径一致）：
 * apply(complete) 落库 GoalRecord 并更新 KR 进度 → 重复投递幂等 → revert(uncomplete) 撤销。
 */

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@memoflow/domain-shared';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import type { TaskGoalProgressOutboxEventV1, TaskGoalBindingDTO } from '@memoflow/contracts/task';
import { Goal } from '../../domain/aggregates/goal';
import { GoalPrismaRepository } from '../../infrastructure/adapters/prisma/goal-prisma.repository';
import { GoalRecordPrismaRepository } from '../../infrastructure/adapters/prisma/goal-record-prisma.repository';
import { createGoalTaskProgressHandler } from './index';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

async function waitFor<T>(probe: () => Promise<T | null | undefined>, timeoutMs = 5000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value != null) return value;
    if (Date.now() > deadline) throw new Error('waitFor timed out');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

describe('GoalTaskProgressHandler integration (outbox 消费路径)', () => {
  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  afterEach(() => {
    // handler 无定时器；此处保留结构占位。
  });

  it('persists a goal record and advances KR progress when a bound task completes', async () => {
    const prisma = await getPrisma();
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const goalRepository = new GoalPrismaRepository(prisma);
    const goalRecordRepository = new GoalRecordPrismaRepository(prisma);
    const handler = createGoalTaskProgressHandler(goalRepository, goalRecordRepository);

    // Persist a goal with a Sum key result so progress increments deterministically.
    const goal = Goal.create({
      identityId: identityId as IdentityId,
      name: 'Ship PR-2',
      description: null,
      color: '#0f766e',
      feasibilityAnalysis: null,
      motivation: null,
      importance: ImportanceLevel.Important,
      category: null,
      tags: [],
      startDate: null,
      targetDate: null,
      folderId: null,
      parentGoalId: null,
      reminderConfig: null,
    });
    const keyResult = goal.createAndAddKeyResult({
      title: 'Completed tasks',
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      startValue: 0,
      currentValue: 0,
      targetValue: 10,
      weight: 1,
      unit: 'tasks',
    });
    await goalRepository.save(goal);

    const goalBinding: TaskGoalBindingDTO = {
      goalId: goal.id as TaskGoalBindingDTO['goalId'],
      keyResultId: keyResult.id as TaskGoalBindingDTO['keyResultId'],
      goalRecordValue: 3,
      progressTrigger: TaskGoalBindingTrigger.PerInstance,
    };

    const readProgress = async (): Promise<number | undefined> => {
      const goalNow = await goalRepository.findByIdForIdentity(
        String(goal.identityId),
        goal.id,
        { includeChildren: true },
      );
      return goalNow?.getKeyResult(String(keyResult.id))?.progress.currentValue;
    };
    const waitForProgress = (expected: number) =>
      waitFor(async () => ((await readProgress()) === expected ? expected : null));

    const applyEvent = (completedAt: number): TaskGoalProgressOutboxEventV1 => ({
      eventId: `task-goal-progress:ti-int-1:${completedAt}`,
      schemaVersion: 1,
      eventType: 'task.goal-progress-requested',
      action: 'complete',
      identityId: identityId as never,
      taskInstanceId: 'ti-int-1' as never,
      taskTemplateId: 'tt-int-1' as never,
      goalId: goalBinding.goalId,
      keyResultId: goalBinding.keyResultId,
      goalRecordValue: goalBinding.goalRecordValue,
      progressTrigger: TaskGoalBindingTrigger.PerInstance,
      taskTitle: 'Finish integration test',
      occurredAt: completedAt,
    });
    const uncompleteEvent = (occurredAt: number): TaskGoalProgressOutboxEventV1 => ({
      eventId: `task-goal-remove:ti-int-1:${occurredAt}`,
      schemaVersion: 1,
      eventType: 'task.goal-progress-requested',
      action: 'uncomplete',
      identityId: identityId as never,
      taskInstanceId: 'ti-int-1' as never,
      taskTemplateId: 'tt-int-1' as never,
      goalId: '' as never,
      keyResultId: '' as never,
      goalRecordValue: 0,
      progressTrigger: TaskGoalBindingTrigger.PerInstance,
      taskTitle: '',
      occurredAt,
    });

    expect(await readProgress()).toBe(0);

    const t0 = Date.now();
    await handler.handle(applyEvent(t0));
    expect(await waitForProgress(3)).toBe(3);

    // 幂等：outbox 重放同 source 事件不重复累加。
    await handler.handle(applyEvent(t0));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(await readProgress()).toBe(3);

    await handler.handle(uncompleteEvent(t0 + 1));
    expect(await waitForProgress(0)).toBe(0);
  });
});
