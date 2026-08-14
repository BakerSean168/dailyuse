/**
 * AI Module — PowerSync Composition Root convenience factory.
 * AI 模块 — PowerSync 组合根便捷工厂。
 *
 * Host-facing ingredient seams for the Electron lane: the repository set type,
 * the repository factory and the delegating convenience module factory.
 * Optional host ports (chat execution, goal planning, knowledge ingestion,
 * analytics, agent runtime, etc.) stay OUT of the set — composers pass them
 * explicitly.
 *
 * 面向宿主的 Electron lane 组合原料：仓储集合类型、仓储工厂与委托式便捷模块工厂。
 * 可选宿主 Port（chat execution、goal planning、knowledge ingestion、analytics、
 * agent runtime 等）保持在集合之外——由 composer 显式传入。
 *
 * @see {@link createAIModule} for the canonical composition root.
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
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
import type { IAIConversationRepository } from '../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../domain/repositories/i-ai-provider-config-repository';

/**
 * Host-facing AI repository set for the PowerSync lane.
 * 面向宿主暴露的 PowerSync lane AI 仓储集合。
 *
 * Contains the four persistence ports the PowerSync lane owns: conversation,
 * provider config, knowledge index and execution log. Host capability ports
 * (chat execution, goal planning, knowledge ingestion/query/generation,
 * analytics, agent runtime, automation tool executor, evaluation report, etc.)
 * are intentionally NOT part of the set — they are host-owned ports passed to
 * `createAIModule` explicitly.
 *
 * 包含 PowerSync lane 自有的四个持久化 Port：conversation、provider config、
 * knowledge index 与 execution log。宿主能力 Port（chat execution、goal
 * planning、knowledge ingestion/query/generation、analytics、agent runtime、
 * automation tool executor、evaluation report 等）刻意不在集合中——它们是宿主
 * 拥有的 Port，由调用方显式传给 `createAIModule`。
 */
export interface AIPowerSyncRepositorySet {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly knowledgeIndexRepository: IKnowledgeIndexRepository;
  readonly executionLogPort: IAIExecutionLogPort;
}

/**
 * Creates PowerSync-backed AI repositories.
 * 创建基于 PowerSync 的 AI 仓储。
 *
 * Electron counterpart of the Prisma assembly: selects the PowerSync adapters
 * and returns the repository Port shape. Host capability ports are supplied by
 * the composer, not here.
 *
 * 与 Prisma 装配对应的 Electron 版本：选择 PowerSync 适配器并返回仓储 Port 形状。
 * 宿主能力 Port 由 composer 提供，不在此处。
 *
 * @param db - Electron database adapter owned by the desktop main runtime. 桌面主进程持有的 Electron 数据库适配器。
 * @returns Repository set backed by the PowerSync adapters.
 *          返回基于 PowerSync 适配器的仓储集合。
 */
export function createAIPowerSyncRepositories(db: IElectronDatabase): AIPowerSyncRepositorySet {
  return {
    conversationRepository: new PowerSyncAIConversationRepository(db),
    providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    knowledgeIndexRepository: new AIKnowledgeIndexPowerSyncRepository(db),
    executionLogPort: new AIExecutionLogPowerSyncAdapter(db),
  };
}

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
  readonly runtimeContributions?: AIModuleDependencies['runtimeContributions'];
}

/**
 * Creates a fully wired AI module backed by PowerSync repositories.
 * 创建一个完全接线的、使用 PowerSync 仓储的 AI 模块实例。
 *
 * Convenience root kept for in-package reuse / rollback; delegates to
 * createAIPowerSyncRepositories() plus the canonical module assembly.
 *
 * 便捷组合根，保留用于包内复用与回滚；委托给
 * createAIPowerSyncRepositories() 与规范化模块装配。
 *
 * @param db - Electron database adapter owned by the desktop main runtime. 桌面主进程持有的 Electron 数据库适配器。
 * @param options - Host capability ports and optional runtime contributions.
 *                  宿主能力 Port 与可选运行时贡献。
 * @returns AIModuleInstance with PowerSync-backed repositories attached.
 *          返回挂载 PowerSync 仓储的 AI 模块实例。
 */
export function createAIPowerSyncModule(
  db: IElectronDatabase,
  options?: AIModulePowerSyncOptions,
): AIModuleInstance {
  const repositories = createAIPowerSyncRepositories(db);

  return createAIModule({
    conversationRepository: repositories.conversationRepository,
    providerConfigRepository: repositories.providerConfigRepository,
    chatExecutionPort: options?.chatExecutionPort,
    goalPlanningPort: options?.goalPlanningPort,
    goalAutomationPlanningPort: options?.goalAutomationPlanningPort,
    automationToolExecutorPort: options?.automationToolExecutorPort,
    knowledgeIndexRepository:
      options?.knowledgeIndexRepository ?? repositories.knowledgeIndexRepository,
    knowledgeIngestionPort: options?.knowledgeIngestionPort,
    knowledgeQueryPort: options?.knowledgeQueryPort,
    knowledgeNoteGenerationPort: options?.knowledgeNoteGenerationPort,
    analyticsQueryPort: options?.analyticsQueryPort,
    agentRuntimePort: options?.agentRuntimePort,
    executionLogPort: options?.executionLogPort ?? repositories.executionLogPort,
    evaluationReportPort: options?.evaluationReportPort,
    knowledgeNotePersistence: options?.knowledgeNotePersistence,
    knowledgeSourcePort: options?.knowledgeSourcePort,
    analyticsReadPort: options?.analyticsReadPort,
    runtimeContributions: options?.runtimeContributions,
  });
}
