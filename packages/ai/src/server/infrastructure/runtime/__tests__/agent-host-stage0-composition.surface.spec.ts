/**
 * Residual 311/314/316/318/320/322/324: ADR-035 Agent Host composition.
 * Runtime capability offers never auto-emit engine.* labels.
 * Residual 314 wires the first production DirectTurnEngine on the module instance
 * and residual 316 routes open chat send/stream through that engine (no chatExecution bypass).
 * Residual 318 wires LangGraphWorkflowAdapter; residual 320 wires ProposalKernel;
 * residual 322 wires CapabilityResolver (fail-closed, no silent engine.*);
 * residual 324 routes agent start gating through that shared resolver;
 * residual 337 wires CustomModelGateway (IModelGatewayPort) on both runtimes;
 * residual 341 wires ReadonlyAnalysisTurnEngine (second production Turn Engine);
 * residual 343 wires AssistantFacade (unified Host dispatch).
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

  it('ai.module exposes turnEngine + workflowAdapter + proposalKernel + capabilityResolver', () => {
    const moduleSource = readFileSync(resolve(__dirname, '../../ai.module.ts'), 'utf8');
    expect(moduleSource).toContain('createDirectProviderAIRuntime');
    expect(moduleSource).toContain('turnEngine: runtime.turnEngine');
    expect(moduleSource).toContain('readonlyTurnEngine: runtime.readonlyTurnEngine');
    expect(moduleSource).toContain('assistantFacade: runtime.assistantFacade');
    expect(moduleSource).toContain('workflowAdapter: runtime.workflowAdapter');
    expect(moduleSource).toContain('proposalKernel: runtime.proposalKernel');
    expect(moduleSource).toContain('capabilityResolver: runtime.capabilityResolver');
    expect(moduleSource).toContain('modelGateway: runtime.modelGateway');
    expect(moduleSource).toContain('ITurnEnginePort');
    expect(moduleSource).toContain('IWorkflowAdapterPort');
    expect(moduleSource).toContain('IProposalKernelPort');
    expect(moduleSource).toContain('ICapabilityResolverPort');
    expect(moduleSource).toContain('IModelGatewayPort');
    expect(moduleSource).toContain('IAssistantFacadePort');
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

  it('both runtimes construct CapabilityResolver without silent engine offers', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new CapabilityResolver(');
      expect(source).toContain('buildAgentRuntimeCapabilityOffers');
      expect(source).toContain('capabilityResolver');
    }
    const resolver = readFileSync(
      resolve(__dirname, '../../capability-resolver/capability.resolver.ts'),
      'utf8',
    );
    expect(resolver).toContain("CAPABILITY_RESOLVER_ENGINE_ID = 'capability-resolver'");
    expect(resolver).toContain('export class CapabilityResolver implements ICapabilityResolverPort');
    expect(resolver).toContain('resolveRunPlan');
    expect(resolver).toContain('Never silently expands');
  });

  it('agent start gate receives shared CapabilityResolver (residual 324)', () => {
    const runtime = readFileSync(resolve(__dirname, '../ai-runtime.ts'), 'utf8');
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    expect(runtime).toContain('capabilityResolver?: CapabilityResolver');
    expect(runtime).toContain('capabilityResolver ??');
    expect(runtime).toContain('offersOrResolver instanceof CapabilityResolver');
    expect(runtime).toContain('resolveFor(');
    // Both runtimes pass the same capabilityResolver instance into agent runtime service.
    expect(direct).toContain('capabilityResolver,');
    expect(remote).toContain('capabilityResolver,');
    expect(remote).toMatch(/createAgentRuntimeService\([\s\S]*capabilityResolver/);
    expect(direct).toMatch(/createAgentRuntimeService\([\s\S]*capabilityResolver/);
  });


  it('both runtimes construct CustomModelGateway and route direct adapters through it (residual 337)', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new CustomModelGateway()');
      expect(source).toContain('modelGateway');
      expect(source).toContain('new DirectProviderChatExecutionAdapter(modelGateway)');
    }
    const gateway = readFileSync(
      resolve(__dirname, '../../model-gateway/custom-model.gateway.ts'),
      'utf8',
    );
    expect(gateway).toContain("CUSTOM_MODEL_GATEWAY_ID = 'model.openai_compatible'");
    expect(gateway).toContain('export class CustomModelGateway implements IModelGatewayPort');
    expect(gateway).toContain('credentialsInEvents: false');
    expect(gateway).toContain('modelBindingId');
    // Model Gateway is not a mutation surface.
    expect(gateway).not.toContain("kind: 'tool.mutation'");
    expect(gateway).not.toContain("kind: 'engine.");
  });


  it('both runtimes construct ReadonlyAnalysisTurnEngine as second production Turn Engine (residual 341)', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new ReadonlyAnalysisTurnEngine(');
      expect(source).toContain('readonlyTurnEngine');
      expect(source).toContain('modelGateway');
    }
    const engine = readFileSync(
      resolve(__dirname, '../../turn-engine/readonly-analysis.turn-engine.ts'),
      'utf8',
    );
    expect(engine).toContain("PI_READONLY_TURN_ENGINE_ID = 'engine.pi_readonly'");
    expect(engine).toContain('export class ReadonlyAnalysisTurnEngine implements ITurnEnginePort');
    expect(engine).toContain('cannot execute tools');
    expect(engine).not.toContain("kind: 'tool.mutation'");
    // Open chat remains DirectTurnEngine-only.
    expect(direct).toContain('new SendAIMessageUseCase(turnEngine');
    expect(direct).not.toContain('new SendAIMessageUseCase(readonlyTurnEngine');
  });


  it('both runtimes construct AssistantFacade over Host adapters (residual 343)', () => {
    const direct = readFileSync(resolve(__dirname, '../direct-provider-ai.runtime.ts'), 'utf8');
    const remote = readFileSync(resolve(__dirname, '../remote-ai-service.runtime.ts'), 'utf8');
    for (const source of [direct, remote]) {
      expect(source).toContain('new AssistantFacade(');
      expect(source).toContain('assistantFacade');
      expect(source).toMatch(/new AssistantFacade\(\s*turnEngine/);
    }
    const facade = readFileSync(
      resolve(__dirname, '../../assistant-facade/assistant.facade.ts'),
      'utf8',
    );
    expect(facade).toContain("ASSISTANT_FACADE_ID = 'assistant.facade'");
    expect(facade).toContain('export class AssistantFacade implements IAssistantFacadePort');
    expect(facade).toContain('never executeApproved');
    expect(facade).not.toContain('executeApproved(');
    // Open chat default remains DirectTurnEngine use cases, not only facade.
    expect(direct).toContain('new SendAIMessageUseCase(turnEngine');
  });

});
