/**
 * Host proposal lifecycle helpers (residual 355/357/359/361/363/365/367/379/381/383).
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


export type HostProposalPanelSource = 'goal' | 'knowledge';

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

  const patch: AssistantProposalPatch = {};
  if (typeof input.title === 'string' && input.title.trim()) {
    patch.title = input.title.trim();
  }
  return patch;
}

export function isHostProposalDraftDirty(input: {
  item: HostProposalPanelItem;
  title?: string;
  targetPath?: string;
  contentMarkdown?: string;
  description?: string | null;
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
  /** Stable UI key; not a Host mutation request id. */
  receiptKey: string;
};

const HOST_RECEIPT_STATUSES = new Set(['completed', 'failed', 'cancelled']);

function summarizeExecutedActions(run: AgentRunResult): {
  executedCount: number;
  failedCount: number;
  skippedCount: number;
  entityIds: string[];
  ok: boolean;
  summary: string;
} {
  const actions = run.state.executedActions ?? [];
  let executedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const entityIds: string[] = [];
  for (const action of actions) {
    if (action.status === 'executed') executedCount += 1;
    else if (action.status === 'failed') failedCount += 1;
    else if (action.status === 'skipped') skippedCount += 1;
    if (typeof action.entityId === 'string' && action.entityId.trim()) {
      entityIds.push(action.entityId.trim());
    }
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
  return { executedCount, failedCount, skippedCount, entityIds, ok, summary };
}

/**
 * Residual 379: build Host execution receipt rows from completed/failed/cancelled
 * Goal/Knowledge AgentRun snapshots after Host approve + domain executor.
 * waiting_approval / waiting_execution never produce receipts (still pending).
 * Does not call Host kernel mutation execution or any mutation port.
 */
export function buildHostExecutionReceiptItems(input: {
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
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
        receiptKey: `host-receipt:${ref.proposalId}`,
      });
    }
  }

  return items;
}

export function buildPendingHostProposalItems(input: {
  goalAgentRun?: AgentRunResult | null;
  noteAgentRun?: AgentRunResult | null;
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

  return items;
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
  if (agentType !== 'goal.create' && agentType !== 'knowledge.generate') {
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
      goalAgentRun: agentType === 'goal.create' ? result : null,
      noteAgentRun: agentType === 'knowledge.generate' ? result : null,
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
 * Residual 383: compact Host Artifact card for the Conversation message timeline.
 * Surfaces proposal (awaiting approval) or receipt (post-execution) without owning
 * mutation lifecycle — click reopens the right workbench.
 */
export type HostTimelineArtifactItem = {
  id: string;
  surface: 'proposal' | 'receipt';
  runId: string;
  proposalId: string;
  kind: AgentRunHostProposalKind;
  source: HostProposalPanelSource;
  title: string;
  summary: string;
  statusLabelKey: 'pending' | 'ok' | 'partial' | 'failed' | 'cancelled';
};

/**
 * Residual 383: derive timeline Artifact cards from current Host proposal + receipt rows.
 */
export function buildHostTimelineArtifactItems(input: {
  proposals?: HostProposalPanelItem[];
  receipts?: HostExecutionReceiptItem[];
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
    });
  }

  return items;
}
