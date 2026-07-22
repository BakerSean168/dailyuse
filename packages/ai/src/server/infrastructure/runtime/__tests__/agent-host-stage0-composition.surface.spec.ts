/**
 * Residual 311/314/316/318/320: ADR-035 Agent Host composition.
 * Runtime capability offers never auto-emit engine.* labels.
 * Residual 314 wires the first production DirectTurnEngine on the module instance
 * and residual 316 routes open chat send/stream through that engine (no chatExecution bypass).
 * Residual 318 wires LangGraphWorkflowAdapter; residual 320 wires ProposalKernel.
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

  it('ai.module exposes turnEngine + workflowAdapter + proposalKernel without Capability Resolver', () => {
    const moduleSource = readFileSync(resolve(__dirname, '../../ai.module.ts'), 'utf8');
    expect(moduleSource).toContain('createDirectProviderAIRuntime');
    expect(moduleSource).toContain('turnEngine: runtime.turnEngine');
    expect(moduleSource).toContain('workflowAdapter: runtime.workflowAdapter');
    expect(moduleSource).toContain('proposalKernel: runtime.proposalKernel');
    expect(moduleSource).toContain('ITurnEnginePort');
    expect(moduleSource).toContain('IWorkflowAdapterPort');
    expect(moduleSource).toContain('IProposalKernelPort');
    expect(moduleSource).not.toContain('ICapabilityResolverPort');
    expect(moduleSource).not.toContain('implements ICapabilityResolverPort');
    expect(moduleSource).not.toContain('implements IProposalKernelPort');
  });

  it('open chat send/stream use cases route through DirectTurnEngine in both runtimes', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new DirectTurnEngine(');
      expect(source).toContain('new SendAIMessageUseCase(turnEngine');
      expect(source).toContain('new StreamAIMessageUseCase(turnEngine');
      // No parallel bypass: chat use cases no longer take raw IAIChatExecutionPort ctor arity.
      expect(source).not.toMatch(
        /new SendAIMessageUseCase\(\s*conversationRepository[\s\S]*?chatExecutionPort/,
      );
    }
  });


  it('remote runtime wraps agentRuntimePort with LangGraphWorkflowAdapter when present', () => {
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    expect(remote).toContain('new LangGraphWorkflowAdapter(dependencies.agentRuntimePort)');
    expect(remote).toContain('agentRuntimePort');
    expect(remote).toContain('workflowAdapter');
    expect(direct).toContain('workflowAdapter: null');
    // Runtime offers still never silent-emit engine.* from adapter wiring.
    expect(remote).not.toMatch(/buildAgentRuntimeCapabilityOffers[\s\S]*engine\.langgraph_workflow/);
  });

  it('both runtimes construct ProposalKernel and never offer mutation via kernel', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new ProposalKernel()');
      expect(source).toContain('proposalKernel');
    }
    const kernel = readFileSync(
      resolve(__dirname, '../../proposal-kernel/proposal.kernel.ts'),
      'utf8',
    );
    expect(kernel).toContain("PROPOSAL_KERNEL_PROVIDER_ID = 'proposal-kernel'");
    expect(kernel).toContain("kind: 'tool.proposal'");
    expect(kernel).not.toContain("kind: 'tool.mutation'");
    expect(kernel).toContain('export class ProposalKernel implements IProposalKernelPort');
  });

});
