/**
 * AI Electron composition root — desktop lane host runtime.
 * AI Electron 组合根 —— desktop lane 宿主运行时。
 *
 * This is the desktop-lane composition root for AI. The desktop main runtime
 * owns the per-profile PowerSync database (IElectronDatabase), so it selects the
 * PowerSync persistence adapters, builds the service runtime adapters from the
 * host-owned `aiServiceRuntimeConfig`, wires the four host capability ports
 * (knowledge-note persistence, knowledge source, analytics read, automation tool
 * executor), assembles the transport-neutral `AIModuleInstance`, and turns it
 * into an already-bound `IElectronModule`-compatible handle via
 * `createAIElectronModule`. Stream/session handling stays in the Electron
 * transport file.
 *
 * 这是 AI 在 desktop lane 的组合根。桌面主进程运行时拥有按 profile 划分的
 * PowerSync 数据库（IElectronDatabase），因此由它选择 PowerSync 持久化适配器、
 * 依据宿主持有的 `aiServiceRuntimeConfig` 构建服务 runtime 适配器、接好四个宿主
 * 能力 ports（knowledge-note persistence、knowledge source、analytics read、
 * automation tool executor）、装配与传输无关的 `AIModuleInstance`，再通过
 * `createAIElectronModule` 变成已绑定 instance 的、兼容 `IElectronModule` 的
 * handle。流/会话处理保留在 Electron 传输文件中。
 *
 * The service adapters (chat execution, goal planning, knowledge ingestion /
 * query / note generation, analytics query, agent runtime, evaluation report)
 * are constructed here from the runtime config — the historical assembly that
 * used to live inside the electron module's register() — and the host ports are
 * the exact instances owned by the desktop composition root. When no runtime
 * config is provided, the optional service ports stay undefined (matching the
 * historical behavior exactly).
 *
 * 服务适配器（chat execution、goal planning、knowledge ingestion/query/note
 * generation、analytics query、agent runtime、evaluation report）在这里依据
 * runtime config 构建——这就是历史上位于 electron 模块 register() 内部的装配——
 * 而宿主 ports 是 desktop 组合根拥有的确切实例。未提供 runtime config 时，可选
 * 服务 ports 保持 undefined（与历史行为完全一致）。
 *
 * Assembly order (plan §3.3) — MUST be: runtime db → AI PowerSync repository set
 * → service runtime adapters (from config) + host ports → AI instance → Electron
 * module.
 *
 * 组装顺序（计划 §3.3）必须为：runtime db → AI PowerSync 仓储集合 → 服务 runtime
 * 适配器（来自 config）+ 宿主 ports → AI instance → Electron module。
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  AIEvaluationReportFileAdapter,
  AIServiceAgentRuntimeAdapter,
  AIServiceAnalyticsQueryAdapter,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  AIServiceKnowledgeQueryAdapter,
  createAIModule,
  createAIPowerSyncRepositories,
  type AIServiceRuntimeConfig,
} from '@memoflow/ai';
import type {
  IAnalyticsReadPort,
  IAIAutomationToolExecutorPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
} from '@memoflow/ai/ports';
import {
  createAIElectronModule,
  type AIElectronModuleDef,
} from '@memoflow/ai/electron';

/**
 * Dependencies the AI composer needs from the desktop host runtime.
 * AI composer 需要从 desktop 宿主运行时拿到的依赖。
 */
export interface ComposeAIElectronDependencies {
  /** PowerSync-backed desktop business database owned by the desktop main runtime. 桌面主进程持有的 PowerSync 桌面业务数据库。 */
  readonly db: IElectronDatabase;
  /** Host-owned knowledge-note persistence port (Local Vault writes). 宿主持有的 knowledge-note persistence port（Local Vault 写入）。 */
  readonly knowledgeNotePersistence: IKnowledgeNotePersistencePort;
  /** Host-owned knowledge source port (Local Vault reads). 宿主持有的 knowledge source port（Local Vault 读取）。 */
  readonly knowledgeSourcePort: IKnowledgeSourcePort;
  /** Host-owned analytics read port (dashboard aggregation + Goal/Task analytics). 宿主持有的 analytics read port（dashboard 聚合 + Goal/Task analytics）。 */
  readonly analyticsReadPort: IAnalyticsReadPort;
  /** Host-owned automation tool executor port (Goal/Task/Reminder automation). 宿主持有的 automation tool executor port（Goal/Task/Reminder 自动化）。 */
  readonly automationToolExecutor: IAIAutomationToolExecutorPort;
  /** Host-read ai-service runtime config; when absent the optional service ports stay undefined. 宿主导出的 ai-service runtime config；缺省时可选服务 ports 保持 undefined。 */
  readonly aiServiceRuntimeConfig?: AIServiceRuntimeConfig;
}

/**
 * Composes the AI Electron module handle from the desktop runtime's database.
 * 用 desktop runtime 的数据库组装 AI Electron module handle。
 *
 * Wire order:
 * 1. createAIPowerSyncRepositories(db) — select the PowerSync adapters
 *    (conversation / provider config / knowledge index / execution log).
 * 2. Build the service runtime adapters from aiServiceRuntimeConfig (when
 *    present): chat execution, goal planning, goal automation, knowledge
 *    ingestion / query / note generation, analytics query, agent runtime;
 *    always the evaluation-report file adapter.
 * 3. createAIModule({ ...set, host ports, service ports }) — assemble the
 *    transport-neutral AI instance.
 * 4. createAIElectronModule({ instance }) — bind the instance to an
 *    IElectronModule handle (transport + stream/session lifecycle only).
 *
 * 接线顺序：
 * 1. createAIPowerSyncRepositories(db) —— 选择 PowerSync 适配器（conversation /
 *    provider config / knowledge index / execution log）。
 * 2. 提供 aiServiceRuntimeConfig 时构建服务 runtime 适配器：chat execution、goal
 *    planning、goal automation、knowledge ingestion/query/note generation、
 *    analytics query、agent runtime；evaluation-report 文件适配器始终构建。
 * 3. createAIModule({ ...set, host ports, service ports }) —— 装配与传输无关的 AI 实例。
 * 4. createAIElectronModule({ instance }) —— 把实例绑定到 IElectronModule handle
 *    （只负责 transport 与流/会话生命周期）。
 *
 * The returned handle is already fully bound: ElectronBootstrapper.register()
 * must be called with it once, and its destroy() aborts active streams and
 * disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ElectronBootstrapper.register() 必须恰好注册一次，
 * 其 destroy() 会中止活动流并 dispose 所属实例。
 *
 * @param dependencies - ComposeAIElectronDependencies with the runtime Electron database and host ports.
 * @returns AIElectronModuleDef — an already-bound IElectronModule-compatible handle.
 */
export function composeAI(dependencies: ComposeAIElectronDependencies): AIElectronModuleDef {
  const { conversationRepository, providerConfigRepository, knowledgeIndexRepository, executionLogPort } =
    createAIPowerSyncRepositories(dependencies.db);

  const config = dependencies.aiServiceRuntimeConfig;

  const instance = createAIModule({
    conversationRepository,
    providerConfigRepository,
    knowledgeIndexRepository,
    executionLogPort,
    chatExecutionPort: config ? new AIServiceChatExecutionAdapter(config) : undefined,
    goalPlanningPort: config ? new AIServiceGoalPlanningAdapter(config) : undefined,
    goalAutomationPlanningPort: config ? new AIServiceGoalAutomationAdapter(config) : undefined,
    automationToolExecutorPort: dependencies.automationToolExecutor,
    knowledgeIngestionPort: config ? new AIServiceKnowledgeIngestionAdapter(config) : undefined,
    knowledgeQueryPort: config ? new AIServiceKnowledgeQueryAdapter(config) : undefined,
    knowledgeNoteGenerationPort: config
      ? new AIServiceKnowledgeNoteGenerationAdapter(config)
      : undefined,
    analyticsQueryPort: config ? new AIServiceAnalyticsQueryAdapter(config) : undefined,
    agentRuntimePort: config ? new AIServiceAgentRuntimeAdapter(config) : undefined,
    evaluationReportPort: new AIEvaluationReportFileAdapter(),
    knowledgeNotePersistence: dependencies.knowledgeNotePersistence,
    knowledgeSourcePort: dependencies.knowledgeSourcePort,
    analyticsReadPort: dependencies.analyticsReadPort,
  });

  return createAIElectronModule({ instance });
}
