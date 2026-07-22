/**
 * End-to-end integration: task:instance-completed 事件真跑一遍。
 *
 * 用真实 Prisma 仓储（不 mock 数据库），验证跨模块联动的完整链路：
 * 通过事件总线发布 task:instance-completed → registerGoalEventListeners 消费 payload
 * → CreateGoalRecordUseCase 落库 GoalRecord 并更新 KR 进度。
 */

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskGoalBindingTrigger } from '@dailyuse/contracts/task';
import type { TaskEventMap, TaskGoalBindingDTO } from '@dailyuse/contracts/task';
import { createTypedEventPublisher, eventBus } from '@dailyuse/utils/domain';
import { Goal } from '@/server/domain/aggregates/goal';
import { GoalPrismaRepository } from '../../infrastructure/adapters/prisma/goal-prisma.repository';
import { GoalRecordPrismaRepository } from '../../infrastructure/adapters/prisma/goal-record-prisma.repository';
import { registerGoalEventListeners } from './index';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

const taskPublisher = createTypedEventPublisher<Pick<TaskEventMap, 'task:instance-completed'>>(
  eventBus,
);

async function waitFor<T>(probe: () => Promise<T | null | undefined>, timeoutMs = 5000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value != null) return value;
    if (Date.now() > deadline) throw new Error('waitFor timed out');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

describe('registerGoalEventListeners integration', () => {
  let listeners: { start(): void; stop(): void };

  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  afterEach(() => {
    listeners?.stop();
  });

  it('persists a goal record and advances KR progress when a bound task completes', async () => {
    const prisma = await getPrisma();
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const goalRepository = new GoalPrismaRepository(prisma);
    const goalRecordRepository = new GoalRecordPrismaRepository(prisma);

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

    listeners = registerGoalEventListeners(goalRepository, goalRecordRepository);
    listeners.start();

    const goalBinding: TaskGoalBindingDTO = {
      goalId: goal.id as TaskGoalBindingDTO['goalId'],
      keyResultId: keyResult.id as TaskGoalBindingDTO['keyResultId'],
      goalRecordValue: 3,
      progressTrigger: TaskGoalBindingTrigger.PerInstance,
    };

    taskPublisher.send('task:instance-completed', {
      identityId: identityId as never,
      taskInstanceId: 'ti-int-1' as never,
      taskTemplateId: 'tt-int-1' as never,
      completedAt: Date.now(),
      taskTitle: 'Finish integration test',
      goalBinding,
      allInstancesCompleted: false,
    });

    // The listener reacts asynchronously and writes the record before advancing KR
    // progress, so poll on the KR progress to ensure the whole use-case has committed.
    const reloaded = await waitFor(async () => {
      const goalNow = await goalRepository.findById(goal.id, { includeChildren: true });
      const progress = goalNow?.getKeyResult(String(keyResult.id))?.progress.currentValue;
      return progress === 3 ? goalNow : null;
    });

    expect(reloaded?.getKeyResult(String(keyResult.id))?.progress.currentValue).toBe(3);

    const records = await goalRecordRepository.findByKeyResultId(String(goal.identityId), String(keyResult.id));
    expect(records).toHaveLength(1);
    expect(records[0].value).toBe(3);
  });
});
