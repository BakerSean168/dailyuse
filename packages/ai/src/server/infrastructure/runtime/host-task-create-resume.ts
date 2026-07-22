/**
 * Residual 437: Host task.create process-local resume (cancel / complete settle).
 *
 * TS task.create has no Python LangGraph checkpointer. After residual 435 start
 * registration, resume must update the same process store so getRun/listRuns and
 * selectAgentRun reopen reflect terminal cancelled/completed status.
 * Client owns domain createTemplate mutation; confirm resume only records settlement.
 */

import {
  AgentRunResultSchema,
  type AgentExecutedAction,
  type AgentResumePayload,
  type AgentRunResult,
} from '@dailyuse/contracts/ai';

function nextSequence(events: AgentRunResult['events']): number {
  if (events.length === 0) return 0;
  return Math.max(...events.map((event) => event.sequence)) + 1;
}

function resolveApprovedActions(
  current: AgentRunResult,
  payload: AgentResumePayload,
): AgentRunResult['state']['approvedActions'] {
  if (payload.approvedActions && payload.approvedActions.length > 0) {
    return payload.approvedActions.map((action) => ({
      ...action,
      payload: { ...(action.payload ?? {}) },
    }));
  }
  const pending = current.state.pendingActions;
  if (pending.length > 0) {
    return pending.map((action) => ({
      ...action,
      payload: { ...(action.payload ?? {}) },
    }));
  }
  return current.state.approvedActions.map((action) => ({
    ...action,
    payload: { ...(action.payload ?? {}) },
  }));
}

function defaultExecutedFromApproved(
  approved: AgentRunResult['state']['approvedActions'],
): AgentExecutedAction[] {
  return approved.map((action) => ({
    tool: action.tool,
    status: 'executed' as const,
    message: 'Task template settlement recorded by Host task.create resume.',
    entityId: null,
    data: { ...(action.payload ?? {}) },
  }));
}

/**
 * Apply cancel/confirm (and fail-closed for other decisions) to a stored task.create run.
 * Does not execute domain mutations — only advances process-local AgentRun status.
 */
export function buildHostTaskCreateResumeResult(input: {
  current: AgentRunResult;
  payload: AgentResumePayload;
  nowMs?: number;
}): AgentRunResult {
  const current = input.current;
  if (current.run.agentType !== 'task.create') {
    throw new Error('buildHostTaskCreateResumeResult requires agentType task.create');
  }

  const now = input.nowMs ?? Date.now();
  const decision = input.payload.userDecision;
  const sequence = nextSequence(current.events);
  const runId = current.run.runId;

  if (decision === 'cancel') {
    return AgentRunResultSchema.parse({
      run: {
        ...current.run,
        status: 'cancelled',
        updatedAt: now,
      },
      state: {
        ...current.state,
        stage: 'cancelled',
        pendingActions: [],
        approvedActions: current.state.approvedActions,
        executedActions: current.state.executedActions,
        errors: [...current.state.errors],
      },
      events: [
        ...current.events,
        {
          eventId: `${runId}:run.completed:cancelled:${sequence}`,
          runId,
          sequence,
          type: 'run.completed',
          createdAt: now,
          data: {
            agentType: 'task.create',
            userDecision: 'cancel',
            status: 'cancelled',
          },
        },
      ],
      interrupts: [],
    });
  }

  if (decision === 'confirm') {
    const approvedActions = resolveApprovedActions(current, input.payload);
    const executedActions =
      input.payload.executedActions && input.payload.executedActions.length > 0
        ? input.payload.executedActions.map((item) => ({ ...item }))
        : defaultExecutedFromApproved(approvedActions);

    return AgentRunResultSchema.parse({
      run: {
        ...current.run,
        status: 'completed',
        updatedAt: now,
      },
      state: {
        ...current.state,
        stage: 'completed',
        pendingActions: [],
        approvedActions,
        executedActions,
        errors: [...current.state.errors],
      },
      events: [
        ...current.events,
        {
          eventId: `${runId}:run.completed:confirm:${sequence}`,
          runId,
          sequence,
          type: 'run.completed',
          createdAt: now,
          data: {
            agentType: 'task.create',
            userDecision: 'confirm',
            status: 'completed',
            executedCount: executedActions.length,
          },
        },
      ],
      interrupts: [],
    });
  }

  // Fail closed: clarify/edit/regenerate are not part of Host task.create foundation.
  throw new Error(
    `Host task.create resume does not support userDecision '${decision}'. Use cancel or confirm.`,
  );
}
