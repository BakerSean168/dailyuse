/**
 * Host proposal lifecycle helpers (residual 355).
 *
 * Routes approve/reject through AssistantFacade before legacy AgentRun executors.
 * Never calls ProposalKernel mutation execution from this module.
 */
import type { AgentRunHostProposalKind, AssistantEvent } from '@dailyuse/contracts/ai';
import { buildAgentRunHostProposalRef } from '@dailyuse/contracts/ai';
import type { AIChatService } from './types';

export type HostProposalLifecycleService = Pick<AIChatService, 'dispatchAssistant'>;

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
