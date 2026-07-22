/**
 * Host proposal lifecycle helpers (residual 355/357/359/361/363/365).
 *
 * Routes approve/reject/revise through AssistantFacade before legacy AgentRun
 * executors. Derives thin workbench panel items from waiting_approval AgentRun
 * snapshots. Never calls ProposalKernel mutation execution from this module.
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
}): boolean {
  if (input.item.kind === 'knowledge.write') {
    const nextPath = (input.targetPath ?? '').trim().split('\\').join('/');
    const basePath = (input.item.targetPath ?? '').trim().split('\\').join('/');
    const nextBody = input.contentMarkdown ?? '';
    const baseBody = input.item.contentMarkdown ?? '';
    return nextPath !== basePath || nextBody !== baseBody;
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
