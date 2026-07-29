/**
 * Residual 431/461/479/483/485/493/497/499: Host task.create start foundation (TS runtime).
 *
 * Builds a waiting_approval AgentRunResult with one create_task_template action.
 * Host lifecycle + client createTemplate settlement (residual 423–425) own mutation.
 * Residual 461: product path requires non-empty conversationId (session-bound).
 * Residual 479: start builder requires non-empty title (no 'New task' default).
 * Residual 483: start builder requires non-empty conversationId (no silent null invent).
 * Residual 485: start builder requires non-empty trimmed threadId (process-local binding).
 * Residual 493: start builder requires non-empty trimmed identityId (ExecutionContext only;
 * never trust client body identity; no silent empty invent).
 * Residual 497: start builder requires non-empty trimmed runId (process-local map key;
 * no silent empty invent).
 * Residual 499: start builder requires request.agentType task.create (no silent retype;
 * symmetric with residual 495 resume/store agent isolation).
 * Not a full LangGraph Task Agent workflow.
 */

import {
  AgentRunResultSchema,
  type AgentRunResult,
  type AgentStartRunRequest,
} from '@memoflow/contracts/ai';

// Residual 1121: asNonEmptyString sole (shared/as-non-empty-string).
import { asNonEmptyString } from '../../../shared/as-non-empty-string';

/** Residual 461: fail-closed when task.create start lacks a session conversationId. */
export const HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE =
  'Host task.create start requires a non-empty conversationId for session binding.';

/** Residual 479: fail-closed when task.create start lacks a recoverable title. */
export const HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE =
  'Host task.create start requires a non-empty title, idea, message, or conversationTitle.';

/** Residual 485: fail-closed when task.create start lacks a recoverable threadId. */
export const HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE =
  'Host task.create start requires a non-empty threadId for process-local binding.';

/** Residual 493: fail-closed when task.create start lacks ExecutionContext identityId. */
export const HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE =
  'Host task.create start requires a non-empty identityId from ExecutionContext.';

/** Residual 497: fail-closed when task.create start lacks a recoverable runId. */
export const HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE =
  'Host task.create start requires a non-empty runId for process-local binding.';

/** Residual 499: start with non-task.create agentType is fail-closed. */
export const HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE =
  'Host task.create start requires agentType task.create.';

/**
 * Residual 461: resolve non-empty conversationId for product task.create start.
 */
export function resolveTaskCreateConversationId(
  conversationId: string | null | undefined,
): string | undefined {
  return asNonEmptyString(conversationId ?? undefined);
}

/**
 * Residual 485: resolve non-empty threadId for product task.create start.
 */
export function resolveTaskCreateThreadId(
  threadId: string | null | undefined,
): string | undefined {
  return asNonEmptyString(threadId ?? undefined);
}

/**
 * Residual 493: resolve non-empty identityId for product task.create start.
 * identityId must come from server ExecutionContext — never from client body.
 */
export function resolveTaskCreateIdentityId(
  identityId: string | null | undefined,
): string | undefined {
  return asNonEmptyString(identityId ?? undefined);
}

/**
 * Residual 497: resolve non-empty runId for product task.create start.
 */
export function resolveTaskCreateRunId(
  runId: string | null | undefined,
): string | undefined {
  return asNonEmptyString(runId ?? undefined);
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
 * Residual 479: empty title fails closed (no silent 'New task' invent).
 * Residual 483: empty conversationId fails closed (no silent null invent).
 * Residual 485: empty/blank threadId fails closed (no untrimmed pass-through).
 * Residual 493: empty/blank identityId fails closed (no silent empty invent).
 * Residual 497: empty/blank runId fails closed (no silent empty invent).
 * Residual 499: non-task.create request.agentType fails closed (no silent retype).
 */
export function buildHostTaskCreateStartResult(input: {
  request: AgentStartRunRequest;
  identityId: string;
  nowMs?: number;
}): AgentRunResult {
  const now = input.nowMs ?? Date.now();
  // Residual 499: agent isolation fail-closed in builder (runtime also gates).
  if (input.request.agentType !== 'task.create') {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE);
  }
  // Residual 493: ExecutionContext identity binding fail-closed in builder.
  const identityId = resolveTaskCreateIdentityId(input.identityId);
  if (!identityId) {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE);
  }
  // Residual 497: process-local runId map key fail-closed in builder.
  const runId = resolveTaskCreateRunId(input.request.runId);
  if (!runId) {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE);
  }
  const title = resolveTaskCreateTitle(input.request.input);
  if (!title) {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE);
  }
  // Residual 483: session binding fail-closed in builder (runtime also checks).
  const conversationId = resolveTaskCreateConversationId(input.request.conversationId);
  if (!conversationId) {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE);
  }
  // Residual 485: thread binding fail-closed in builder (whitespace is empty).
  const threadId = resolveTaskCreateThreadId(input.request.threadId);
  if (!threadId) {
    throw new Error(HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE);
  }
  const goalId = resolveTaskCreateGoalId(input.request.input);
  const payload: Record<string, unknown> = { title };
  if (goalId) payload['goalId'] = goalId;

  return AgentRunResultSchema.parse({
    run: {
      runId,
      threadId,
      conversationId,
      identityId,
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
        threadId,
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
