import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Historical ADR-034/035 documentation consistency while the legacy runtime
 * still exists during the ADR-050 decisive rewrite. The old Host plan is
 * archived and must never be restored to docs/plan/active just to satisfy this
 * characterization test.
 */
describe('archived ADR-035 / ADR-034 product AI docs boundary', () => {
  const repoRoot = resolve(__dirname, '../../../../../../../');
  const aiProduct = readFileSync(resolve(repoRoot, 'docs/product/modules/ai.md'), 'utf8');
  const aiFilesIndex = readFileSync(
    resolve(repoRoot, 'docs/product/module-index/ai-files.md'),
    'utf8',
  );
  const composition = readFileSync(
    resolve(__dirname, './agent-host-stage0-composition.surface.spec.ts'),
    'utf8',
  );
  const capabilityResolver = readFileSync(
    resolve(
      repoRoot,
      'packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts',
    ),
    'utf8',
  );
  const proposalKernel = readFileSync(
    resolve(repoRoot, 'packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts'),
    'utf8',
  );
  const directTurn = readFileSync(
    resolve(repoRoot, 'packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts'),
    'utf8',
  );

  it('product ai.md no longer claims database Repository writes or unimplemented Host adapters', () => {
    expect(aiProduct).not.toContain('当前实现可写入数据库 Repository');
    expect(aiProduct).not.toContain('当前 Web AI 写入数据库 Repository');
    expect(aiProduct).not.toContain('对应 contracts、Host 和 adapters 尚未实现');
    expect(aiProduct).not.toMatch(/Host and adapters 尚未实现/);
    expect(aiProduct).toContain('confirmed-create');
    expect(aiProduct).toContain('DirectTurnEngine');
    expect(aiProduct).toContain('ReadonlyAnalysisTurnEngine');
    expect(aiProduct).toContain('AssistantFacade');
    expect(aiProduct).toContain('dispatch/sse');
    expect(aiProduct).toContain('AIAssistantFacadeController');
    expect(aiProduct).toContain('AIAssistantHttpAdapter');
    expect(aiProduct).toContain('ASSISTANT_DISPATCH');
    expect(aiProduct).toContain('useAssistantDispatch');
    expect(aiProduct).toContain('dispatchAssistant');
    expect(aiProduct).toMatch(/open chat/i);
    expect(aiProduct).toContain('LangGraphWorkflowAdapter');
    expect(aiProduct).toContain('ProposalKernel');
    expect(aiProduct).toContain('CapabilityResolver');
    expect(aiProduct).toContain('CustomModelGateway');
    expect(aiProduct).toContain('fail-closed');
    expect(aiProduct).toContain('ADR-035 Host 当前边界');
    expect(aiProduct).toContain('314–435');
    expect(aiProduct).toContain('Host Proposal 面板');
    expect(aiProduct).toContain('execution receipt');
    expect(aiProduct).toContain('时间线 Artifact');
    expect(aiProduct).toContain('residual 379–387');
    expect(aiProduct).toContain('residual 405–407');
    expect(aiProduct).toContain('residual 409');
    expect(aiProduct).toContain('residual 411');
    expect(aiProduct).toContain('residual 413');
    expect(aiProduct).toContain('residual 415');
    expect(aiProduct).toContain('residual 417');
    expect(aiProduct).toContain('residual 419');
    expect(aiProduct).toContain('residual 421');
    expect(aiProduct).toContain('residual 423');
    expect(aiProduct).toContain('residual 425');
    expect(aiProduct).toContain('residual 427');
    expect(aiProduct).toContain('residual 429');
    expect(aiProduct).toContain('residual 431');
    expect(aiProduct).toContain('residual 433');
    expect(aiProduct).toContain('residual 435');
    expect(aiProduct).toContain('task.create');
    expect(aiProduct).toContain('diagnosticWorkflowStepTiming');
    expect(aiProduct).toContain('formatLangGraphVendorDiagnosticEventLabel');
    expect(aiProduct).toContain('LangGraph UI 泄漏');
    expect(aiProduct).toContain('composeHostWorkbenchTimelineArtifacts');
    expect(aiProduct).toContain('surface isolation');
    expect(aiProduct).toContain('unit driver');
    expect(aiProduct).not.toMatch(/统一助手 UI 工作台[、,].*仍未完成/);
  });

  it('product host boundary claims match production classes', () => {
    expect(directTurn).toContain('export class DirectTurnEngine');
    expect(proposalKernel).toContain('export class ProposalKernel implements IProposalKernelPort');
    expect(capabilityResolver).toContain(
      'export class CapabilityResolver implements ICapabilityResolverPort',
    );
    expect(composition).toContain('capabilityResolver: runtime.capabilityResolver');
    expect(composition).toContain('residual 324');
    expect(composition).toContain('modelGateway: runtime.modelGateway');
    expect(composition).toContain('residual 337');
    expect(composition).toContain('assistantFacade: runtime.assistantFacade');
    expect(composition).toContain('residual 343');
  });
  it('ai-files index points at server/* Host adapters and no legacy infrastructure-server paths', () => {
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/turn-engine/direct-turn.engine.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/turn-engine/readonly-analysis.turn-engine.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/proposal-kernel/proposal.kernel.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/capability-resolver/capability.resolver.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/model-gateway/custom-model.gateway.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
    );
    expect(aiFilesIndex).toContain(
      'packages/ai/src/server/infrastructure/workflow/langgraph-workflow.adapter.ts',
    );
    expect(aiFilesIndex).toContain('packages/ai/src/server/infrastructure/ai.module.ts');
    expect(aiFilesIndex).not.toContain('infrastructure-server');
    expect(aiFilesIndex).not.toContain('domain-server');
    expect(aiFilesIndex).not.toContain('application-server');
    expect(aiFilesIndex).toContain('ADR-035 Agent Host 生产适配');
  });

  it('documents Host UI workbench files and rejects stale "workbench not landed" claim (residual 389)', () => {
    expect(aiFilesIndex).toContain('AIHostProposalPanel.vue');
    expect(aiFilesIndex).toContain('AIHostExecutionReceiptPanel.vue');
    expect(aiFilesIndex).toContain('AIHostTimelineArtifactStrip.vue');
    expect(aiFilesIndex).toContain('hostProposalLifecycle.ts');
    expect(aiFilesIndex).toContain('AIContextPanel.vue');

    const hostPlan = readFileSync(
      resolve(repoRoot, 'docs/plan/archive/2026-07-17-unified-assistant-agent-host.md'),
      'utf8',
    );
    expect(hostPlan).toContain('residual 355–387');
    expect(hostPlan).toContain('Host Proposal UI 工作台已部分落地');
    expect(hostPlan).not.toContain('统一助手 UI / Proposal 工作台产品面仍未落地');
    expect(hostPlan).toMatch(/右侧工作台统一承载 Goal\/Knowledge Artifact 与审批。 \*\*（部分/);
  });
});
