import { describe, expect, it } from 'vitest';
import type { CapabilityOffer, ResolvedRunPlan } from './capabilities';
import {
  knowledgeWriteRequirements,
  resolveRunPlan,
} from './capabilities';
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

describe('resolveRunPlan isolation', () => {
  const desktopVault: CapabilityOffer = {
    kind: 'context.local_vault',
    providerId: 'desktop-local-vault',
    surface: 'desktop',
    readonly: false,
  };
  const cloudRag: CapabilityOffer = {
    kind: 'context.cloud_rag',
    providerId: 'web-github-projection',
    surface: 'web',
    readonly: true,
  };
  const proposal: CapabilityOffer = {
    kind: 'tool.proposal',
    providerId: 'proposal-kernel',
    surface: 'any',
    readonly: false,
  };
  const mutation: CapabilityOffer = {
    kind: 'tool.mutation',
    providerId: 'host-executor',
    surface: 'any',
    readonly: false,
  };
  const readonlyMutation: CapabilityOffer = {
    kind: 'tool.mutation',
    providerId: 'readonly-host',
    surface: 'any',
    readonly: true,
  };

  it('fails closed when required knowledge-write context is missing for the surface', () => {
    const plan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [proposal, mutation, cloudRag],
      requirements: knowledgeWriteRequirements('desktop'),
      surface: 'desktop',
    });

    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind)).toEqual(['context.local_vault']);
    // Web-only cloud RAG offer is filtered out of the desktop plan.
    expect(plan.offers.some((offer) => offer.kind === 'context.cloud_rag')).toBe(false);
  });

  it('accepts a desktop knowledge-write plan only with local vault + proposal + mutation', () => {
    const plan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [proposal, mutation, desktopVault, cloudRag],
      requirements: knowledgeWriteRequirements('desktop'),
      surface: 'desktop',
    });

    expect(plan.engineId).toBe('knowledge.generate');
    expect(plan.missing).toEqual([]);
    expect(plan.offers.map((offer) => offer.kind).sort()).toEqual(
      ['context.local_vault', 'tool.mutation', 'tool.proposal'].sort(),
    );
  });

  it('rejects readonly-only mutation offers for writable knowledge requirements', () => {
    const plan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: [proposal, readonlyMutation, cloudRag],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });

    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind)).toContain('tool.mutation');
  });

  it('ignores optional missing capabilities without disabling the engine', () => {
    const plan = resolveRunPlan({
      engineId: 'chat.turn',
      offers: [
        {
          kind: 'chat.complete',
          providerId: 'chat',
          surface: 'any',
          readonly: false,
        },
      ],
      requirements: [
        { kind: 'chat.complete' },
        { kind: 'engine.cli_readonly', optional: true },
      ],
    });

    expect(plan.engineId).toBe('chat.turn');
    expect(plan.missing).toEqual([]);
  });
});
