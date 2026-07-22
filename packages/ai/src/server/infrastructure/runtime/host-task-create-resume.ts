/**
 * Residual 437/439/453: Host task.create process-local resume.
 *
 * Residual 437: cancel / confirm settlement updates process store terminal status.
 * Residual 439: edit revise keeps waiting_approval with patched pendingActions;
 * cancel/confirm are idempotent when already terminal.
 *
 * Residual 453: confirm requires client-owned executedActions settlement
 * (create_task_template + executed). Host must not invent default execution receipts.
 *
 * Client owns domain createTemplate mutation; confirm resume only records settlement.
 * Not a Python LangGraph checkpointer / cross-process durable DB.
 */

import {
  AgentRunResultSchema,
  type AgentExecutedAction,
  type AgentResumePayload,
  type AgentRunResult,
} from '@dailyuse/contracts/ai';

/** Residual 453: confirm without client settlement receipts is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE =
  'Host task.create confirm requires non-empty client executedActions settlement (create_task_template).';

function nextSequence(events: AgentRunResult['events']): number {
  if (events.length === 0) return 0;
  return Math.max(...events.map((event) => event.sequence)) + 1;
}

function cloneActions(
  actions: AgentRunResult['state']['pendingActions'],
): AgentRunResult['state']['pendingActions'] {
  return actions.map((action) => ({
    ...action,
    payload: { ...(action.payload ?? {}) },
    dependsOn: [...(action.dependsOn ?? [])],
  }));
}

function resolveApprovedActions(
  current: AgentRunResult,
  payload: AgentResumePayload,
): AgentRunResult['state']['approvedActions'] {
  if (payload.approvedActions && payload.approvedActions.length > 0) {
    return cloneActions(payload.approvedActions);
  }
  const pending = current.state.pendingActions;
  if (pending.length > 0) {
    return cloneActions(pending);
  }
  return cloneActions(current.state.approvedActions);
}

function rebuildTaskCreateInterrupts(
  run: AgentRunResult['run'],
  pendingActions: AgentRunResult['state']['pendingActions'],
): AgentRunResult['interrupts'] {
  if (pendingActions.length === 0) return [];
  return [
    {
      runId: run.runId,
      threadId: run.threadId,
      agentType: 'task.create',
      pendingActions: cloneActions(pendingActions),
    },
  ];
}

/**
 * Apply cancel/confirm/edit to a stored task.create run.
 * Does not execute domain mutations — only advances process-local AgentRun snapshot.
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
  const status = current.run.status;

  // Residual 439: idempotent terminal resume (no double-event, no status flip).
  if (decision === 'cancel' && status === 'cancelled') {
    return current;
  }
  if (decision === 'confirm' && status === 'completed') {
    return current;
  }
  if (decision === 'edit' && (status === 'cancelled' || status === 'completed' || status === 'failed')) {
    throw new Error(
      `Host task.create edit requires an active approval run; current status is '${status}'.`,
    );
  }

  if (decision === 'cancel') {
    if (status !== 'waiting_approval' && status !== 'waiting_execution' && status !== 'running' && status !== 'pending') {
      throw new Error(
        `Host task.create cancel requires a non-terminal active run; current status is '${status}'.`,
      );
    }
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
    if (status !== 'waiting_approval' && status !== 'waiting_execution') {
      throw new Error(
        `Host task.create confirm requires waiting_approval/waiting_execution; current status is '${status}'.`,
      );
    }
    // Residual 453: client owns createTemplate mutation — Host records settlement only.
    if (!input.payload.executedActions || input.payload.executedActions.length === 0) {
      throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE);
    }
    const executedActions: AgentExecutedAction[] = input.payload.executedActions.map((item) => ({
      ...item,
    }));
    for (const action of executedActions) {
      if (action.tool !== 'create_task_template') {
        throw new Error(
          'Host task.create confirm executedActions must use tool create_task_template.',
        );
      }
      if (action.status !== 'executed') {
        throw new Error(
          'Host task.create confirm executedActions must report status executed.',
        );
      }
    }
    const approvedActions = resolveApprovedActions(current, input.payload);

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

  // Residual 439: Host revise → keep waiting_approval with patched pending create_task_template.
  if (decision === 'edit') {
    if (status !== 'waiting_approval') {
      throw new Error(
        `Host task.create edit requires waiting_approval; current status is '${status}'.`,
      );
    }
    if (!input.payload.approvedActions || input.payload.approvedActions.length === 0) {
      throw new Error('Host task.create edit requires non-empty approvedActions as revised pending actions.');
    }
    const pendingActions = cloneActions(input.payload.approvedActions);
    const title =
      typeof pendingActions[0]?.payload?.['title'] === 'string'
        ? String(pendingActions[0].payload['title'])
        : typeof pendingActions[0]?.payload?.['name'] === 'string'
          ? String(pendingActions[0].payload['name'])
          : undefined;
    const goalId =
      typeof pendingActions[0]?.payload?.['goalId'] === 'string'
        ? String(pendingActions[0].payload['goalId'])
        : undefined;

    return AgentRunResultSchema.parse({
      run: {
        ...current.run,
        status: 'waiting_approval',
        updatedAt: now,
      },
      state: {
        ...current.state,
        stage: 'approval',
        pendingActions,
        approvedActions: [],
        executedActions: current.state.executedActions,
        errors: [...current.state.errors],
      },
      events: [
        ...current.events,
        {
          eventId: `${runId}:approval.required:edit:${sequence}`,
          runId,
          sequence,
          type: 'approval.required',
          createdAt: now,
          data: {
            agentType: 'task.create',
            userDecision: 'edit',
            ...(title ? { title } : {}),
            ...(goalId ? { goalId } : {}),
          },
        },
      ],
      interrupts: rebuildTaskCreateInterrupts(current.run, pendingActions),
    });
  }

  // Fail closed: clarify/regenerate are not part of Host task.create foundation.
  throw new Error(
    `Host task.create resume does not support userDecision '${decision}'. Use cancel, confirm, or edit.`,
  );
}
