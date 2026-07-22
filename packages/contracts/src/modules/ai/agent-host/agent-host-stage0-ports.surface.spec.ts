import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 305/311/314/318/320/322: ADR-035 Agent Host ports.
 * Stage 0 shapes stay frozen. Production allows:
 *   - DirectTurnEngine (ITurnEnginePort / engine.direct_turn) — residual 314/316
 *   - ReadonlyAnalysisTurnEngine (ITurnEnginePort / engine.pi_readonly) — residual 341
 *   - AssistantFacade (IAssistantFacadePort) — residual 343
 *   - LangGraphWorkflowAdapter (IWorkflowAdapterPort wrapping IAgentRuntimePort) — residual 318
 *   - ProposalKernel (IProposalKernelPort / tool.proposal lifecycle) — residual 320
 *   - CapabilityResolver (ICapabilityResolverPort / fail-closed resolve) — residual 322
 *   - CustomModelGateway (IModelGatewayPort / openai_compatible) — residual 337
 * Multi-engine Turn Engine isolation still partial (no second Turn Engine production class).
 */
describe('agent-host stage-0 ports freeze surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const ports = readFileSync(resolve(__dirname, 'ports.ts'), 'utf8');
  const capabilities = readFileSync(resolve(__dirname, 'capabilities.ts'), 'utf8');

  it('freezes Turn Engine / Capability / Workflow adapter port shapes', () => {
    expect(ports).toContain('export interface ITurnEnginePort');
    expect(ports).toContain('export interface ICapabilityResolverPort');
    expect(ports).toContain('export interface IWorkflowAdapterPort');
    expect(ports).toContain('export interface IModelGatewayPort');
    expect(ports).toContain('export interface IAssistantFacadePort');
    expect(ports).toContain('export type AssistantCommand');
    expect(ports).toContain('export type AssistantClientCommand');
    expect(ports).toContain('export interface IProposalKernelPort');
    expect(ports).toContain('Stage 0 freezes shapes only');
    expect(ports).toContain('startTurn(input: {');
    expect(ports).toContain("status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'");
  });

  it('declares multi-engine capability kinds without silent expansion', () => {
    expect(capabilities).toContain("'engine.direct_turn'");
    expect(capabilities).toContain("'engine.langgraph_workflow'");
    expect(capabilities).toContain("'engine.pi_readonly'");
    expect(capabilities).toContain("'engine.cli_readonly'");
    expect(capabilities).toContain('export function resolveRunPlan');
    expect(capabilities).toContain('Fail closed');
    expect(capabilities).toContain("engineId: missing.length > 0 ? 'none' : input.engineId");
  });

  it('allows DirectTurn + LangGraphWorkflow + ProposalKernel + CapabilityResolver as production Host adapters', () => {
    const roots = [
      resolve(repoRoot, 'packages/ai/src'),
      resolve(repoRoot, 'apps/ai-service'),
      resolve(repoRoot, 'apps/api/src'),
      resolve(repoRoot, 'apps/desktop/src'),
    ];
    const allowedTurnEngine = 'packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts';
    const allowedReadonlyTurnEngine =
      'packages/ai/src/server/infrastructure/turn-engine/readonly-analysis.turn-engine.ts';
    const allowedWorkflow =
      'packages/ai/src/server/infrastructure/workflow/langgraph-workflow.adapter.ts';
    const allowedProposal =
      'packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts';
    const allowedCapability =
      'packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts';
    const allowedModelGateway =
      'packages/ai/src/server/infrastructure/model-gateway/custom-model.gateway.ts';
    const allowedAssistantFacade =
      'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts';
    const forbiddenMarkers = [] as const;
    const turnEngines: string[] = [];
    const workflowAdapters: string[] = [];
    const proposalKernels: string[] = [];
    const capabilityResolvers: string[] = [];
    const modelGateways: string[] = [];
    const assistantFacades: string[] = [];
    const forbidden: string[] = [];
    const skipDirs = new Set(['dist', 'node_modules', '__tests__', 'tests']);

    function walk(dir: string) {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          if (skipDirs.has(entry.name)) continue;
          walk(full);
          continue;
        }
        if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
        if (entry.name.includes('.spec.') || entry.name.includes('.test.')) continue;
        if (entry.name.endsWith('.surface.spec.ts')) continue;
        if (entry.name.includes('.harness.spec.')) continue;
        const source = readFileSync(full, 'utf8');
        if (full.endsWith(`${'agent-host'}/ports.ts`)) continue;
        if (source.includes('export interface ITurnEnginePort')) continue;
        const rel = full.replace(repoRoot + '/', '');
        if (source.includes('implements ITurnEnginePort')) {
          turnEngines.push(rel);
        }
        if (source.includes('implements IWorkflowAdapterPort')) {
          workflowAdapters.push(rel);
        }
        if (source.includes('implements IProposalKernelPort')) {
          proposalKernels.push(rel);
        }
        if (source.includes('implements ICapabilityResolverPort')) {
          capabilityResolvers.push(rel);
        }
        if (source.includes('implements IModelGatewayPort')) {
          modelGateways.push(rel);
        }
        if (source.includes('implements IAssistantFacadePort')) {
          assistantFacades.push(rel);
        }
        if (forbiddenMarkers.some((marker) => source.includes(marker))) {
          forbidden.push(rel);
        }
      }
    }

    for (const root of roots) walk(root);
    expect(turnEngines.sort()).toEqual([allowedTurnEngine, allowedReadonlyTurnEngine].sort());
    expect(workflowAdapters).toEqual([allowedWorkflow]);
    expect(proposalKernels).toEqual([allowedProposal]);
    expect(capabilityResolvers).toEqual([allowedCapability]);
    expect(modelGateways).toEqual([allowedModelGateway]);
    expect(assistantFacades).toEqual([allowedAssistantFacade]);
    expect(forbidden).toEqual([]);

    const direct = readFileSync(resolve(repoRoot, allowedTurnEngine), 'utf8');
    expect(direct).toContain("DIRECT_TURN_ENGINE_ID = 'engine.direct_turn'");
    expect(direct).toContain('export class DirectTurnEngine implements ITurnEnginePort');

    const readonlyTurn = readFileSync(resolve(repoRoot, allowedReadonlyTurnEngine), 'utf8');
    expect(readonlyTurn).toContain("PI_READONLY_TURN_ENGINE_ID = 'engine.pi_readonly'");
    expect(readonlyTurn).toContain(
      'export class ReadonlyAnalysisTurnEngine implements ITurnEnginePort',
    );
    expect(readonlyTurn).toContain('IModelGatewayPort');
    expect(readonlyTurn).toContain('cannot execute tools');
    expect(readonlyTurn).not.toContain("kind: 'tool.mutation'");

    const workflow = readFileSync(resolve(repoRoot, allowedWorkflow), 'utf8');
    expect(workflow).toContain("LANGGRAPH_WORKFLOW_ADAPTER_ID = 'workflow.langgraph'");
    expect(workflow).toContain('export class LangGraphWorkflowAdapter implements IWorkflowAdapterPort');
    expect(workflow).toContain('IAgentRuntimePort');
    expect(workflow).toContain('assertsNoMutationOffers');
    const offeredKindsBlock = workflow.match(
      /const OFFERED_KINDS = \[([\s\S]*?)\] as const/,
    )?.[1];
    expect(offeredKindsBlock).toBeTruthy();
    expect(offeredKindsBlock).toContain("'workflow.goal'");
    expect(offeredKindsBlock).toContain("'workflow.research'");
    expect(offeredKindsBlock).toContain("'engine.langgraph_workflow'");
    expect(offeredKindsBlock).not.toContain('tool.mutation');
    expect(offeredKindsBlock).not.toContain('tool.proposal');

    const proposal = readFileSync(resolve(repoRoot, allowedProposal), 'utf8');
    expect(proposal).toContain("PROPOSAL_KERNEL_PROVIDER_ID = 'proposal-kernel'");
    expect(proposal).toContain('export class ProposalKernel implements IProposalKernelPort');
    expect(proposal).toContain("kind: 'tool.proposal'");
    expect(proposal).toContain('executeApproved');
    expect(proposal).not.toContain("kind: 'tool.mutation'");

    const capability = readFileSync(resolve(repoRoot, allowedCapability), 'utf8');
    expect(capability).toContain("CAPABILITY_RESOLVER_ENGINE_ID = 'capability-resolver'");
    expect(capability).toContain('export class CapabilityResolver implements ICapabilityResolverPort');
    expect(capability).toContain('resolveRunPlan');
    expect(capability).toContain('Never silently expands');

    const modelGateway = readFileSync(resolve(repoRoot, allowedModelGateway), 'utf8');
    expect(modelGateway).toContain("CUSTOM_MODEL_GATEWAY_ID = 'model.openai_compatible'");
    expect(modelGateway).toContain(
      'export class CustomModelGateway implements IModelGatewayPort',
    );
    expect(modelGateway).toContain('credentialsInEvents: false');
    expect(modelGateway).toContain('modelBindingId');
    expect(modelGateway).not.toContain("kind: 'tool.mutation'");

    const assistantFacade = readFileSync(resolve(repoRoot, allowedAssistantFacade), 'utf8');
    expect(assistantFacade).toContain("ASSISTANT_FACADE_ID = 'assistant.facade'");
    expect(assistantFacade).toContain(
      'export class AssistantFacade implements IAssistantFacadePort',
    );
    expect(assistantFacade).toContain('executeApproved');
    expect(assistantFacade).toContain('never executeApproved');
    expect(assistantFacade).not.toContain('executeApproved(');
  });

  it('points multi-engine conformance at the residual 309 harness (doubles + DirectTurnEngine note)', () => {
    const harness = resolve(
      repoRoot,
      'packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-multi-engine-turn-conformance.harness.spec.ts',
    );
    expect(existsSync(harness)).toBe(true);
    const harnessText = readFileSync(harness, 'utf8');
    expect(harnessText).toContain('engine.direct_turn');
    expect(harnessText).toContain('engine.langgraph_workflow');
    expect(harnessText).toContain('createConformanceTurnEngine');
    expect(harnessText).toContain('ITurnEnginePort');
    expect(harnessText).toContain('ReadonlyAnalysisTurnEngine');
    expect(harnessText).toContain('engine.pi_readonly');
    expect(harnessText).toContain('multi-engine');
  });
});
