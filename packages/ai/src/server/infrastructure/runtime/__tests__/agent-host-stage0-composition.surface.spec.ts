/**
 * Residual 311/314: ADR-035 Agent Host composition.
 * Runtime capability offers never auto-emit engine.* labels.
 * Residual 314 wires the first production DirectTurnEngine on the module instance
 * without registering Workflow/Capability/Proposal ports or silent engine offers.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAgentRuntimeCapabilityOffers } from '../ai-runtime';

describe('agent-host stage-0 composition surface', () => {
  it('buildAgentRuntimeCapabilityOffers never emits engine.* labels', () => {
    const empty = buildAgentRuntimeCapabilityOffers({});
    expect(empty.every((offer) => !offer.kind.startsWith('engine.'))).toBe(true);
    expect(empty.some((offer) => offer.kind === 'tool.proposal')).toBe(true);

    const withKnowledge = buildAgentRuntimeCapabilityOffers({
      knowledgeNoteUseCase: {} as never,
    });
    expect(withKnowledge.every((offer) => !offer.kind.startsWith('engine.'))).toBe(true);
    expect(withKnowledge.some((offer) => offer.kind === 'tool.mutation')).toBe(true);
    expect(withKnowledge.some((offer) => offer.kind === 'context.cloud_rag')).toBe(true);

    const withGoal = buildAgentRuntimeCapabilityOffers({
      automationToolExecutorPort: {} as never,
    });
    expect(withGoal.every((offer) => !offer.kind.startsWith('engine.'))).toBe(true);
    expect(withGoal.some((offer) => offer.kind === 'workflow.goal')).toBe(true);
  });

  it('ai-runtime source never hard-codes engine.direct_turn / langgraph as silent offers', () => {
    const runtime = readFileSync(resolve(__dirname, '../ai-runtime.ts'), 'utf8');
    expect(runtime).toContain('buildAgentRuntimeCapabilityOffers');
    expect(runtime).toContain("kind: 'tool.proposal'");
    expect(runtime).not.toMatch(/kind:\s*'engine\.direct_turn'/);
    expect(runtime).not.toMatch(/kind:\s*'engine\.langgraph_workflow'/);
    expect(runtime).not.toMatch(/kind:\s*'engine\.pi_readonly'/);
    expect(runtime).not.toMatch(/kind:\s*'engine\.cli_readonly'/);
  });

  it('ai.module wires DirectTurnEngine only (no Workflow/Capability/Proposal ports)', () => {
    const moduleSource = readFileSync(resolve(__dirname, '../../ai.module.ts'), 'utf8');
    expect(moduleSource).toContain('createDirectProviderAIRuntime');
    expect(moduleSource).toContain('DirectTurnEngine');
    expect(moduleSource).toContain('turnEngine');
    expect(moduleSource).toContain('ITurnEnginePort');
    expect(moduleSource).not.toContain('IWorkflowAdapterPort');
    expect(moduleSource).not.toContain('ICapabilityResolverPort');
    expect(moduleSource).not.toContain('IProposalKernelPort');
    expect(moduleSource).not.toContain('implements IWorkflowAdapterPort');
    expect(moduleSource).not.toContain('implements ICapabilityResolverPort');
    expect(moduleSource).not.toContain('implements IProposalKernelPort');
  });
});
