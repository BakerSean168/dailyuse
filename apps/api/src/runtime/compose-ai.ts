/**
 * AI API composition root — API lane host runtime.
 * AI API 组合根 —— API lane 宿主运行时。
 *
 * This is the API-lane composition root for AI. The API runtime owns the shared
 * Prisma client (created in main.ts by connectDatabase()), the instance-bound
 * repository application port, and the resolved repository storage base
 * directory, so it selects the Prisma persistence adapters, resolves the
 * ai-service runtime config, builds the service runtime adapters, wires the
 * five app-local host capability adapters, assembles the transport-neutral
 * `AIModuleInstance`, and turns it into an already-bound `IApiModule`-compatible
 * handle via `createAIApiModule({ instance })`. Stream/session handling stays in
 * the package transport file.
 *
 * 这是 AI 在 API lane 的组合根。API runtime 拥有共享的 Prisma client（由
 * main.ts 的 connectDatabase() 创建）、instance-bound repository application
 * port 与已解析的 repository storage base dir，因此由它选择 Prisma 持久化
 * adapter、解析 ai-service runtime config、构建服务 runtime adapter、接好五个
 * app-local 宿主能力 adapter、装配与传输无关的 `AIModuleInstance`，再通过
 * `createAIApiModule({ instance })` 变成已绑定 instance 的、兼容 `IApiModule`
 * 的 handle。流/会话处理保留在 package 传输文件中。
 *
 * Assembly order (plan §2.3) — MUST be: runtime db → AI Prisma repository set
 * → resolve injected config or lazy `getAIServiceRuntimeConfig()` → five
 * app-local host adapters → eight config-backed AIService adapters (when a
 * config exists) + the always-present evaluation-report adapter → AI instance
 * → API module.
 *
 * 组装顺序（计划 §2.3）必须为：runtime db → AI Prisma 仓储集合 → 解析注入的
 * config 或延迟读取 `getAIServiceRuntimeConfig()` → 五个 app-local 宿主 adapter
 * → 八个 config-backed AIService adapter（存在 config 时）+ 始终存在的
 * evaluation-report adapter → AI instance → API module。
 */

import type { PrismaClient } from '@memoflow/database';
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
  createAIPrismaRepositories,
  getAIServiceRuntimeConfig,
  type AIServiceRuntimeConfig,
} from '@memoflow/ai';
import {
  createAIApiModule,
  type AIApiModuleDef,
} from '@memoflow/ai/api';
import type { RepositoryApplicationPort } from '@memoflow/repository';
import { BackendAutomationToolExecutorAdapter } from '../modules/ai/backend-automation-tool-executor.adapter';
import { ControlledAnalyticsReadAdapter } from '../modules/ai/controlled-analytics-read.adapter';
import { RepositoryKnowledgeIndexStatusAdapter } from '../modules/ai/repository-knowledge-index-status.adapter';
import { RepositoryKnowledgeNotePersistenceAdapter } from '../modules/ai/repository-knowledge-note-persistence.adapter';
import { RepositoryKnowledgeSourceAdapter } from '../modules/ai/repository-knowledge-source.adapter';

/**
 * Dependencies the AI composer needs from the API host runtime.
 * AI composer 需要从 API 宿主运行时拿到的依赖。
 */
export interface ComposeAIDependencies {
  /** Shared API-lane Prisma client owned by apps/api. 由 apps/api 持有的共享 API lane Prisma client。 */
  readonly db: PrismaClient;
  /** The instance-bound application port of the already-composed repository handle. 已组合 repository handle 的 instance-bound application port。 */
  readonly repositoryApiPort: RepositoryApplicationPort;
  /** Host-resolved repository storage base directory. 宿主导出的仓库存储基础目录。 */
  readonly repositoryStorageBaseDir: string;
  /**
   * Optional ai-service runtime config override. When omitted or `undefined`,
   * the composer reads the config lazily via `getAIServiceRuntimeConfig()`;
   * when explicitly `null`, the remote ai-service adapters stay disabled and
   * no environment read happens. This gives tests and alternate hosts a
   * deterministic no-config branch without moving env reads into transport.
   *
   * 可选的 ai-service runtime config 覆盖。省略或为 `undefined` 时由 composer
   * 通过 `getAIServiceRuntimeConfig()` 延迟读取；显式为 `null` 时远端
   * ai-service adapter 保持禁用且不做任何环境读取。这样测试与其他宿主可确定性
   * 覆盖 no-config 分支，同时环境读取不回到 transport。
   */
  readonly aiServiceRuntimeConfig?: AIServiceRuntimeConfig | null;
}

/**
 * Composes the AI API module handle from the API runtime's Prisma client.
 * 用 API runtime 的 Prisma client 组装 AI API module handle。
 *
 * Wire order:
 * 1. createAIPrismaRepositories(db) — select the six Prisma persistence ports
 *    (conversation / provider config / knowledge index / execution log / the
 *    API-only agent + LangGraph checkpoint pair) exactly once.
 * 2. Resolve the ai-service runtime config: use the injected override, or read
 *    lazily when it is omitted; an explicit `null` disables the remote
 *    ai-service adapters without an environment read.
 * 3. Build the five app-local host adapters from db + repositoryApiPort +
 *    repositoryStorageBaseDir (knowledge-note persistence, knowledge source,
 *    knowledge index status, analytics read, automation tool executor).
 * 4. Build the eight config-backed AIService adapters when a config exists
 *    (chat execution, goal planning, goal automation, knowledge ingestion /
 *    query / note generation, analytics query, agent runtime); always the
 *    evaluation-report file adapter.
 * 5. createAIModule({ ...repository set, checkpoint pair, service ports, host
 *    ports }) — assemble the transport-neutral AI instance.
 * 6. createAIApiModule({ instance }) — bind the instance to an IApiModule
 *    handle (transport + lifecycle only).
 *
 * 接线顺序：
 * 1. createAIPrismaRepositories(db) —— 只一次地选择六个 Prisma 持久化 port
 *    （conversation / provider config / knowledge index / execution log /
 *    API-only 的 agent + LangGraph checkpoint pair）。
 * 2. 解析 ai-service runtime config：优先使用注入的覆盖；省略时延迟读取；
 *    显式 `null` 禁用远端 ai-service adapter 且不做环境读取。
 * 3. 用 db + repositoryApiPort + repositoryStorageBaseDir 构建五个 app-local
 *    宿主 adapter（knowledge-note persistence、knowledge source、knowledge
 *    index status、analytics read、automation tool executor）。
 * 4. 存在 config 时构建八个 config-backed AIService adapter（chat execution、
 *    goal planning、goal automation、knowledge ingestion/query/note
 *    generation、analytics query、agent runtime）；evaluation-report 文件
 *    adapter 始终构建。
 * 5. createAIModule({ ...repository set, checkpoint pair, service ports, host
 *    ports }) —— 装配与传输无关的 AI 实例。
 * 6. createAIApiModule({ instance }) —— 把实例绑定到 IApiModule handle
 *    （只负责 transport 与生命周期）。
 *
 * The returned handle is already fully bound: ApiBootstrapper.register() must
 * be called with it once, and its destroy() disposes the owned instance.
 *
 * 返回的 handle 已完全绑定：ApiBootstrapper.register() 必须恰好注册一次，
 * 其 destroy() 会 dispose 所属实例。
 *
 * @param dependencies - ComposeAIDependencies with the runtime Prisma client, repository port and host storage directory.
 * @returns AIApiModuleDef — an already-bound IApiModule-compatible handle.
 */
export function composeAI(dependencies: ComposeAIDependencies): AIApiModuleDef {
  const repositorySet = createAIPrismaRepositories(dependencies.db);

  const config =
    dependencies.aiServiceRuntimeConfig === undefined
      ? getAIServiceRuntimeConfig()
      : dependencies.aiServiceRuntimeConfig;

  const knowledgeNotePersistence = new RepositoryKnowledgeNotePersistenceAdapter(
    dependencies.repositoryApiPort,
  );
  const knowledgeSourcePort = new RepositoryKnowledgeSourceAdapter(
    dependencies.db,
    dependencies.repositoryStorageBaseDir,
  );
  const knowledgeIndexStatusPort = new RepositoryKnowledgeIndexStatusAdapter(
    dependencies.repositoryApiPort,
  );
  const analyticsReadPort = new ControlledAnalyticsReadAdapter(dependencies.db);
  const automationToolExecutorPort = new BackendAutomationToolExecutorAdapter(
    dependencies.db,
    dependencies.repositoryStorageBaseDir,
  );

  const chatExecutionPort = config ? new AIServiceChatExecutionAdapter(config) : undefined;
  const goalPlanningPort = config ? new AIServiceGoalPlanningAdapter(config) : undefined;
  const goalAutomationPlanningPort = config ? new AIServiceGoalAutomationAdapter(config) : undefined;
  const knowledgeIngestionPort = config ? new AIServiceKnowledgeIngestionAdapter(config) : undefined;
  const knowledgeQueryPort = config ? new AIServiceKnowledgeQueryAdapter(config) : undefined;
  const knowledgeNoteGenerationPort = config
    ? new AIServiceKnowledgeNoteGenerationAdapter(config)
    : undefined;
  const analyticsQueryPort = config ? new AIServiceAnalyticsQueryAdapter(config) : undefined;
  const agentRuntimePort = config ? new AIServiceAgentRuntimeAdapter(config) : undefined;
  const evaluationReportPort = new AIEvaluationReportFileAdapter();

  const instance = createAIModule({
    conversationRepository: repositorySet.conversationRepository,
    providerConfigRepository: repositorySet.providerConfigRepository,
    chatExecutionPort,
    goalPlanningPort,
    goalAutomationPlanningPort,
    automationToolExecutorPort,
    knowledgeIndexRepository: repositorySet.knowledgeIndexRepository,
    knowledgeIngestionPort,
    knowledgeQueryPort,
    knowledgeNoteGenerationPort,
    analyticsQueryPort,
    agentRuntimePort,
    executionLogPort: repositorySet.executionLogPort,
    evaluationReportPort,
    agentCheckpointPort: repositorySet.agentCheckpointPort,
    langGraphCheckpointPort: repositorySet.langGraphCheckpointPort,
    knowledgeNotePersistence,
    knowledgeSourcePort,
    knowledgeIndexStatusPort,
    analyticsReadPort,
  });

  return createAIApiModule({ instance });
}
