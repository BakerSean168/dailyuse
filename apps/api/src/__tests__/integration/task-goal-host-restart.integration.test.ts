import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import express from 'express';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { TaskGoalBindingTrigger, TaskType } from '@memoflow/contracts/task';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { prisma } from '@memoflow/database';
import { IdentityId } from '@memoflow/domain-shared';
import { createGoalPrismaModule, createGoalTaskProgressPrismaHandler } from '@memoflow/goal';
import { createTaskPrismaModule } from '@memoflow/task';
import { createTaskApiModule } from '@memoflow/task/api';
import {
  cleanAll,
  disconnectPrisma,
  seedAccount,
} from '@memoflow/test-utils/setup/integration-helpers';

const execFileAsync = promisify(execFile);

describe('API host Task -> Goal restart recovery', () => {
  beforeEach(async () => {
    await cleanAll();
  });

  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  it('delivers a committed Task contribution after the completing host exits', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const goalModule = createGoalPrismaModule(prisma);
    const createdGoal = await goalModule.api.createGoal(
      {
        name: 'Recover Task contribution after restart',
        color: '#2563eb',
        importance: ImportanceLevel.Important,
        tags: [],
        initialKeyResults: [
          {
            title: 'Complete the durable task',
            valueType: 'Incremental',
            calculationMethod: 'Sum',
            startValue: 0,
            currentValue: 0,
            targetValue: 10,
            weight: 1,
          },
        ],
      },
      { identityId },
    );
    expect(createdGoal.ok).toBe(true);
    if (!createdGoal.ok) return;

    const goalId = createdGoal.data.readModel.id;
    const keyResultId = createdGoal.data.readModel.keyResults[0]?.id;
    expect(keyResultId).toBeDefined();
    if (!keyResultId) return;

    const taskModule = createTaskPrismaModule(prisma);
    const createdTask = await taskModule.api.createTaskTemplate({
      identityId,
      name: 'Persist contribution before host exit',
      taskType: TaskType.OneTime,
      timeConfig: {
        timeType: 'AllDay',
        startDate: Date.now(),
        timePoint: null,
        timeRange: null,
      },
      importance: ImportanceLevel.Moderate,
      tags: [],
      goalBinding: {
        goalId,
        keyResultId,
        goalRecordValue: 2,
        progressTrigger: TaskGoalBindingTrigger.PerInstance,
      },
    });
    expect(createdTask.ok).toBe(true);
    if (!createdTask.ok) return;

    const taskInstance = await prisma.taskInstance.findFirstOrThrow({
      where: { templateId: createdTask.data.template.id },
    });
    const fixturePath = path.resolve(__dirname, 'fixtures/complete-task-and-exit.ts');
    const tsxPath = path.resolve(__dirname, '../../../../../node_modules/tsx/dist/cli.mjs');

    const child = await execFileAsync(
      process.execPath,
      [tsxPath, fixturePath, taskInstance.id, String(identityId)],
      { env: process.env },
    );
    expect(child.stdout).toContain('TASK_COMMITTED');

    await expect(
      prisma.taskGoalOutbox.findFirstOrThrow({
        where: { taskInstanceId: taskInstance.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' });
    await expect(prisma.goalRecord.count({ where: { keyResultId } })).resolves.toBe(0);

    const restartedHost = createTaskApiModule({
      goalProgressHandler: createGoalTaskProgressPrismaHandler(prisma),
    });
    const app = express();
    restartedHost.register({
      app,
      router: express.Router(),
      db: prisma,
      middleware: {
        auth: (_request, _response, next) => next(),
        requireRole: () => (_request, _response, next) => next(),
      },
    });

    await expect
      .poll(
        async () =>
          (
            await prisma.taskGoalOutbox.findFirstOrThrow({
              where: { taskInstanceId: taskInstance.id },
              select: { status: true },
            })
          ).status,
        { timeout: 10_000 },
      )
      .toBe('DELIVERED');

    await expect(prisma.goalRecord.count({ where: { keyResultId } })).resolves.toBe(1);
    await expect(
      prisma.keyResult.findUniqueOrThrow({ where: { id: keyResultId } }),
    ).resolves.toMatchObject({ currentValue: 2 });

    restartedHost.destroy?.();

    const secondRestart = createTaskApiModule({
      goalProgressHandler: createGoalTaskProgressPrismaHandler(prisma),
    });
    secondRestart.register({
      app,
      router: express.Router(),
      db: prisma,
      middleware: {
        auth: (_request, _response, next) => next(),
        requireRole: () => (_request, _response, next) => next(),
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(prisma.goalRecord.count({ where: { keyResultId } })).resolves.toBe(1);
    secondRestart.destroy?.();
  });
});
