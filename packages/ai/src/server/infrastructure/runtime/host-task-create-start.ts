/**
 * Residual 431/461: Host task.create start foundation (TS runtime).
 *
 * Builds a waiting_approval AgentRunResult with one create_task_template action.
 * Host lifecycle + client createTemplate settlement (residual 423–425) own mutation.
 * Residual 461: product path requires non-empty conversationId (session-bound).
 * Not a full LangGraph Task Agent workflow.
 */

import {
  AgentRunResultSchema,
  type AgentRunResult,
  type AgentStartRunRequest,
} from '@dailyuse/contracts/ai';

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Residual 461: fail-closed when task.create start lacks a session conversationId. */
export const HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE =
  'Host task.create start requires a non-empty conversationId for session binding.';

/**
 * Residual 461: resolve non-empty conversationId for product task.create start.
 */
export function resolveTaskCreateConversationId(
  conversationId: string | null | undefined,
): string | undefined {
  return asNonEmptyString(conversationId ?? undefined);
}

/**
 * Derive task title from start input (title / idea / message / conversationTitle).
 */
export function resolveTaskCreateTitle(input: Record<string, unknown>): string | undefined {
  return (
    asNonEmptyString(input['title']) ??
    asNonEmptyString(input['idea']) ??
    asNonEmptyString(input['message']) ??
    asNonEmptyString(input['conversationTitle'])
  );
}

export function resolveTaskCreateGoalId(input: Record<string, unknown>): string | null {
  const goalId = input['goalId'] ?? input['goal_id'];
  if (goalId === null) return null;
  return asNonEmptyString(goalId) ?? null;
}

/**
 * Build a Host-ready task.create start result (waiting_approval).
 * identityId must come from server ExecutionContext — never trust client body identity.
 */
export function buildHostTaskCreateStartResult(input: {
  request: AgentStartRunRequest;
  identityId: string;
  nowMs?: number;
}): AgentRunResult {
  const now = input.nowMs ?? Date.now();
  const title = resolveTaskCreateTitle(input.request.input) ?? 'New task';
  const goalId = resolveTaskCreateGoalId(input.request.input);
  const runId = input.request.runId;
  const payload: Record<string, unknown> = { title };
  if (goalId) payload['goalId'] = goalId;

  const conversationId =
    resolveTaskCreateConversationId(input.request.conversationId) ?? null;

  return AgentRunResultSchema.parse({
    run: {
      runId,
      threadId: input.request.threadId,
      conversationId,
      identityId: input.identityId,
      agentType: 'task.create',
      status: 'waiting_approval',
      createdAt: now,
      updatedAt: now,
    },
    state: {
      messages: [
        {
          role: 'user',
          content: title,
          createdAt: now,
        },
      ],
      intent: 'task-create',
      stage: 'approval',
      artifacts: [],
      citations: [],
      retrievedContext: [],
      pendingActions: [
        {
          tool: 'create_task_template',
          index: 0,
          dependsOn: [],
          rationale: 'Create a task template after Host approval.',
          payload,
        },
      ],
      approvedActions: [],
      executedActions: [],
      usage: {},
      errors: [],
    },
    events: [
      {
        eventId: `${runId}:approval.required`,
        runId,
        sequence: 0,
        type: 'approval.required',
        createdAt: now,
        data: {
          agentType: 'task.create',
          title,
          ...(goalId ? { goalId } : {}),
        },
      },
    ],
    interrupts: [
      {
        runId,
        threadId: input.request.threadId,
        agentType: 'task.create',
        pendingActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'Create a task template after Host approval.',
            payload,
          },
        ],
      },
    ],
  });
}
