/**
 * Host proposal lifecycle helpers (residual 355–401/409/411/419/423/425/427/441/443/445).
 *
 * Routes approve/reject/revise through AssistantFacade before legacy AgentRun
 * executors. Derives thin workbench panel items from waiting_approval AgentRun
 * snapshots and post-execution Host receipt rows. Never calls
 * ProposalKernel mutation execution from this module.
 */
import type {
  AgentAction,
  AgentRunHostProposalKind,
  AgentRunResult,
  AssistantEvent,
  AssistantProposalPatch,
} from '@dailyuse/contracts/ai';
import {
  AGENT_RUN_HOST_PROPOSAL_REVISION,
  buildAgentRunHostProposalRef,
} from '@dailyuse/contracts/ai';
import type { AIChatService } from './types';

export type HostProposalLifecycleService = Pick<AIChatService, 'dispatchAssistant'>;

/** Tracks latest Host proposal revision after revise/approve for action-bar parity. */
const hostProposalRevisionById = new Map<string, number>();

export function rememberHostProposalRevision(proposalId: string, revision: number): void {
  if (!proposalId || !Number.isFinite(revision) || revision < 1) return;
  hostProposalRevisionById.set(proposalId, revision);
}

export function getRememberedHostProposalRevision(
  proposalId: string,
  fallback: number = AGENT_RUN_HOST_PROPOSAL_REVISION,
): number {
  return hostProposalRevisionById.get(proposalId) ?? fallback;
}


export type HostProposalPanelSource = 'goal' | 'knowledge' | 'task';

/**
 * Workbench-facing Host proposal row. Lifecycle only — mutation stays in executors.
 */
export type HostProposalPanelItem = {
  runId: string;
  proposalId: string;
  revision: number;
  kind: AgentRunHostProposalKind;
  source: HostProposalPanelSource;
  /** Agent run status that produced this pending Host proposal. */
  runStatus: 'waiting_approval';
  title: string;
  summary: string;
  pendingActionCount: number;
  /** Residual 361: knowledge.write draft path (vault-relative). */
  targetPath?: string;
  /** Residual 361: knowledge.write draft markdown body. */
  contentMarkdown?: string;
  /** Residual 367: goal.create draft description. */
  description?: string;
  /** Residual 419: task.create optional linked goal id. */
  goalId?: string | null;
};

function collectEvents(
  service: HostProposalLifecycleService,
  command: Parameters<HostProposalLifecycleService['dispatchAssistant']>[0],
): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  return service
    .dispatchAssistant(command, {
      onEvent: (event) => {
        events.push(event);
      },
    })
    .then(() => {
      const errorEvent = events.find((event) => event.type === 'error');
      if (errorEvent && errorEvent.type === 'error') {
        throw new Error(errorEvent.message || 'Host proposal lifecycle failed');
      }
      return events;
    });
}

/**
 * Residual 397: normalize freeform Host reject reason for ProposalKernel lifecycle.
 * Empty/whitespace falls back to user_cancel; max 500 chars; strips control chars.
 * Lifecycle-only — never executes business mutations.
 */
export function normalizeHostProposalRejectReason(
  reason?: string | null,
  fallback: string = 'user_cancel',
): string {
  const raw = typeof reason === 'string' ? reason : '';
  const scrubbed = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (!scrubbed) return fallback;
  return scrubbed.length > 500 ? scrubbed.slice(0, 500) : scrubbed;
}

export async function dispatchHostProposalDecision(
  service: HostProposalLifecycleService,
  input: {
    decision: 'approve' | 'reject';
    runId: string;
    kind: AgentRunHostProposalKind;
    reason?: string;
    /** Current Host proposal revision (defaults to bridge create revision). */
    revision?: number;
  },
): Promise<AssistantEvent[]> {
  const { proposalId } = buildAgentRunHostProposalRef(input.runId, input.kind);
  const revision =
    input.revision ??
    getRememberedHostProposalRevision(proposalId, AGENT_RUN_HOST_PROPOSAL_REVISION);

  const events = await collectEvents(
    service,
    input.decision === 'approve'
      ? {
          type: 'approve_proposal',
          runId: input.runId,
          proposalId,
          revision,
        }
      : {
          type: 'reject_proposal',
          runId: input.runId,
          proposalId,
          revision,
          reason: input.reason,
        },
  );

  const expectedType =
    input.decision === 'approve' ? 'proposal.approved' : 'proposal.rejected';
  if (!events.some((event) => event.type === expectedType)) {
    throw new Error(`Host proposal lifecycle missing ${expectedType}`);
  }

  const settled = events.find(
    (event) => event.type === expectedType,
  ) as Extract<AssistantEvent, { type: 'proposal.approved' | 'proposal.rejected' }> | undefined;
  if (settled) {
    rememberHostProposalRevision(settled.proposalId, settled.revision);
  }

  return events;
}

/**
 * Residual 359: revise Host bridge proposal before approve (lifecycle only).
 * Returns the new revision from proposal.revised.
 */
export async function dispatchHostProposalRevise(
  service: HostProposalLifecycleService,
  input: {
    runId: string;
    kind: AgentRunHostProposalKind;
    revision: number;
    patch: AssistantProposalPatch;
  },
): Promise<{ events: AssistantEvent[]; revision: number; proposalId: string }> {
  const { proposalId } = buildAgentRunHostProposalRef(input.runId, input.kind);
  const events = await collectEvents(service, {
    type: 'revise_proposal',
    runId: input.runId,
    proposalId,
    revision: input.revision,
    patch: input.patch,
  });

  const revised = events.find((event) => event.type === 'proposal.revised');
  if (!revised || revised.type !== 'proposal.revised') {
    throw new Error('Host proposal lifecycle missing proposal.revised');
  }

  rememberHostProposalRevision(revised.proposalId, revised.revision);

  return {
    events,
    revision: revised.revision,
    proposalId: revised.proposalId,
  };
}

function pendingActionCount(run: AgentRunResult): number {
  if (run.state.pendingActions.length) return run.state.pendingActions.length;
  return run.state.approvedActions.length;
}

function firstPendingRationale(run: AgentRunResult): string {
  const action = run.state.pendingActions[0] ?? run.state.approvedActions[0];
  if (!action) return '';
  return typeof action.rationale === 'string' ? action.rationale.trim() : '';
}

function knowledgeDraftTitle(run: AgentRunResult): string {
  const draft = run.state.artifacts.find((artifact) => artifact.kind === 'knowledge_note_draft');
  if (!draft) return '';
  if (typeof draft.title === 'string' && draft.title.trim()) return draft.title.trim();
  const dataTitle = draft.data?.['title'];
  return typeof dataTitle === 'string' ? dataTitle.trim() : '';
}

function knowledgeDraftArtifact(run: AgentRunResult) {
  return run.state.artifacts.find((artifact) => artifact.kind === 'knowledge_note_draft') ?? null;
}

function knowledgeDraftTargetPath(run: AgentRunResult): string {
  const draft = knowledgeDraftArtifact(run);
  const fromData = draft?.data?.['targetSubpath'] ?? draft?.data?.['targetPath'];
  if (typeof fromData === 'string' && fromData.trim()) {
    return fromData.trim().split('\\').join('/');
  }
  const action = run.state.pendingActions[0] ?? run.state.approvedActions[0];
  const payload = action?.payload;
  const fromPayload =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)['targetSubpath'] ??
        (payload as Record<string, unknown>)['targetPath']
      : undefined;
  if (typeof fromPayload === 'string' && fromPayload.trim()) {
    return fromPayload.trim().split('\\').join('/');
  }
  return '';
}

function knowledgeDraftMarkdown(run: AgentRunResult): string {
  const draft = knowledgeDraftArtifact(run);
  const fromData = draft?.data?.['markdown'] ?? draft?.data?.['contentMarkdown'];
  if (typeof fromData === 'string' && fromData.trim()) return fromData;
  const action = run.state.pendingActions[0] ?? run.state.approvedActions[0];
  const payload = action?.payload;
  const fromPayload =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)['contentMarkdown'] ??
        (payload as Record<string, unknown>)['markdown']
      : undefined;
  return typeof fromPayload === 'string' ? fromPayload : '';
}

/**
 * Build AssistantProposalPatch from panel draft fields (residual 359/361).
 * Goal uses title/description; knowledge uses targetPath/contentMarkdown.
 */
export function buildHostProposalPatchFromDraft(input: {
  kind: AgentRunHostProposalKind;
  title?: string;
  targetPath?: string;
  contentMarkdown?: string;
  description?: string | null;
  /** Residual 419: task.create optional goal link. */
  goalId?: string | null;
}): AssistantProposalPatch {
  if (input.kind === 'knowledge.write') {
    const patch: AssistantProposalPatch = {};
    if (typeof input.targetPath === 'string' && input.targetPath.trim()) {
      patch.targetPath = input.targetPath.trim().split('\\').join('/');
    }
    if (typeof input.contentMarkdown === 'string' && input.contentMarkdown.trim()) {
      patch.contentMarkdown = input.contentMarkdown;
    }
    return patch;
  }

  if (input.kind === 'goal.create') {
    const patch: AssistantProposalPatch = {};
    if (typeof input.title === 'string' && input.title.trim()) {
      patch.title = input.title.trim();
    }
    if (input.description !== undefined) {
      patch.description = input.description;
    }
    return patch;
  }

  // Residual 419: task.create (and unknown kinds fall through to title-only).
  const patch: AssistantProposalPatch = {};
  if (typeof input.title === 'string' && input.title.trim()) {
    patch.title = input.title.trim();
  }
  if (input.kind === 'task.create' && input.goalId !== undefined) {
    patch.goalId = input.goalId;
  }
  return patch;
}

export function isHostProposalDraftDirty(input: {
  item: HostProposalPanelItem;
  title?: string;
  targetPath?: string;
  contentMarkdown?: string;
  description?: string | null;
  goalId?: string | null;
}): boolean {
  if (input.item.kind === 'knowledge.write') {
    const nextPath = (input.targetPath ?? '').trim().split('\\').join('/');
    const basePath = (input.item.targetPath ?? '').trim().split('\\').join('/');
    const nextBody = input.contentMarkdown ?? '';
    const baseBody = input.item.contentMarkdown ?? '';
    return nextPath !== basePath || nextBody !== baseBody;
  }
  if (input.item.kind === 'goal.create') {
    const titleDirty = (input.title ?? '').trim() !== input.item.title.trim();
    const nextDescription = input.description ?? '';
    const baseDescription = input.item.description ?? '';
    return titleDirty || nextDescription !== baseDescription;
  }
  if (input.item.kind === 'task.create') {
    const titleDirty = (input.title ?? '').trim() !== input.item.title.trim();
    const nextGoalId = (input.goalId ?? '').trim();
    const baseGoalId = (input.item.goalId ?? '').trim();
    return titleDirty || nextGoalId !== baseGoalId;
  }
  return (input.title ?? '').trim() !== input.item.title.trim();
}

function goalDraftTitle(run: AgentRunResult): string {
  const goalArtifact = run.state.artifacts.find(
    (artifact) =>
      artifact.kind === 'goal_draft' ||
      artifact.kind === 'goal' ||
      artifact.kind === 'action_plan',
  );
  if (goalArtifact && typeof goalArtifact.title === 'string' && goalArtifact.title.trim()) {
    return goalArtifact.title.trim();
  }
  const createGoal = (run.state.pendingActions[0] ?? run.state.approvedActions[0])?.payload;
  const title = createGoal && typeof createGoal['title'] === 'string' ? createGoal['title'] : '';
  return title.trim();
}

/** Residual 367: extract goal draft description for Host proposal panel. */
function goalDraftDescription(run: AgentRunResult): string {
  const goalArtifact = run.state.artifacts.find(
    (artifact) => artifact.kind === 'goal_draft' || artifact.kind === 'goal',
  );
  const fromData = goalArtifact?.data?.['description'];
  if (typeof fromData === 'string') return fromData;
  const createGoal = (run.state.pendingActions[0] ?? run.state.approvedActions[0])?.payload;
  const description =
    createGoal && typeof createGoal['description'] === 'string' ? createGoal['description'] : '';
  return description;
}

/**
 * Build Host proposal panel rows from live AgentRun waiting_approval snapshots.
 * waiting_execution / completed runs are intentionally excluded so continue/retry
 * never re-enter Host approve lifecycle.
 */

/**
 * Residual 363: map Host-revised knowledge fields onto AgentRun executor actions.
 * Host lifecycle stays separate; this only prepares AgentRun confirm approvedActions.
 */
export function applyHostKnowledgePatchToAgentActions(
  actions: AgentAction[],
  patch: {
    targetPath?: string;
    contentMarkdown?: string;
  },
): AgentAction[] {
  const targetPath =
    typeof patch.targetPath === 'string' && patch.targetPath.trim()
      ? patch.targetPath.trim().split('\\').join('/')
      : undefined;
  // Fix: in JS file we need /\/g - write carefully below
  const contentMarkdown =
    typeof patch.contentMarkdown === 'string' && patch.contentMarkdown.trim()
      ? patch.contentMarkdown
      : undefined;

  if (!targetPath && contentMarkdown === undefined) {
    return actions.map((action) => ({ ...action, payload: { ...action.payload } }));
  }

  return actions.map((action) => {
    if (action.tool !== 'create_knowledge_note') {
      return {
        ...action,
        payload: { ...(action.payload ?? {}) },
      };
    }
    const payload: Record<string, unknown> = { ...(action.payload ?? {}) };
    if (targetPath) {
      payload.targetSubpath = targetPath;
      payload.targetPath = targetPath;
    }
    if (contentMarkdown !== undefined) {
      payload.contentMarkdown = contentMarkdown;
      payload.markdown = contentMarkdown;
    }
    return {
      ...action,
      payload,
    };
  });
}


/**
 * Residual 365: map Host-revised goal title/description onto AgentRun executor actions.
 * Host lifecycle stays separate; this only prepares AgentRun confirm approvedActions.
 */
export function applyHostGoalPatchToAgentActions(
  actions: AgentAction[],
  patch: {
    title?: string;
    description?: string | null;
  },
): AgentAction[] {
  const title =
    typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim() : undefined;
  const hasDescription = patch.description !== undefined;
  const description = hasDescription ? patch.description : undefined;

  if (!title && !hasDescription) {
    return actions.map((action) => ({ ...action, payload: { ...action.payload } }));
  }

  return actions.map((action) => {
    if (action.tool !== 'create_goal') {
      return {
        ...action,
        payload: { ...(action.payload ?? {}) },
      };
    }
    const payload: Record<string, unknown> = { ...(action.payload ?? {}) };
    if (title) {
      payload.title = title;
    }
    if (hasDescription) {
      payload.description = description;
    }
    return {
      ...action,
      payload,
    };
  });
}

/**
 * Residual 379: Host execution receipt workbench row.
 * Presentation of post-approve executor outcomes only — never Host kernel mutation execution.
 */
/** Residual 385: one executed-action line for Host receipt replay. */
export type HostExecutionActionLine = {
  tool: string;
  status: 'executed' | 'skipped' | 'failed';
  message: string;
  entityId?: string;
};

export type HostExecutionReceiptItem = {
  runId: string;
  proposalId: string;
  revision: number;
  kind: AgentRunHostProposalKind;
  source: HostProposalPanelSource;
  runStatus: 'completed' | 'failed' | 'cancelled';
  ok: boolean;
  title: string;
  summary: string;
  executedCount: number;
  failedCount: number;
  skippedCount: number;
  entityIds: string[];
  /** Residual 385: goal description replay (when present). */
  description?: string;
  /** Residual 385: knowledge target path replay. */
  targetPath?: string;
  /** Residual 385: truncated knowledge body for read-only replay. */
  contentPreview?: string;
  /** Residual 385: ordered executed-action lines for audit replay. */
  actionLines: HostExecutionActionLine[];
  /** Residual 385: primary created entity for deep-link open. */
  primaryEntityId?: string;
  /** Stable UI key; not a Host mutation request id. */
  receiptKey: string;
};

const HOST_RECEIPT_STATUSES = new Set(['completed', 'failed', 'cancelled']);

function truncateHostContentPreview(text: string, max = 240): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function summarizeExecutedActions(run: AgentRunResult): {
  executedCount: number;
  failedCount: number;
  skippedCount: number;
  entityIds: string[];
  actionLines: HostExecutionActionLine[];
  primaryEntityId?: string;
  ok: boolean;
  summary: string;
} {
  const actions = run.state.executedActions ?? [];
  let executedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const entityIds: string[] = [];
  const actionLines: HostExecutionActionLine[] = [];
  let primaryEntityId: string | undefined;
  for (const action of actions) {
    if (action.status === 'executed') executedCount += 1;
    else if (action.status === 'failed') failedCount += 1;
    else if (action.status === 'skipped') skippedCount += 1;
    const entityId =
      typeof action.entityId === 'string' && action.entityId.trim()
        ? action.entityId.trim()
        : undefined;
    if (entityId) {
      entityIds.push(entityId);
      if (
        !primaryEntityId &&
        (action.tool === 'create_goal' || action.tool === 'create_knowledge_note') &&
        action.status === 'executed'
      ) {
        primaryEntityId = entityId;
      }
    }
    actionLines.push({
      tool: action.tool,
      status: action.status,
      message: typeof action.message === 'string' ? action.message : '',
      ...(entityId ? { entityId } : {}),
    });
  }
  if (!primaryEntityId && entityIds[0]) {
    primaryEntityId = entityIds[0];
  }
  const ok = run.run.status === 'completed' && failedCount === 0;
  const parts = [
    `${executedCount} executed`,
    `${skippedCount} skipped`,
    `${failedCount} failed`,
  ];
  const firstError = run.state.errors?.[0];
  const summary = firstError
    ? `${parts.join(', ')}; ${firstError}`
    : parts.join(', ');
  return {
    executedCount,
    failedCount,
    skippedCount,
    entityIds,
    actionLines,
    primaryEntityId,
    ok,
    summary,
  };
}

/**
 * Residual 379: build Host execution receipt rows from completed/failed/cancelled
 * Goal/Knowledge AgentRun snapshots after Host approve + domain executor.
 * waiting_approval / waiting_execution never produce receipts (still pending).
 * Does not call Host kernel mutation execution or any mutation port.
 */

/**
 * Residual 419: task.create draft title from artifact / pending action payload.
 */
function taskDraftTitle(run: AgentRunResult): string {
  const draft = run.state.artifacts.find(
    (artifact) =>
      artifact.kind === 'task_draft' ||
      artifact.kind === 'task' ||
      artifact.kind === 'task_template_draft',
  );
  if (draft && typeof draft.title === 'string' && draft.title.trim()) {
    return draft.title.trim();
  }
  const dataTitle = draft?.data?.['title'];
  if (typeof dataTitle === 'string' && dataTitle.trim()) return dataTitle.trim();
  const action = run.state.pendingActions[0] ?? run.state.approvedActions[0];
  const payload = action?.payload;
  const fromPayload =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)['title'] ??
        (payload as Record<string, unknown>)['name']
      : undefined;
  if (typeof fromPayload === 'string' && fromPayload.trim()) return fromPayload.trim();

  // Residual 441: process-local terminal task.create (pending cleared) — recover title
  // from executedActions.data / approval events / user message content.
  for (const executed of run.state.executedActions ?? []) {
    const data = executed.data;
    if (data && typeof data === 'object') {
      const title =
        (data as Record<string, unknown>)['title'] ??
        (data as Record<string, unknown>)['name'];
      if (typeof title === 'string' && title.trim()) return title.trim();
    }
  }
  for (const event of [...(run.events ?? [])].reverse()) {
    const data = event.data;
    if (data && typeof data === 'object') {
      const title = (data as Record<string, unknown>)['title'];
      if (typeof title === 'string' && title.trim()) return title.trim();
    }
  }
  for (const message of run.state.messages ?? []) {
    if (message.role === 'user' && typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim();
    }
  }
  return '';
}

function taskDraftGoalId(run: AgentRunResult): string | null {
  const draft = run.state.artifacts.find(
    (artifact) =>
      artifact.kind === 'task_draft' ||
      artifact.kind === 'task' ||
      artifact.kind === 'task_template_draft',
  );
  const fromData = draft?.data?.['goalId'];
  if (typeof fromData === 'string' && fromData.trim()) return fromData.trim();
  if (fromData === null) return null;
  const action = run.state.pendingActions[0] ?? run.state.approvedActions[0];
  const payload = action?.payload;
  const fromPayload =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)['goalId']
      : undefined;
  if (typeof fromPayload === 'string' && fromPayload.trim()) return fromPayload.trim();
  if (fromPayload === null) return null;
  return null;
}

/**
 * Residual 419/423: AgentRun looks task-shaped when it carries task draft artifacts.
 */
export function isTaskShapedHostAgentRun(
  result: AgentRunResult | null | undefined,
): boolean {
  if (!result?.state?.artifacts?.length) return false;
  return result.state.artifacts.some(
    (artifact) =>
      artifact.kind === 'task_draft' ||
      artifact.kind === 'task' ||
      artifact.kind === 'task_template_draft',
  );
}

/**
 * Residual 423: exclusive Host task lane — task-shaped and not goal/knowledge primary.
 * Avoids stealing normal goal.create runs that also plan create_task_template actions
 * while still promoting residual 419 task_draft-only fixtures.
 */
export function isPrimaryTaskHostAgentRun(
  result: AgentRunResult | null | undefined,
): boolean {
  if (!result?.run) return false;
  // Residual 427: first-class AgentType task.create always owns the Host task lane.
  if (result.run.agentType === 'task.create') return true;
  if (!isTaskShapedHostAgentRun(result)) return false;
  const hasGoalDraft = result.state.artifacts.some((artifact) => artifact.kind === 'goal_draft');
  const hasNoteDraft = result.state.artifacts.some(
    (artifact) =>
      artifact.kind === 'note_draft' ||
      artifact.kind === 'knowledge_note_draft' ||
      artifact.kind === 'knowledge_draft',
  );
  return !hasGoalDraft && !hasNoteDraft;
}

/**
 * Residual 423: derive exclusive Host workbench AgentRun inputs for live AIChatView.
 * Primary task-shaped goal session runs promote into taskAgentRun and leave goal null.
 */
export function resolveLiveHostWorkbenchAgentRuns(input: {
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
  /** Optional dedicated task session field (future AgentType). */
  taskAgentRun?: AgentRunResult | null;
}): {
  goalAgentRun: AgentRunResult | null;
  noteAgentRun: AgentRunResult | null;
  taskAgentRun: AgentRunResult | null;
} {
  const explicitTask =
    input.taskAgentRun && isPrimaryTaskHostAgentRun(input.taskAgentRun)
      ? input.taskAgentRun
      : null;
  const goal = input.goalAgentRun ?? null;
  const note = input.noteAgentRun ?? null;

  if (explicitTask) {
    return {
      goalAgentRun: goal && !isPrimaryTaskHostAgentRun(goal) ? goal : null,
      noteAgentRun: note && !isPrimaryTaskHostAgentRun(note) ? note : null,
      taskAgentRun: explicitTask,
    };
  }

  if (goal && isPrimaryTaskHostAgentRun(goal)) {
    return {
      goalAgentRun: null,
      noteAgentRun: note && !isPrimaryTaskHostAgentRun(note) ? note : null,
      taskAgentRun: goal,
    };
  }

  if (note && isPrimaryTaskHostAgentRun(note)) {
    return {
      goalAgentRun: goal,
      noteAgentRun: null,
      taskAgentRun: note,
    };
  }

  return {
    goalAgentRun: goal,
    noteAgentRun: note,
    taskAgentRun: null,
  };
}

/**
 * Residual 423: map Host-revised task title/goalId onto create_task_template executor actions.
 * Host lifecycle stays separate; this only prepares AgentRun confirm approvedActions.
 */
export function applyHostTaskPatchToAgentActions(
  actions: AgentAction[],
  patch: {
    title?: string;
    goalId?: string | null;
  },
): AgentAction[] {
  const title =
    typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim() : undefined;
  const hasGoalId = patch.goalId !== undefined;
  const goalId =
    hasGoalId && typeof patch.goalId === 'string' && patch.goalId.trim()
      ? patch.goalId.trim()
      : hasGoalId
        ? patch.goalId
        : undefined;

  if (!title && !hasGoalId) {
    return actions.map((action) => ({ ...action, payload: { ...(action.payload ?? {}) } }));
  }

  return actions.map((action) => {
    if (action.tool !== 'create_task_template') {
      return {
        ...action,
        payload: { ...(action.payload ?? {}) },
      };
    }
    const payload: Record<string, unknown> = { ...(action.payload ?? {}) };
    if (title) {
      payload.title = title;
      payload.name = title;
    }
    if (hasGoalId) {
      payload.goalId = goalId;
    }
    return {
      ...action,
      payload,
    };
  });
}

/**
 * Residual 423: pure fallback CreateTaskTemplate transport body for Host task approve
 * when no AgentRun confirm path owns the run. Prefer goal-session confirm for goal.create
 * primary-task sessions; this is the domain createTemplate fallback only.
 * Does not call any mutation port by itself.
 */
export function buildHostTaskCreateTemplateRequest(input: {
  title: string;
  goalId?: string | null;
  description?: string | null;
}): {
  name: string;
  description: string | null;
  taskType: 'OneTime';
  timeConfig: {
    timeType: 'AllDay';
    startDate: null;
    timePoint: null;
    timeRange: null;
  };
  importance: 'Moderate';
  tags: string[];
  goalBinding: null;
  parentTaskId: null;
  folderId: null;
  color: null;
  recurrenceRule: null;
  reminderConfig: null;
} | null {
  const name = input.title.trim();
  if (!name) return null;
  const goalId = typeof input.goalId === 'string' ? input.goalId.trim() : '';
  const descriptionRaw =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : goalId
        ? `Linked goal ${goalId}`
        : null;
  return {
    name,
    description: descriptionRaw,
    taskType: 'OneTime',
    timeConfig: {
      timeType: 'AllDay',
      startDate: null,
      timePoint: null,
      timeRange: null,
    },
    importance: 'Moderate',
    tags: goalId ? [`goal:${goalId}`] : [],
    goalBinding: null,
    parentTaskId: null,
    folderId: null,
    color: null,
    recurrenceRule: null,
    reminderConfig: null,
  };
}


/**
 * Residual 459: dirty Host approve for task.create must revise process-local draft
 * before domain createTemplate so session restore cannot rehydrate a stale title.
 * Presentation/decision helper only — never executes createTemplate or Host kernel.
 */
export function shouldReviseProcessLocalTaskDraftBeforeDomainSettle(input: {
  dirty: boolean;
  isTaskAgentType: boolean;
  ownedByTaskSession: boolean;
  agentType?: string | null;
}): boolean {
  if (!input.dirty) return false;
  if (!input.isTaskAgentType || !input.ownedByTaskSession) return false;
  return input.agentType === 'task.create';
}

/**
 * Residual 425: Host execution receipt for pure domain createTemplate fallback.
 * Presentation only — caller owns persistence/reactivity of the receipt list.
 * Never calls Host kernel mutation execution.
 */
export function buildHostTaskClientExecutionReceipt(input: {
  runId: string;
  proposalId: string;
  revision: number;
  title: string;
  templateId: string;
  goalId?: string | null;
}): HostExecutionReceiptItem {
  const title = input.title.trim() || `Task ${input.templateId}`;
  const templateId = input.templateId.trim();
  const goalId =
    typeof input.goalId === 'string' && input.goalId.trim() ? input.goalId.trim() : null;
  const summary = goalId
    ? `Created task template · linked goal ${goalId}`
    : 'Created task template';
  return {
    runId: input.runId,
    proposalId: input.proposalId,
    revision: input.revision,
    kind: 'task.create',
    source: 'task',
    runStatus: 'completed',
    ok: true,
    title,
    summary,
    executedCount: 1,
    failedCount: 0,
    skippedCount: 0,
    entityIds: templateId ? [templateId] : [],
    actionLines: [
      {
        tool: 'create_task_template',
        status: 'executed',
        message: summary,
        ...(templateId ? { entityId: templateId } : {}),
      },
    ],
    ...(templateId ? { primaryEntityId: templateId } : {}),
    receiptKey: `host-receipt:${input.proposalId}`,
  };
}

/**
 * Residual 425: filter pending Host proposals already settled by client domain executor.
 */
export function filterPendingHostProposalsByClientSettlement(
  items: readonly HostProposalPanelItem[],
  settledProposalIds?: ReadonlySet<string> | readonly string[] | null,
): HostProposalPanelItem[] {
  if (!settledProposalIds) return [...items];
  const settled =
    settledProposalIds instanceof Set
      ? settledProposalIds
      : new Set(settledProposalIds);
  if (settled.size === 0) return [...items];
  return items.filter((item) => !settled.has(item.proposalId));
}

/**
 * Residual 425: merge AgentRun-derived receipts with client domain task receipts.
 * Client rows win only when the same proposalId is absent from AgentRun receipts.
 */
export function mergeHostExecutionReceiptItems(
  agentRunReceipts: readonly HostExecutionReceiptItem[],
  clientTaskReceipts?: readonly HostExecutionReceiptItem[] | null,
): HostExecutionReceiptItem[] {
  const items = [...agentRunReceipts];
  if (!clientTaskReceipts?.length) return items;
  const seen = new Set(items.map((item) => item.proposalId));
  for (const receipt of clientTaskReceipts) {
    if (!receipt?.proposalId || seen.has(receipt.proposalId)) continue;
    items.push(receipt);
    seen.add(receipt.proposalId);
  }
  return items;
}

export function buildHostExecutionReceiptItems(input: {
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
  /** Residual 419: optional task.create bridge run (fixture / future AgentType). */
  taskAgentRun?: AgentRunResult | null;
  /**
   * Residual 425: client domain createTemplate receipts (no AgentRun status change).
   * Merged after AgentRun-derived rows; never replaces an existing proposalId.
   */
  clientTaskReceipts?: readonly HostExecutionReceiptItem[] | null;
}): HostExecutionReceiptItem[] {
  const items: HostExecutionReceiptItem[] = [];

  const goalRun = input.goalAgentRun ?? null;
  if (goalRun && HOST_RECEIPT_STATUSES.has(goalRun.run.status)) {
    const status = goalRun.run.status as HostExecutionReceiptItem['runStatus'];
    const ref = buildAgentRunHostProposalRef(goalRun.run.runId, 'goal.create');
    const counts = summarizeExecutedActions(goalRun);
    // Only surface when execution actually started (actions present) or terminal failed/cancelled.
    if (
      counts.executedCount + counts.failedCount + counts.skippedCount > 0 ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      const description = goalDraftDescription(goalRun);
      items.push({
        runId: goalRun.run.runId,
        proposalId: ref.proposalId,
        revision: getRememberedHostProposalRevision(ref.proposalId, ref.revision),
        kind: 'goal.create',
        source: 'goal',
        runStatus: status,
        ok: counts.ok,
        title: goalDraftTitle(goalRun) || `Goal run ${goalRun.run.runId}`,
        summary: counts.summary,
        executedCount: counts.executedCount,
        failedCount: counts.failedCount,
        skippedCount: counts.skippedCount,
        entityIds: counts.entityIds,
        actionLines: counts.actionLines,
        primaryEntityId: counts.primaryEntityId,
        ...(description ? { description } : {}),
        receiptKey: `host-receipt:${ref.proposalId}`,
      });
    }
  }

  const noteRun = input.noteAgentRun ?? null;
  if (noteRun && HOST_RECEIPT_STATUSES.has(noteRun.run.status)) {
    const status = noteRun.run.status as HostExecutionReceiptItem['runStatus'];
    const ref = buildAgentRunHostProposalRef(noteRun.run.runId, 'knowledge.write');
    const counts = summarizeExecutedActions(noteRun);
    if (
      counts.executedCount + counts.failedCount + counts.skippedCount > 0 ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      const targetPath = knowledgeDraftTargetPath(noteRun);
      const contentPreview = truncateHostContentPreview(knowledgeDraftMarkdown(noteRun));
      items.push({
        runId: noteRun.run.runId,
        proposalId: ref.proposalId,
        revision: getRememberedHostProposalRevision(ref.proposalId, ref.revision),
        kind: 'knowledge.write',
        source: 'knowledge',
        runStatus: status,
        ok: counts.ok,
        title: knowledgeDraftTitle(noteRun) || `Knowledge run ${noteRun.run.runId}`,
        summary: counts.summary,
        executedCount: counts.executedCount,
        failedCount: counts.failedCount,
        skippedCount: counts.skippedCount,
        entityIds: counts.entityIds,
        actionLines: counts.actionLines,
        primaryEntityId: counts.primaryEntityId,
        ...(targetPath ? { targetPath } : {}),
        ...(contentPreview ? { contentPreview } : {}),
        receiptKey: `host-receipt:${ref.proposalId}`,
      });
    }
  }

  const taskRun = input.taskAgentRun ?? null;
  if (taskRun && HOST_RECEIPT_STATUSES.has(taskRun.run.status)) {
    const status = taskRun.run.status as HostExecutionReceiptItem['runStatus'];
    const ref = buildAgentRunHostProposalRef(taskRun.run.runId, 'task.create');
    const counts = summarizeExecutedActions(taskRun);
    if (
      counts.executedCount + counts.failedCount + counts.skippedCount > 0 ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      items.push({
        runId: taskRun.run.runId,
        proposalId: ref.proposalId,
        revision: getRememberedHostProposalRevision(ref.proposalId, ref.revision),
        kind: 'task.create',
        source: 'task',
        runStatus: status,
        ok: counts.ok,
        title: taskDraftTitle(taskRun) || `Task run ${taskRun.run.runId}`,
        summary: counts.summary,
        executedCount: counts.executedCount,
        failedCount: counts.failedCount,
        skippedCount: counts.skippedCount,
        entityIds: counts.entityIds,
        actionLines: counts.actionLines,
        primaryEntityId: counts.primaryEntityId,
        receiptKey: `host-receipt:${ref.proposalId}`,
      });
    }
  }

  // Residual 425: merge client domain task receipts (createTemplate fallback).
  return mergeHostExecutionReceiptItems(items, input.clientTaskReceipts);
}

export function buildPendingHostProposalItems(input: {
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
  /** Residual 419: optional task.create bridge run (fixture / future AgentType). */
  taskAgentRun?: AgentRunResult | null;
  /**
   * Residual 425: proposalIds already settled by client domain executor
   * (createTemplate fallback) — suppress pending rows without AgentRun status change.
   */
  settledProposalIds?: ReadonlySet<string> | readonly string[] | null;
}): HostProposalPanelItem[] {
  const items: HostProposalPanelItem[] = [];

  const goalRun = input.goalAgentRun ?? null;
  if (goalRun?.run.status === 'waiting_approval') {
    const ref = buildAgentRunHostProposalRef(goalRun.run.runId, 'goal.create');
    const title = goalDraftTitle(goalRun) || `Goal run ${goalRun.run.runId}`;
    items.push({
      runId: goalRun.run.runId,
      proposalId: ref.proposalId,
      revision: ref.revision,
      kind: 'goal.create',
      source: 'goal',
      runStatus: 'waiting_approval',
      title,
      description: goalDraftDescription(goalRun),
      summary: firstPendingRationale(goalRun),
      pendingActionCount: pendingActionCount(goalRun),
    });
  }

  const noteRun = input.noteAgentRun ?? null;
  if (noteRun?.run.status === 'waiting_approval') {
    const ref = buildAgentRunHostProposalRef(noteRun.run.runId, 'knowledge.write');
    const title = knowledgeDraftTitle(noteRun) || `Knowledge run ${noteRun.run.runId}`;
    items.push({
      runId: noteRun.run.runId,
      proposalId: ref.proposalId,
      revision: ref.revision,
      kind: 'knowledge.write',
      source: 'knowledge',
      runStatus: 'waiting_approval',
      title,
      summary: firstPendingRationale(noteRun),
      pendingActionCount: pendingActionCount(noteRun),
      targetPath: knowledgeDraftTargetPath(noteRun),
      contentMarkdown: knowledgeDraftMarkdown(noteRun),
    });
  }

  // Residual 419: task.create Host proposal lane (presentation + lifecycle only).
  const taskRun = input.taskAgentRun ?? null;
  if (taskRun?.run.status === 'waiting_approval') {
    const ref = buildAgentRunHostProposalRef(taskRun.run.runId, 'task.create');
    const title = taskDraftTitle(taskRun) || `Task run ${taskRun.run.runId}`;
    const goalId = taskDraftGoalId(taskRun);
    items.push({
      runId: taskRun.run.runId,
      proposalId: ref.proposalId,
      revision: ref.revision,
      kind: 'task.create',
      source: 'task',
      runStatus: 'waiting_approval',
      title,
      summary: firstPendingRationale(taskRun),
      pendingActionCount: pendingActionCount(taskRun),
      ...(goalId !== null && goalId !== undefined ? { goalId } : {}),
    });
  }

  // Residual 425: hide client-settled task proposals (domain createTemplate fallback).
  return filterPendingHostProposalsByClientSettlement(items, input.settledProposalIds);
}

/**
 * Residual 381: Host workbench reopen kind when restoring an AgentRun from history.
 * proposal = waiting_approval bridge rows; receipt = terminal Host execution report.
 */
export type HostWorkbenchReopenKind = 'proposal' | 'receipt' | 'none';

/**
 * Residual 381: decide whether Conversation AgentRun history should reopen the
 * Host proposal or execution-report workbench. knowledge.qa never owns Host rows.
 */
export function resolveHostWorkbenchReopenFromAgentRun(
  result: AgentRunResult | null | undefined,
): HostWorkbenchReopenKind {
  if (!result?.run) return 'none';
  const agentType = result.run.agentType;
  // Residual 419/423/427: task.create Host lane via AgentType or task-shaped artifacts.
  const looksLikeTaskHostRun =
    result.run.agentType === 'task.create' || isTaskShapedHostAgentRun(result);
  if (
    agentType !== 'goal.create'
    && agentType !== 'knowledge.generate'
    && !looksLikeTaskHostRun
  ) {
    return 'none';
  }
  if (result.run.status === 'waiting_approval') {
    return 'proposal';
  }
  if (
    result.run.status === 'completed' ||
    result.run.status === 'failed' ||
    result.run.status === 'cancelled'
  ) {
    const items = buildHostExecutionReceiptItems({
      goalAgentRun: agentType === 'goal.create' && !looksLikeTaskHostRun ? result : null,
      noteAgentRun: agentType === 'knowledge.generate' ? result : null,
      taskAgentRun: looksLikeTaskHostRun ? result : null,
    });
    return items.length > 0 ? 'receipt' : 'none';
  }
  return 'none';
}

export function shouldOpenHostWorkbenchFromAgentRun(
  result: AgentRunResult | null | undefined,
): boolean {
  return resolveHostWorkbenchReopenFromAgentRun(result) !== 'none';
}

/**
 * Residual 441: map a restored AgentRun snapshot to a Host workbench focus target.
 * Used when Conversation history reopens the right rail so the matching
 * proposal/receipt row is highlighted (same contract as timeline focus).
 */
export function resolveHostWorkbenchFocusFromAgentRun(
  result: AgentRunResult | null | undefined,
): HostWorkbenchFocusTarget | null {
  const reopen = resolveHostWorkbenchReopenFromAgentRun(result);
  if (reopen === 'none' || !result?.run) return null;

  const looksLikeTaskHostRun =
    result.run.agentType === 'task.create' || isTaskShapedHostAgentRun(result);
  let kind: AgentRunHostProposalKind | null = null;
  if (looksLikeTaskHostRun) {
    kind = 'task.create';
  } else if (result.run.agentType === 'goal.create') {
    kind = 'goal.create';
  } else if (result.run.agentType === 'knowledge.generate') {
    kind = 'knowledge.write';
  }
  if (!kind) return null;

  const ref = buildAgentRunHostProposalRef(result.run.runId, kind);
  return {
    proposalId: ref.proposalId,
    surface: reopen === 'proposal' ? 'proposal' : 'receipt',
  };
}

/**
 * Residual 443: pick Host workbench focus from live session AgentRun snapshots
 * after conversation restore (or start). Prefer exclusive task.create lane, then
 * goal, then knowledge. Returns null when no Host proposal/receipt should reopen.
 */
export function resolveHostWorkbenchFocusFromSessionRuns(input: {
  taskAgentRun?: AgentRunResult | null;
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
}): HostWorkbenchFocusTarget | null {
  return (
    resolveHostWorkbenchFocusFromAgentRun(input.taskAgentRun) ??
    resolveHostWorkbenchFocusFromAgentRun(input.goalAgentRun) ??
    resolveHostWorkbenchFocusFromAgentRun(input.noteAgentRun)
  );
}

/**
 * Residual 445: recover optional linked goalId from task.create / task-shaped Host run.
 * Reads pending/approved create_task_template payload and task draft artifacts.
 * Used to re-align ActionBar linkedGoalId after conversation restore.
 */
export function resolveLinkedGoalIdFromTaskAgentRun(
  result: AgentRunResult | null | undefined,
): string | null {
  if (!result?.run) return null;
  if (result.run.agentType !== 'task.create' && !isPrimaryTaskHostAgentRun(result)) {
    return null;
  }
  return taskDraftGoalId(result);
}

/**
 * Residual 399: Host multi-engine lane label for timeline Artifact cards.
 * Distinguishes open-chat Turn Engines from AgentRun proposal-kernel lanes.
 * Presentation only — never selects or executes engines.
 */
export type HostTimelineEngineKey =
  | 'engine.direct_turn'
  | 'engine.pi_readonly'
  | 'agent_run.goal_create'
  | 'agent_run.knowledge_write'
  | 'agent_run.task_create'
  | 'unknown';

/**
 * Residual 399: resolve Host engine/profile badge key for timeline cards.
 * Prefer explicit open-chat executionProfileId when present; otherwise map
 * AgentRun Host proposal kinds to agent_run lanes. Fail closed to unknown.
 */
export function resolveHostTimelineEngineKey(input: {
  kind?: string | null;
  executionProfileId?: string | null;
}): HostTimelineEngineKey {
  // AgentRun Host proposal kinds own the engine lane (not open-chat profile).
  const kind = typeof input.kind === 'string' ? input.kind.trim() : '';
  if (kind === 'goal.create') return 'agent_run.goal_create';
  if (kind === 'knowledge.write') return 'agent_run.knowledge_write';
  if (kind === 'task.create') return 'agent_run.task_create';

  // Open-chat Turn Engine profile only when no AgentRun kind is present.
  const profile = typeof input.executionProfileId === 'string' ? input.executionProfileId.trim() : '';
  if (profile === 'pi_readonly') return 'engine.pi_readonly';
  if (profile === 'direct_turn') return 'engine.direct_turn';
  return 'unknown';
}

/**
 * Residual 383: compact Host Artifact card for the Conversation message timeline.
 * Surfaces proposal (awaiting approval) or receipt (post-execution) without owning
 * mutation lifecycle — click reopens the right workbench.
 * Residual 399: engineKey badge for multi-engine isolation visibility.
 */
/** Residual 401: open_chat is a presentation lane for multi-engine open-chat turns. */
export type HostTimelineArtifactSurface = 'proposal' | 'receipt' | 'open_chat';
export type HostTimelineArtifactKind = AgentRunHostProposalKind | 'open_chat.turn';
export type HostTimelineArtifactSource = HostProposalPanelSource | 'open_chat';

export type HostTimelineArtifactItem = {
  id: string;
  surface: HostTimelineArtifactSurface;
  runId: string;
  proposalId: string;
  kind: HostTimelineArtifactKind;
  source: HostTimelineArtifactSource;
  title: string;
  summary: string;
  statusLabelKey: 'pending' | 'ok' | 'partial' | 'failed' | 'cancelled';
  /** Residual 399: Host engine/profile lane for multi-engine isolation badge. */
  engineKey: HostTimelineEngineKey;
};

/**
 * Residual 401: open-chat Host turn snapshot for timeline multi-engine badges.
 * Presentation only — not a proposal/receipt lifecycle object.
 */
export type HostOpenChatTurnSnapshot = {
  runId: string;
  executionProfileId: 'direct_turn' | 'pi_readonly' | string;
  status: 'generating' | 'completed' | 'aborted' | 'failed';
  title: string;
  summary?: string;
  /** Optional engine id from run.started for diagnostics. */
  engineId?: string;
};

/**
 * Residual 383: derive timeline Artifact cards from current Host proposal + receipt rows.
 * Residual 399: attach engineKey from AgentRun kind or optional open-chat profile.
 */
export function buildHostTimelineArtifactItems(input: {
  proposals?: HostProposalPanelItem[];
  receipts?: HostExecutionReceiptItem[];
  /** Optional open-chat profile override for non-AgentRun Host cards. */
  executionProfileId?: string | null;
}): HostTimelineArtifactItem[] {
  const items: HostTimelineArtifactItem[] = [];

  for (const proposal of input.proposals ?? []) {
    items.push({
      id: `timeline-proposal:${proposal.proposalId}`,
      surface: 'proposal',
      runId: proposal.runId,
      proposalId: proposal.proposalId,
      kind: proposal.kind,
      source: proposal.source,
      title: proposal.title,
      summary: proposal.summary || proposal.description || '',
      statusLabelKey: 'pending',
      engineKey: resolveHostTimelineEngineKey({
        kind: proposal.kind,
        executionProfileId: input.executionProfileId,
      }),
    });
  }

  for (const receipt of input.receipts ?? []) {
    let statusLabelKey: HostTimelineArtifactItem['statusLabelKey'] = 'partial';
    if (receipt.runStatus === 'cancelled') statusLabelKey = 'cancelled';
    else if (receipt.runStatus === 'failed') statusLabelKey = 'failed';
    else if (receipt.ok) statusLabelKey = 'ok';
    items.push({
      id: `timeline-receipt:${receipt.receiptKey}`,
      surface: 'receipt',
      runId: receipt.runId,
      proposalId: receipt.proposalId,
      kind: receipt.kind,
      source: receipt.source,
      title: receipt.title,
      summary: receipt.summary,
      statusLabelKey,
      engineKey: resolveHostTimelineEngineKey({
        kind: receipt.kind,
        executionProfileId: input.executionProfileId,
      }),
    });
  }

  return items;
}

/**
 * Residual 401: build timeline Artifact cards for open-chat Host turns.
 * Uses live executionProfileId so engine badges distinguish DirectTurn vs
 * ReadonlyAnalysis. Never creates proposal/receipt lifecycle rows.
 */
export function buildHostOpenChatTimelineArtifactItems(
  turns: HostOpenChatTurnSnapshot[] | null | undefined,
): HostTimelineArtifactItem[] {
  const items: HostTimelineArtifactItem[] = [];
  for (const turn of turns ?? []) {
    const runId = typeof turn.runId === 'string' ? turn.runId.trim() : '';
    if (!runId) continue;

    let statusLabelKey: HostTimelineArtifactItem['statusLabelKey'] = 'partial';
    if (turn.status === 'generating') statusLabelKey = 'pending';
    else if (turn.status === 'completed') statusLabelKey = 'ok';
    else if (turn.status === 'failed') statusLabelKey = 'failed';
    else if (turn.status === 'aborted') statusLabelKey = 'cancelled';

    const title =
      typeof turn.title === 'string' && turn.title.trim()
        ? turn.title.trim().slice(0, 120)
        : 'Open chat';
    const summary = typeof turn.summary === 'string' ? turn.summary.trim().slice(0, 240) : '';

    items.push({
      id: `timeline-open-chat:${runId}`,
      surface: 'open_chat',
      runId,
      proposalId: `open-chat:${runId}`,
      kind: 'open_chat.turn',
      source: 'open_chat',
      title,
      summary,
      statusLabelKey,
      engineKey: resolveHostTimelineEngineKey({
        executionProfileId: turn.executionProfileId,
      }),
    });
  }
  return items;
}

/**
 * Residual 387: map a timeline Artifact card to a Host workbench focus target.
 * Used when Conversation timeline reopens the right rail so the matching
 * proposal/receipt row can be highlighted and scrolled into view.
 * Residual 401: open_chat cards never focus proposal/receipt workbench rows.
 */
export type HostWorkbenchFocusTarget = {
  proposalId: string;
  surface: 'proposal' | 'receipt';
};

export function resolveHostWorkbenchFocusFromTimeline(
  item: HostTimelineArtifactItem | null | undefined,
): HostWorkbenchFocusTarget | null {
  if (!item?.proposalId?.trim()) return null;
  if (item.surface !== 'proposal' && item.surface !== 'receipt') return null;
  return {
    proposalId: item.proposalId.trim(),
    surface: item.surface,
  };
}

/**
 * Residual 409: partition Host timeline Artifact cards into open_chat vs AgentRun
 * (proposal/receipt) lanes. Presentation-only — never mutates Host kernel state.
 */
export function partitionHostTimelineArtifactsBySurface(
  items: readonly HostTimelineArtifactItem[] | null | undefined,
): {
  openChat: HostTimelineArtifactItem[];
  agentRun: HostTimelineArtifactItem[];
} {
  const openChat: HostTimelineArtifactItem[] = [];
  const agentRun: HostTimelineArtifactItem[] = [];
  for (const item of items ?? []) {
    if (item.surface === 'open_chat') {
      openChat.push(item);
      continue;
    }
    if (item.surface === 'proposal' || item.surface === 'receipt') {
      agentRun.push(item);
    }
  }
  return { openChat, agentRun };
}

export type HostTimelineSurfaceIsolationViolation = {
  itemId: string;
  code:
    | 'open_chat_kind_mismatch'
    | 'open_chat_engine_agent_run'
    | 'agent_run_kind_open_chat'
    | 'agent_run_engine_turn';
  detail: string;
};

/**
 * Residual 409: fail-closed isolation audit for Host timeline surfaces.
 * - open_chat cards: kind must be open_chat.turn; engineKey must not be agent_run.*
 * - proposal/receipt cards: kind must not be open_chat.turn; engineKey must not be
 *   engine.direct_turn / engine.pi_readonly (AgentRun lane owns those cards)
 */
export function collectHostTimelineSurfaceIsolationViolations(
  items: readonly HostTimelineArtifactItem[] | null | undefined,
): HostTimelineSurfaceIsolationViolation[] {
  const violations: HostTimelineSurfaceIsolationViolation[] = [];
  for (const item of items ?? []) {
    if (item.surface === 'open_chat') {
      if (item.kind !== 'open_chat.turn') {
        violations.push({
          itemId: item.id,
          code: 'open_chat_kind_mismatch',
          detail: `kind=${item.kind}`,
        });
      }
      if (String(item.engineKey).startsWith('agent_run.')) {
        violations.push({
          itemId: item.id,
          code: 'open_chat_engine_agent_run',
          detail: `engineKey=${item.engineKey}`,
        });
      }
      continue;
    }

    if (item.surface === 'proposal' || item.surface === 'receipt') {
      if (item.kind === 'open_chat.turn') {
        violations.push({
          itemId: item.id,
          code: 'agent_run_kind_open_chat',
          detail: `surface=${item.surface}`,
        });
      }
      if (
        item.engineKey === 'engine.direct_turn'
        || item.engineKey === 'engine.pi_readonly'
      ) {
        violations.push({
          itemId: item.id,
          code: 'agent_run_engine_turn',
          detail: `engineKey=${item.engineKey}`,
        });
      }
    }
  }
  return violations;
}

/**
 * Residual 411: compose Host workbench timeline from open-chat turns + AgentRun
 * proposal/receipt rows, then partition and fail-closed audit surface isolation.
 * Presentation only — never executes Host kernel mutations or domain executors.
 */
export type HostWorkbenchTimelineComposition = {
  items: HostTimelineArtifactItem[];
  openChat: HostTimelineArtifactItem[];
  agentRun: HostTimelineArtifactItem[];
  isolationViolations: HostTimelineSurfaceIsolationViolation[];
  /** True when open_chat and AgentRun lanes do not smuggle each other. */
  isolationOk: boolean;
};

export function composeHostWorkbenchTimelineArtifacts(input: {
  openChatTurns?: HostOpenChatTurnSnapshot[] | null;
  proposals?: HostProposalPanelItem[] | null;
  receipts?: HostExecutionReceiptItem[] | null;
  /** Optional open-chat profile override for non-AgentRun Host cards only. */
  executionProfileId?: string | null;
}): HostWorkbenchTimelineComposition {
  const items: HostTimelineArtifactItem[] = [
    ...buildHostOpenChatTimelineArtifactItems(input.openChatTurns),
    ...buildHostTimelineArtifactItems({
      proposals: input.proposals ?? undefined,
      receipts: input.receipts ?? undefined,
      executionProfileId: input.executionProfileId,
    }),
  ];
  const { openChat, agentRun } = partitionHostTimelineArtifactsBySurface(items);
  const isolationViolations = collectHostTimelineSurfaceIsolationViolations(items);
  return {
    items,
    openChat,
    agentRun,
    isolationViolations,
    isolationOk: isolationViolations.length === 0,
  };
}

