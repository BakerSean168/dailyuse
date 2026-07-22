import { describe, expect, it } from 'vitest';
import {
  AGENT_RUN_HOST_PROPOSAL_REVISION,
  buildAgentRunHostProposalId,
  buildAgentRunHostProposalRef,
  applyAgentRunBridgeProposalPatch,
  materializeAgentRunBridgeProposal,
  parseAgentRunHostProposalId,
} from './proposal-bridge';

describe('agent-run Host proposal bridge', () => {
  it('builds and parses deterministic bridge ids', () => {
    const id = buildAgentRunHostProposalId('run-1', 'goal.create');
    expect(id).toBe('agent-run:run-1:goal.create');
    expect(parseAgentRunHostProposalId(id)).toEqual({
      runId: 'run-1',
      kind: 'goal.create',
    });
    expect(buildAgentRunHostProposalRef('run-1', 'knowledge.write')).toEqual({
      proposalId: 'agent-run:run-1:knowledge.write',
      revision: AGENT_RUN_HOST_PROPOSAL_REVISION,
    });
  });

  it('rejects empty run ids and non-bridge proposals', () => {
    expect(() => buildAgentRunHostProposalId('', 'goal.create')).toThrow(/RUN_ID/);
    expect(parseAgentRunHostProposalId('prop-1')).toBeNull();
    expect(parseAgentRunHostProposalId('agent-run:run-1:unknown.kind')).toBeNull();
  });

  it('materializes ready proposals without mutation payloads for executors', () => {
    const goal = materializeAgentRunBridgeProposal('run-g', 'goal.create', 42);
    expect(goal).toMatchObject({
      kind: 'goal.create',
      id: 'agent-run:run-g:goal.create',
      status: 'ready',
      revision: 1,
      createdAt: 42,
    });

    const knowledge = materializeAgentRunBridgeProposal('run-k', 'knowledge.write', 7);
    expect(knowledge).toMatchObject({
      kind: 'knowledge.write',
      id: 'agent-run:run-k:knowledge.write',
      status: 'ready',
      targetPath: '_host_bridge/run-k.md',
    });
  });

  it('applies Host patch fields without changing kind', () => {
    const base = materializeAgentRunBridgeProposal('run-g', 'goal.create', 1);
    const patched = applyAgentRunBridgeProposalPatch(base, {
      title: '  Edited Goal  ',
      description: 'desc',
    });
    expect(patched).toMatchObject({
      kind: 'goal.create',
      title: 'Edited Goal',
      description: 'desc',
      status: 'ready',
    });
  });
});
