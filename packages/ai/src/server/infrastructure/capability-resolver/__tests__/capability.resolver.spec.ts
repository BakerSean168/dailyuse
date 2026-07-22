import { describe, expect, it } from 'vitest';
import {
  goalAutomationRequirements,
  knowledgeWriteRequirements,
  type CapabilityOffer,
} from '@dailyuse/contracts/ai';
import {
  CapabilityResolver,
  CAPABILITY_RESOLVER_ENGINE_ID,
} from '../capability.resolver';

const PROPOSAL: CapabilityOffer = {
  kind: 'tool.proposal',
  providerId: 'proposal-kernel',
  surface: 'any',
  readonly: false,
};

const MUTATION: CapabilityOffer = {
  kind: 'tool.mutation',
  providerId: 'knowledge-note-executor',
  surface: 'any',
  readonly: false,
};

const CLOUD: CapabilityOffer = {
  kind: 'context.cloud_rag',
  providerId: 'server-github-projection',
  surface: 'web',
  readonly: true,
};

const VAULT: CapabilityOffer = {
  kind: 'context.local_vault',
  providerId: 'desktop-vault',
  surface: 'desktop',
  readonly: true,
};

const GOAL_WORKFLOW: CapabilityOffer = {
  kind: 'workflow.goal',
  providerId: 'goal-create-adapter',
  surface: 'any',
  readonly: false,
};

describe('CapabilityResolver', () => {
  it('exposes capability-resolver engine id default and filters listOffers by surface', async () => {
    const resolver = new CapabilityResolver([PROPOSAL, CLOUD, VAULT]);
    expect(resolver.engineId).toBe(CAPABILITY_RESOLVER_ENGINE_ID);
    const web = await resolver.listOffers('web');
    expect(web.map((o) => o.kind).sort()).toEqual(['context.cloud_rag', 'tool.proposal'].sort());
    const desktop = await resolver.listOffers('desktop');
    expect(desktop.map((o) => o.kind).sort()).toEqual(
      ['context.local_vault', 'tool.proposal'].sort(),
    );
  });

  it('fails closed for knowledge-write when mutation/context missing', async () => {
    const resolver = new CapabilityResolver([PROPOSAL]);
    const plan = await resolver.resolve(knowledgeWriteRequirements('web'));
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind).sort()).toEqual(
      ['context.cloud_rag', 'tool.mutation'].sort(),
    );
  });

  it('accepts knowledge-write when proposal + mutation + cloud present', async () => {
    const resolver = new CapabilityResolver([PROPOSAL, MUTATION, CLOUD]);
    const plan = resolver.resolveFor(
      'knowledge.generate',
      knowledgeWriteRequirements('web'),
      'web',
    );
    expect(plan.engineId).toBe('knowledge.generate');
    expect(plan.missing).toEqual([]);
  });

  it('never invents engine.* offers from an empty constructor', async () => {
    const resolver = new CapabilityResolver();
    const offers = await resolver.listOffers('any');
    expect(offers).toEqual([]);
    expect(offers.every((o) => !o.kind.startsWith('engine.'))).toBe(true);
    const plan = await resolver.resolve([{ kind: 'engine.direct_turn' }]);
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind)).toEqual(['engine.direct_turn']);
  });

  it('goal automation requires workflow.goal + mutation + proposal', async () => {
    const partial = new CapabilityResolver([PROPOSAL, MUTATION]);
    const blocked = await partial.resolve(goalAutomationRequirements());
    expect(blocked.engineId).toBe('none');
    expect(blocked.missing.map((item) => item.kind)).toEqual(['workflow.goal']);

    const full = new CapabilityResolver([PROPOSAL, MUTATION, GOAL_WORKFLOW]);
    const okPlan = await full.resolve(goalAutomationRequirements());
    expect(okPlan.engineId).toBe(CAPABILITY_RESOLVER_ENGINE_ID);
    expect(okPlan.missing).toEqual([]);
  });

  it('readonly mutation offer cannot satisfy writable mutation requirement', async () => {
    const resolver = new CapabilityResolver([
      PROPOSAL,
      { ...MUTATION, readonly: true },
      CLOUD,
    ]);
    const plan = resolver.resolveFor(
      'knowledge.generate',
      knowledgeWriteRequirements('web'),
      'web',
    );
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind)).toEqual(['tool.mutation']);
  });
});
