/**
 * Agent-run → Host Proposal bridge (ADR-035 residual 355).
 *
 * Legacy AgentRun waiting_approval paths do not yet materialize AgentProposal
 * records inside ProposalKernel. UI confirm/cancel must still go through
 * AssistantFacade approve_proposal / reject_proposal (lifecycle only) before
 * the separate business executor (resumeAgentRun / create note, etc.).
 *
 * Bridge ids are deterministic and Host-owned:
 *   agent-run:{runId}:{kind}
 * Facade materializes a ready proposal on first approve/reject when the id
 * matches this pattern and runId agrees. Non-bridge ids are unchanged
 * (kernel must already hold the proposal).
 */

import type { AgentProposal } from './proposal';

export type AgentRunHostProposalKind = AgentProposal['kind'];

export const AGENT_RUN_HOST_PROPOSAL_PREFIX = 'agent-run:' as const;
export const AGENT_RUN_HOST_PROPOSAL_REVISION = 1 as const;

const KIND_PATTERN = 'goal\\.create|knowledge\\.write|task\\.create';

export function buildAgentRunHostProposalId(
  runId: string,
  kind: AgentRunHostProposalKind,
): string {
  const trimmed = runId?.trim();
  if (!trimmed) {
    throw new Error('RUN_ID_REQUIRED');
  }
  return `${AGENT_RUN_HOST_PROPOSAL_PREFIX}${trimmed}:${kind}`;
}

export function buildAgentRunHostProposalRef(
  runId: string,
  kind: AgentRunHostProposalKind,
): { proposalId: string; revision: typeof AGENT_RUN_HOST_PROPOSAL_REVISION } {
  return {
    proposalId: buildAgentRunHostProposalId(runId, kind),
    revision: AGENT_RUN_HOST_PROPOSAL_REVISION,
  };
}

export function parseAgentRunHostProposalId(
  proposalId: string,
): { runId: string; kind: AgentRunHostProposalKind } | null {
  if (!proposalId?.startsWith(AGENT_RUN_HOST_PROPOSAL_PREFIX)) {
    return null;
  }
  const rest = proposalId.slice(AGENT_RUN_HOST_PROPOSAL_PREFIX.length);
  const match = rest.match(new RegExp(`^(.*):(${KIND_PATTERN})$`));
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    runId: match[1],
    kind: match[2] as AgentRunHostProposalKind,
  };
}

/**
 * Materialize a ready bridge proposal for ProposalKernel.create.
 * Content is a lifecycle placeholder; business executors still supply real payloads.
 */
export function materializeAgentRunBridgeProposal(
  runId: string,
  kind: AgentRunHostProposalKind,
  now: number = Date.now(),
): AgentProposal {
  const id = buildAgentRunHostProposalId(runId, kind);
  const base = {
    id,
    status: 'ready' as const,
    revision: AGENT_RUN_HOST_PROPOSAL_REVISION,
    createdAt: now,
    updatedAt: now,
  };

  if (kind === 'goal.create') {
    return {
      ...base,
      kind,
      title: `Host bridge goal proposal for ${runId}`,
      description: null,
    };
  }

  if (kind === 'knowledge.write') {
    return {
      ...base,
      kind,
      targetPath: `_host_bridge/${runId}.md`,
      contentMarkdown: '<!-- host bridge proposal; executor supplies content -->',
    };
  }

  return {
    ...base,
    kind,
    title: `Host bridge task proposal for ${runId}`,
    goalId: null,
  };
}
