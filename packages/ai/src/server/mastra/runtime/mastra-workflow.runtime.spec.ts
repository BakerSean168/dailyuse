import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LibSQLStore } from '@mastra/libsql';
import { GoalPlanDraftContentSchema } from '@memoflow/contracts/ai';
import { ok } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MastraModelResolver } from '../models';
import type { GoalPlanMutationPort } from '../workflows';
import { MastraAIRuntime } from './mastra-ai.runtime';

const resources: Array<{ runtime: MastraAIRuntime; file: string }> = [];

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.runtime.dispose().catch(() => undefined);
    await rm(resource.file, { force: true }).catch(() => undefined);
  }
});

const draft = GoalPlanDraftContentSchema.parse({
  goal: {
    name: 'Ship the Mastra reference workflow',
    description: 'Make durable workflow semantics the production path.',
    importance: 'Important',
    tags: ['ai-vnext'],
    startDate: Date.UTC(2026, 7, 20),
    targetDate: Date.UTC(2026, 8, 20),
  },
  keyResults: [
    {
      title: 'Pass the reference acceptance journey',
      valueType: 'Incremental',
      calculationMethod: 'Sum',
      startValue: 0,
      currentValue: 0,
      targetValue: 1,
      unit: 'journey',
      weight: 5,
    },
  ],
  taskTemplates: [],
  reminders: [],
  rationale: 'The workflow must be restart-safe before later workflow batches build on it.',
  warnings: [],
});

function context(identityId: string, requestId: string): ExecutionContext {
  return {
    identityId,
    requestId,
    traceId: requestId,
    startedAt: Date.now(),
    source: 'http',
  };
}

function mutationPort(): GoalPlanMutationPort & {
  createGoal: ReturnType<typeof vi.fn>;
  createTaskTemplate: ReturnType<typeof vi.fn>;
  createReminder: ReturnType<typeof vi.fn>;
} {
  return {
    createGoal: vi.fn(async (request) =>
      ok({
        goalId: String(request.id),
        keyResultIds: (request.initialKeyResults ?? []).map((item) => String(item.id)),
      }),
    ),
    createTaskTemplate: vi.fn(async (request) => ok({ taskId: String(request.id) })),
    createReminder: vi.fn(async (request) => ok({ reminderId: String(request.id) })),
  };
}

async function createRuntime() {
  const file = join(tmpdir(), `memoflow-mastra-runtime-${randomUUID()}.db`);
  const storage = new LibSQLStore({ id: randomUUID(), url: `file:${file}` });
  const mutations = mutationPort();
  const runtime = new MastraAIRuntime({
    storage,
    modelResolver: new MastraModelResolver({} as never),
    transcriptBootstrapSource: { load: vi.fn(async () => null) },
    goalPlanMutationPort: mutations,
  });
  vi.spyOn(runtime.goalPlanner, 'plan').mockResolvedValue({
    status: 'draft_ready',
    reason: 'The request is concrete enough to review.',
    candidateDraft: draft,
  });
  resources.push({ runtime, file });
  return { runtime, mutations };
}

describe('MastraAIRuntime goal.create product projection', () => {
  it('owns start/get/list/resume and short-circuits a second approve after terminal completion', async () => {
    const { runtime, mutations } = await createRuntime();
    const identityId = 'identity-a';

    const started = await runtime.start({
      context: context(identityId, 'request-start'),
      request: {
        kind: 'goal.create',
        conversationId: 'conversation-a',
        input: { idea: 'Ship the Mastra reference workflow' },
        locale: 'en-US',
      },
    });

    expect(started).toMatchObject({
      kind: 'goal.create',
      conversationId: 'conversation-a',
      status: 'suspended',
      suspension: {
        type: 'goal_draft_review',
        revision: 1,
        draft: { revision: 1, goal: { name: 'Ship the Mastra reference workflow' } },
      },
    });
    expect(await runtime.get({ identityId: 'identity-b', runId: started.runId })).toBeNull();
    expect(await runtime.list({ identityId })).toHaveLength(1);
    expect(await runtime.list({ identityId, conversationId: 'other-conversation' })).toEqual([]);

    const completed = await runtime.resume({
      context: context(identityId, 'request-approve'),
      request: { runId: started.runId, command: { type: 'approve' } },
    });
    expect(completed).toMatchObject({
      runId: started.runId,
      status: 'completed',
      result: {
        workflowRunId: started.runId,
        revision: 1,
        status: 'success',
      },
    });
    expect(mutations.createGoal).toHaveBeenCalledTimes(1);
    expect(mutations.createGoal.mock.calls[0]?.[1]).toMatchObject({
      requestId: 'request-approve',
      identityId,
    });

    const duplicateApprove = await runtime.resume({
      context: context(identityId, 'request-approve-again'),
      request: { runId: started.runId, command: { type: 'approve' } },
    });
    expect(duplicateApprove).toEqual(completed);
    expect(mutations.createGoal).toHaveBeenCalledTimes(1);
  });

  it('hard-cancels an identity-owned suspended workflow without executing domain mutations', async () => {
    const { runtime, mutations } = await createRuntime();
    const identityId = 'identity-cancel';
    const started = await runtime.start({
      context: context(identityId, 'request-start'),
      request: {
        kind: 'goal.create',
        conversationId: 'conversation-cancel',
        input: { idea: 'Create a goal but cancel it before approval' },
      },
    });

    const cancelled = await runtime.cancel({ identityId, runId: started.runId });

    expect(cancelled).toMatchObject({
      runId: started.runId,
      kind: 'goal.create',
      status: 'cancelled',
    });
    expect(mutations.createGoal).not.toHaveBeenCalled();
    expect(await runtime.cancel({ identityId: 'other-identity', runId: started.runId })).toBeNull();
  });

  it('rejects non-goal workflow kinds until their concrete batches land', async () => {
    const { runtime } = await createRuntime();
    await expect(
      runtime.start({
        context: context('identity-a', 'request-task'),
        request: {
          kind: 'task.create',
          conversationId: 'conversation-a',
          input: {},
        },
      }),
    ).rejects.toThrow('AI_WORKFLOW_KIND_UNSUPPORTED:task.create');
  });
});
