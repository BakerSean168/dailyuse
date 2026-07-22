/**
 * Residual 437/439/453/455/463/465/467/469/471/473/475/477: Host task.create process-local resume.
 *
 * Residual 437: cancel / confirm settlement updates process store terminal status.
 * Residual 439: edit revise keeps waiting_approval with patched pendingActions;
 * cancel/confirm are idempotent when already terminal.
 *
 * Residual 453: confirm requires client-owned executedActions settlement
 * (create_task_template + executed). Host must not invent default execution receipts.
 *
 * Residual 455: edit revise requires create_task_template + non-empty trimmed title
 * (fail-closed blank revise; same title invariant as start).
 *
 * Residual 463: confirm settlement must carry a recoverable non-empty title
 * (executed data / approved pending) for history reopen + receipt rehydrate.
 *
 * Residual 465: confirm settlement must carry a recoverable non-empty template
 * entity id (entityId / data.templateId|entityId|taskId) for receipt deep-link.
 *
 * Residual 467: confirm settlement goalId must not rebind against the approved
 * create_task_template draft (normalize approved goalId into settlement).
 *
 * Residual 469: confirm settlement title must not rebind against the approved
 * create_task_template draft (approved title is source of truth when present).
 *
 * Residual 471: confirm draft source-of-truth is process-local pending/approved only
 * (ignore client payload.approvedActions; edit is the only revise path). Confirm also
 * requires exactly one create_task_template executedAction.
 *
 * Residual 473: edit revise requires exactly one create_task_template approvedAction
 * (symmetric single-draft product model with start/confirm).
 *
 * Residual 475: confirm only from waiting_approval (product path never uses
 * waiting_execution for Host task.create settlement).
 *
 * Residual 477: cancel only from waiting_approval (symmetric product status with
 * confirm/edit; no waiting_execution/running/pending cancel side-door).
 *
 * Residual 481: edit only from waiting_approval via named constant (symmetric with
 * confirm/cancel product status; no ad-hoc status string invent).
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

/** Residual 455: edit revise without a non-empty title is fail-closed. */
export const HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE =
  'Host task.create edit requires a non-empty revised title on create_task_template.';

/** Residual 473: edit multi-action revise is fail-closed. */
export const HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE =
  'Host task.create edit requires exactly one create_task_template approvedAction.';

/** Residual 475: confirm outside waiting_approval is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE =
  'Host task.create confirm requires waiting_approval.';

/** Residual 477: cancel outside waiting_approval is fail-closed. */
export const HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE =
  'Host task.create cancel requires waiting_approval.';

/** Residual 481: edit outside waiting_approval is fail-closed (symmetric with confirm/cancel). */
export const HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE =
  'Host task.create edit requires waiting_approval.';

/** Residual 463: confirm without recoverable settlement title is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE =
  'Host task.create confirm requires a non-empty settlement title on create_task_template executedActions.';

/** Residual 465: confirm without recoverable settlement template entity id is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE =
  'Host task.create confirm requires a non-empty settlement template entity id on create_task_template executedActions.';

/** Residual 467: confirm must not rebind settlement goalId against approved draft. */
export const HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE =
  'Host task.create confirm must not rebind settlement goalId against the approved create_task_template draft.';

/** Residual 469: confirm must not rebind settlement title against approved draft. */
export const HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE =
  'Host task.create confirm must not rebind settlement title against the approved create_task_template draft.';

/** Residual 471: confirm without process-local store draft is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE =
  'Host task.create confirm requires a process-local pending/approved create_task_template draft.';

/** Residual 471: confirm multi-settlement executedActions is fail-closed. */
export const HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE =
  'Host task.create confirm requires exactly one create_task_template executedAction.';

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


function asNonEmptyTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Residual 463/469: resolve settlement title without rebinding approved draft title.
 * Approved draft title is source of truth when present; executed may omit and inherit.
 * Mismatch between approved and executed non-empty titles is fail-closed (residual 469).
 */
function resolveConfirmSettlementTitle(
  executed: AgentExecutedAction,
  approved: AgentRunResult['state']['approvedActions'],
): string | undefined {
  const pending = approved[0]?.payload ?? {};
  const approvedTitle =
    asNonEmptyTrimmedString(pending['title']) ??
    asNonEmptyTrimmedString(pending['name']);
  const data = executed.data;
  let executedTitle: string | undefined;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    executedTitle =
      asNonEmptyTrimmedString((data as Record<string, unknown>)['title']) ??
      asNonEmptyTrimmedString((data as Record<string, unknown>)['name']);
  }
  if (approvedTitle && executedTitle && approvedTitle !== executedTitle) {
    throw new Error(HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE);
  }
  return approvedTitle ?? executedTitle;
}

/**
 * Residual 465: resolve settlement template entity id from executed action fields/data.
 * Product confirm records the domain createTemplate id for receipt deep-link / reopen.
 */
function resolveConfirmSettlementTemplateId(executed: AgentExecutedAction): string | undefined {
  const fromEntity = asNonEmptyTrimmedString(executed.entityId);
  if (fromEntity) return fromEntity;
  const data = executed.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    return (
      asNonEmptyTrimmedString(record['templateId']) ??
      asNonEmptyTrimmedString(record['entityId']) ??
      asNonEmptyTrimmedString(record['taskId'])
    );
  }
  return undefined;
}

function readGoalIdFromRecord(record: Record<string, unknown> | undefined): string | undefined {
  if (!record) return undefined;
  return (
    asNonEmptyTrimmedString(record['goalId']) ??
    asNonEmptyTrimmedString(record['goal_id'])
  );
}

/**
 * Residual 467: resolve settlement goalId without rebinding approved draft linkage.
 * Approved draft goalId is source of truth when present; executed may omit and inherit.
 * Mismatch between approved and executed non-empty goalIds is fail-closed.
 */
function resolveConfirmSettlementGoalId(
  executed: AgentExecutedAction,
  approved: AgentRunResult['state']['approvedActions'],
): string | undefined {
  const approvedGoalId = readGoalIdFromRecord(approved[0]?.payload ?? undefined);
  const data =
    executed.data && typeof executed.data === 'object' && !Array.isArray(executed.data)
      ? (executed.data as Record<string, unknown>)
      : undefined;
  const executedGoalId = readGoalIdFromRecord(data);
  if (approvedGoalId && executedGoalId && approvedGoalId !== executedGoalId) {
    throw new Error(HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE);
  }
  return approvedGoalId ?? executedGoalId;
}

/**
 * Residual 471: confirm draft is process-local only.
 * Client payload.approvedActions must not revise draft on confirm (edit owns revise).
 */
function resolveConfirmStoreDraftActions(
  current: AgentRunResult,
): AgentRunResult['state']['approvedActions'] {
  if (current.state.pendingActions.length > 0) {
    return cloneActions(current.state.pendingActions);
  }
  if (current.state.approvedActions.length > 0) {
    return cloneActions(current.state.approvedActions);
  }
  throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE);
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
  // Residual 481: edit has no terminal idempotent resume — fail-closed via waiting_approval
  // gate in the edit branch (completed/cancelled/failed/waiting_execution all rejected).

  if (decision === 'cancel') {
    // Residual 477: product cancel only from waiting_approval (start/edit product status).
    if (status !== 'waiting_approval') {
      throw new Error(
        `${HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE} Current status is '${status}'.`,
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
    // Residual 475: product settlement only from waiting_approval (start/edit product status).
    if (status !== 'waiting_approval') {
      throw new Error(
        `${HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE} Current status is '${status}'.`,
      );
    }
    // Residual 453: client owns createTemplate mutation — Host records settlement only.
    if (!input.payload.executedActions || input.payload.executedActions.length === 0) {
      throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE);
    }
    // Residual 471: product settlement is a single create_task_template receipt.
    if (input.payload.executedActions.length !== 1) {
      throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE);
    }
    const executedActions: AgentExecutedAction[] = input.payload.executedActions.map((item) => ({
      ...item,
      ...(item.data && typeof item.data === 'object' && !Array.isArray(item.data)
        ? { data: { ...(item.data as Record<string, unknown>) } }
        : {}),
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
    // Residual 471: process-local draft only — ignore payload.approvedActions on confirm.
    const approvedActions = resolveConfirmStoreDraftActions(current);
    // Residual 463/465/467/469/471: normalize recoverable settlement title + template entity id
    // + non-rebinding goalId/title against process-local draft into executed data/entityId.
    let settlementTitle: string | undefined;
    let settlementTemplateId: string | undefined;
    let settlementGoalId: string | undefined;
    for (let index = 0; index < executedActions.length; index += 1) {
      const action = executedActions[index]!;
      const title = resolveConfirmSettlementTitle(action, approvedActions);
      if (!title) {
        throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE);
      }
      const templateId = resolveConfirmSettlementTemplateId(action);
      if (!templateId) {
        throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE);
      }
      const goalId = resolveConfirmSettlementGoalId(action, approvedActions);
      settlementTitle = settlementTitle ?? title;
      settlementTemplateId = settlementTemplateId ?? templateId;
      settlementGoalId = settlementGoalId ?? goalId;
      const data: Record<string, unknown> = {
        ...(action.data && typeof action.data === 'object' && !Array.isArray(action.data)
          ? (action.data as Record<string, unknown>)
          : {}),
        title,
        templateId,
        entityId: templateId,
      };
      if (goalId) {
        data['goalId'] = goalId;
        delete data['goal_id'];
      } else {
        delete data['goalId'];
        delete data['goal_id'];
      }
      executedActions[index] = {
        ...action,
        entityId: templateId,
        data,
      };
    }

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
            ...(settlementTitle ? { title: settlementTitle } : {}),
            ...(settlementTemplateId ? { templateId: settlementTemplateId } : {}),
            ...(settlementGoalId ? { goalId: settlementGoalId } : {}),
          },
        },
      ],
      interrupts: [],
    });
  }

  // Residual 439/455/473/481: Host revise → keep waiting_approval with single patched pending action.
  if (decision === 'edit') {
    // Residual 481: product revise only from waiting_approval (start/confirm/cancel symmetry).
    if (status !== 'waiting_approval') {
      throw new Error(HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE);
    }
    if (!input.payload.approvedActions || input.payload.approvedActions.length === 0) {
      throw new Error('Host task.create edit requires non-empty approvedActions as revised pending actions.');
    }
    // Residual 473: product draft is a single create_task_template action (start/confirm symmetry).
    if (input.payload.approvedActions.length !== 1) {
      throw new Error(HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE);
    }
    const pendingActions = cloneActions(input.payload.approvedActions);
    for (const action of pendingActions) {
      if (action.tool !== 'create_task_template') {
        throw new Error(
          'Host task.create edit approvedActions must use tool create_task_template.',
        );
      }
    }
    const rawTitle =
      typeof pendingActions[0]?.payload?.['title'] === 'string'
        ? String(pendingActions[0].payload['title'])
        : typeof pendingActions[0]?.payload?.['name'] === 'string'
          ? String(pendingActions[0].payload['name'])
          : undefined;
    const title = rawTitle?.trim() ? rawTitle.trim() : undefined;
    // Residual 455: blank revise is fail-closed (same title invariant as start).
    if (!title) {
      throw new Error(HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE);
    }
    // Normalize trimmed title into pending payload so getRun/list rehydrate clean values.
    const firstPayload = {
      ...(pendingActions[0]?.payload ?? {}),
      title,
    };
    const rawGoalId = firstPayload['goalId'] ?? firstPayload['goal_id'];
    let goalId: string | undefined;
    if (typeof rawGoalId === 'string' && rawGoalId.trim()) {
      goalId = rawGoalId.trim();
      firstPayload['goalId'] = goalId;
    } else if (rawGoalId === null || rawGoalId === '') {
      delete firstPayload['goalId'];
      delete firstPayload['goal_id'];
      goalId = undefined;
    } else if (typeof rawGoalId === 'string') {
      delete firstPayload['goalId'];
      delete firstPayload['goal_id'];
      goalId = undefined;
    }
    // Residual 473: keep exactly one normalized pending create_task_template action.
    pendingActions[0] = {
      ...pendingActions[0]!,
      tool: 'create_task_template',
      index: 0,
      payload: firstPayload,
    };

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
