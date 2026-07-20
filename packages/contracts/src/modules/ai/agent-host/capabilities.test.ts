import { describe, expect, it } from 'vitest';
import type { CapabilityOffer, ResolvedRunPlan } from './capabilities';
import type { AgentProposal } from './proposal';

describe('agent-host stage-0 contracts', () => {
  it('describes a direct-turn capability offer', () => {
    const offer: CapabilityOffer = {
      kind: 'engine.direct_turn',
      providerId: 'direct-chat-execution',
      surface: 'any',
      readonly: false,
    };
    expect(offer.kind).toBe('engine.direct_turn');
  });

  it('models a knowledge write proposal without mutation side effects', () => {
    const proposal: AgentProposal = {
      kind: 'knowledge.write',
      id: 'prop_1',
      status: 'ready',
      revision: 1,
      targetPath: 'Inbox/idea.md',
      contentMarkdown: '# Idea',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(proposal.kind).toBe('knowledge.write');
    expect(proposal.targetPath).not.toContain('..');
  });

  it('resolved plan reports missing requirements', () => {
    const plan: ResolvedRunPlan = {
      engineId: 'none',
      offers: [],
      missing: [{ kind: 'context.local_vault', optional: false }],
    };
    expect(plan.missing).toHaveLength(1);
  });
});
