/**
 * Host proposal lifecycle helpers (residual 355/357).
 *
 * Routes approve/reject through AssistantFacade before legacy AgentRun executors.
 * Derives thin workbench panel items from waiting_approval AgentRun snapshots.
 * Never calls ProposalKernel mutation execution from this module.
 */
import type {
  AgentRunHostProposalKind,
  AgentRunResult,
  AssistantEvent,
} from '@dailyuse/contracts/ai';
import { buildAgentRunHostProposalRef } from '@dailyuse/contracts/ai';
import type { AIChatService } from './types';

export type HostProposalLifecycleService = Pick<AIChatService, 'dispatchAssistant'>;

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
};

export async function dispatchHostProposalDecision(
  service: HostProposalLifecycleService,
  input: {
    decision: 'approve' | 'reject';
    runId: string;
    kind: AgentRunHostProposalKind;
    reason?: string;
  },
): Promise<AssistantEvent[]> {
  const { proposalId, revision } = buildAgentRunHostProposalRef(input.runId, input.kind);
  const events: AssistantEvent[] = [];

  await service.dispatchAssistant(
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
    {
      onEvent: (event) => {
        events.push(event);
      },
    },
  );

  const errorEvent = events.find((event) => event.type === 'error');
  if (errorEvent && errorEvent.type === 'error') {
    throw new Error(errorEvent.message || 'Host proposal lifecycle failed');
  }

  const expectedType =
    input.decision === 'approve' ? 'proposal.approved' : 'proposal.rejected';
  if (!events.some((event) => event.type === expectedType)) {
    throw new Error(`Host proposal lifecycle missing ${expectedType}`);
  }

  return events;
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
    });
  }

  return items;
}
