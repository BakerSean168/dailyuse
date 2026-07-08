/**
 * AI Module — PowerSync Composition Root convenience factory.
 * AI 模块 — PowerSync 组合根便捷工厂。
 *
 * Thin helper that picks PowerSync adapters and delegates to `createAIModule`.
 * 仅选择 PowerSync 适配器后委托给 `createAIModule`。
 *
 * @see {@link createAIModule} for the canonical composition root.
 */

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type {
  IAIExecutionLogPort,
  IAIEvaluationReportPort,
  IAIAutomationToolExecutorPort,
  IAgentRuntimePort,
  IAnalyticsQueryPort,
  IAnalyticsReadPort,
  IAIChatExecutionPort,
  IGoalAutomationPlanningPort,
  IGoalPlanningPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeQueryPort,
  IKnowledgeNoteGenerationPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
} from '../application/ports';
import { createAIModule, type AIModuleInstance, type AIModuleDependencies } from './ai.module';
import {
  AIExecutionLogPowerSyncAdapter,
  AIKnowledgeIndexPowerSyncRepository,
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
} from './adapters/powersync';

/**
 * Options for the PowerSync convenience factory.
 * PowerSync 便捷工厂的选项。
 */
export interface AIModulePowerSyncOptions {
  readonly chatExecutionPort?: IAIChatExecutionPort;
  readonly goalPlanningPort?: IGoalPlanningPort;
  readonly goalAutomationPlanningPort?: IGoalAutomationPlanningPort;
  readonly automationToolExecutorPort?: IAIAutomationToolExecutorPort;
  readonly knowledgeIndexRepository?: IKnowledgeIndexRepository;
  readonly knowledgeIngestionPort?: IKnowledgeIngestionPort;
  readonly knowledgeQueryPort?: IKnowledgeQueryPort;
  readonly knowledgeNoteGenerationPort?: IKnowledgeNoteGenerationPort;
  readonly analyticsQueryPort?: IAnalyticsQueryPort;
  readonly agentRuntimePort?: IAgentRuntimePort;
  readonly executionLogPort?: IAIExecutionLogPort;
  readonly evaluationReportPort?: IAIEvaluationReportPort;
  readonly knowledgeNotePersistence?: IKnowledgeNotePersistencePort;
  readonly knowledgeSourcePort?: IKnowledgeSourcePort;
  readonly analyticsReadPort?: IAnalyticsReadPort;
  readonly getKnowledgeNoteSubpath?: (identityId: string) => Promise<string>;
  readonly runtimeContributions?: AIModuleDependencies['runtimeContributions'];
}

/**
 * Creates a fully wired AI module backed by PowerSync repositories.
 * 创建一个完全接线的、使用 PowerSync 仓储的 AI 模块实例。
 */
export function createAIPowerSyncModule(
  db: IElectronDatabase,
  options?: AIModulePowerSyncOptions,
): AIModuleInstance {
  return createAIModule({
    conversationRepository: new PowerSyncAIConversationRepository(db),
    providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    chatExecutionPort: options?.chatExecutionPort,
    goalPlanningPort: options?.goalPlanningPort,
    goalAutomationPlanningPort: options?.goalAutomationPlanningPort,
    automationToolExecutorPort: options?.automationToolExecutorPort,
    knowledgeIndexRepository:
      options?.knowledgeIndexRepository ?? new AIKnowledgeIndexPowerSyncRepository(db),
    knowledgeIngestionPort: options?.knowledgeIngestionPort,
    knowledgeQueryPort: options?.knowledgeQueryPort,
    knowledgeNoteGenerationPort: options?.knowledgeNoteGenerationPort,
    analyticsQueryPort: options?.analyticsQueryPort,
    agentRuntimePort: options?.agentRuntimePort,
    executionLogPort: options?.executionLogPort ?? new AIExecutionLogPowerSyncAdapter(db),
    evaluationReportPort: options?.evaluationReportPort,
    knowledgeNotePersistence: options?.knowledgeNotePersistence,
    knowledgeSourcePort: options?.knowledgeSourcePort,
    analyticsReadPort: options?.analyticsReadPort,
    getKnowledgeNoteSubpath: options?.getKnowledgeNoteSubpath,
    runtimeContributions: options?.runtimeContributions,
  });
}

export {
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
  AIKnowledgeIndexPowerSyncRepository,
  AIExecutionLogPowerSyncAdapter,
};
