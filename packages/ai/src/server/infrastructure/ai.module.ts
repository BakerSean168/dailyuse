/**
 * createAIModule — explicit composition root for the AI server runtime.
 * createAIModule —— AI 模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * AI uses the governance module as its reference pattern: one composition root
 * per module, constructor injection only, no hidden service locator.
 * AI 模块以 governance 模块为参考模式：每个模块一个组合根，
 * 仅使用构造器注入，不使用隐藏的服务定位器。
 *
 * @see {@link createGovernanceModule} in @memoflow/governance for the canonical example.
 */

import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../domain';
import type { AIApplicationPort } from '../application';
import type {
  IAgentCheckpointPort,
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
  IKnowledgeIndexStatusPort,
  IKnowledgeIngestionPort,
  IKnowledgeQueryPort,
  IKnowledgeNoteGenerationPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
  ILangGraphCheckpointPort,
} from '../application/ports';

import { createKnowledgeAutoIndexRuntimeContribution } from './runtime/knowledge-auto-index.runtime';
import { createDirectProviderAIRuntime } from './runtime/direct-provider-ai.runtime';
import type { IAssistantFacadePort, ICapabilityResolverPort, IModelGatewayPort, IProposalKernelPort, ITurnEnginePort, IWorkflowAdapterPort } from '@memoflow/contracts/ai';
import { createRemoteAIServiceRuntime } from './runtime/remote-ai-service.runtime';

import type { Result } from '@memoflow/contracts/result';
import type {
  AgentEvent,
  AgentResumePayload,
  AgentRun,
  AgentRunListParams,
  AgentRunResult,
  AgentStartRunRequest,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryAnalyticsReq,
  QueryAnalyticsRes,
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@memoflow/contracts/ai';

// Type-only imports for exported interfaces (runtimes own the concrete classes)
import type {
  GenerateAIGoalUseCase,
  CreateAIProviderUseCase,
  UpdateAIProviderUseCase,
  DeleteAIProviderUseCase,
  GetAIProviderUseCase,
  ListAIProvidersUseCase,
  TestAIProviderConnectionUseCase,
  SetDefaultAIProviderUseCase,
  RefreshAIProviderModelsUseCase,
  SendAIMessageUseCase,
  StreamAIMessageUseCase,
  CreateConversationUseCase,
  GetConversationUseCase,
  ListConversationsUseCase,
  DeleteConversationUseCase,
  UpdateConversationUseCase,
  SyncKnowledgeNotesUseCase,
  ReindexAllKnowledgeUseCase,
  SyncRelevantKnowledgeUseCase,
  SyncNoteByIdUseCase,
  RemoveKnowledgeIndexNoteUseCase,
} from '../application/use-cases';

// ---------------------------------------------------------------------------
// Dependencies — AI 模块服务端运行时向外部索取的全部依赖
// ---------------------------------------------------------------------------

/**
 * Everything the AI server runtime needs from the outside world.
 * AI 模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export interface AIModuleDependencies {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly chatExecutionPort?: IAIChatExecutionPort;
  readonly goalPlanningPort?: IGoalPlanningPort;
  readonly goalAutomationPlanningPort?: IGoalAutomationPlanningPort;
  readonly automationToolExecutorPort?: IAIAutomationToolExecutorPort;
  readonly knowledgeIndexRepository?: IKnowledgeIndexRepository;
  readonly knowledgeIndexStatusPort?: IKnowledgeIndexStatusPort;
  readonly knowledgeIngestionPort?: IKnowledgeIngestionPort;
  readonly knowledgeQueryPort?: IKnowledgeQueryPort;
  readonly knowledgeNoteGenerationPort?: IKnowledgeNoteGenerationPort;
  readonly analyticsQueryPort?: IAnalyticsQueryPort;
  readonly knowledgeSourcePort?: IKnowledgeSourcePort;
  readonly analyticsReadPort?: IAnalyticsReadPort;
  readonly executionLogPort?: IAIExecutionLogPort;
  readonly evaluationReportPort?: IAIEvaluationReportPort;
  readonly agentRuntimePort?: IAgentRuntimePort;

  /**
   * Agent checkpoint persistence is an external collaborator (API / Prisma only).
   * Agent checkpoint 持久化是一个外部协作者（仅 API / Prisma）。
   *
   * Supplied together with `langGraphCheckpointPort` or not at all — the
   * all-or-none invariant is enforced by `createAIModule()`. Desktop supplies
   * neither port.
   *
   * 必须与 `langGraphCheckpointPort` 同时提供或同时缺省——all-or-none invariant
   * 由 `createAIModule()` 强制。Desktop 两者都不提供。
   */
  readonly agentCheckpointPort?: IAgentCheckpointPort;

  /**
   * LangGraph checkpoint persistence is an external collaborator (API / Prisma only).
   * LangGraph checkpoint 持久化是一个外部协作者（仅 API / Prisma）。
   *
   * Supplied together with `agentCheckpointPort` or not at all — the all-or-none
   * invariant is enforced by `createAIModule()`. Desktop supplies neither port.
   *
   * 必须与 `agentCheckpointPort` 同时提供或同时缺省——all-or-none invariant
   * 由 `createAIModule()` 强制。Desktop 两者都不提供。
   */
  readonly langGraphCheckpointPort?: ILangGraphCheckpointPort;

  /**
   * Knowledge-note persistence is an external collaborator.
   * 知识笔记持久化是一个外部协作者。
   *
   * The host application (API / Electron) decides how notes are stored.
   * 宿主应用（API / Electron）决定笔记如何存储。
   */
  readonly knowledgeNotePersistence?: IKnowledgeNotePersistencePort;

  /**
   * Optional runtime side effects to start/stop with the module.
   * 可选的运行时副作用，随模块一起启动/停止。
   */
  readonly runtimeContributions?: AIRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// Runtime contributions — 模块拥有的运行时副作用
// ---------------------------------------------------------------------------

export type AIRuntimeContributionsInput =
  AIModuleRuntimeContribution | readonly AIModuleRuntimeContribution[];

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 */
export interface AIModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

/**
 * Provider config decomposed use cases.
 */
export interface AIProviderServices {
  readonly create: CreateAIProviderUseCase;
  readonly update: UpdateAIProviderUseCase;
  readonly delete: DeleteAIProviderUseCase;
  readonly get: GetAIProviderUseCase;
  readonly list: ListAIProvidersUseCase;
  readonly testConnection: TestAIProviderConnectionUseCase;
  readonly setDefault: SetDefaultAIProviderUseCase;
  readonly refreshModels: RefreshAIProviderModelsUseCase;
}

/**
 * Conversation use cases (canonical host path).
 */
export interface AIConversationServices {
  readonly createConversation: CreateConversationUseCase;
  readonly getConversation: GetConversationUseCase;
  readonly listConversations: ListConversationsUseCase;
  readonly deleteConversation: DeleteConversationUseCase;
  readonly updateConversation: UpdateConversationUseCase;
}

/**
 * Chat decomposed use cases.
 */
export interface AIChatServices {
  readonly send: SendAIMessageUseCase;
  readonly stream: StreamAIMessageUseCase;
}

/**
 * Knowledge index decomposed use cases.
 */
export interface AIKnowledgeIndexServices {
  readonly syncResources: SyncKnowledgeNotesUseCase;
  readonly reindexAll: ReindexAllKnowledgeUseCase;
  readonly syncRelevant: SyncRelevantKnowledgeUseCase;
  readonly syncById: SyncNoteByIdUseCase;
  readonly removeById: RemoveKnowledgeIndexNoteUseCase;
}

/**
 * Knowledge query decomposed use cases.
 */
export interface AIKnowledgeQueryServices {
  readonly isAvailable: boolean;
  readonly query: {
    execute(req: QueryKnowledgeReq, cx: ExecutionContext): Promise<Result<QueryKnowledgeRes>>;
  };
  readonly expand: {
    execute(req: ExpandKnowledgeReq, cx: ExecutionContext): Promise<Result<ExpandKnowledgeRes>>;
  };
  readonly reindex: {
    execute(req: ReindexKnowledgeReq, cx: ExecutionContext): Promise<Result<ReindexKnowledgeRes>>;
  };
}

export interface AIKnowledgeNoteService {
  readonly isAvailable: boolean;
  createKnowledgeNote(
    req: CreateKnowledgeNoteReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateKnowledgeNoteRes>>;
}

export interface AIAnalyticsQueryService {
  readonly isAvailable: boolean;
  queryAnalytics(req: QueryAnalyticsReq, cx: ExecutionContext): Promise<Result<QueryAnalyticsRes>>;
}

export interface AIEvaluationReportService {
  readonly isAvailable: boolean;
  getOverview(req?: GetAIEvaluationOverviewReq): Promise<Result<GetAIEvaluationOverviewRes>>;
}

export interface AIAgentRuntimeService {
  readonly isAvailable: boolean;
  startRun(
    req: AgentStartRunRequest,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  resumeRun(
    runId: string,
    payload: AgentResumePayload,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  getRun(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  listRuns(
    params: AgentRunListParams,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRun[]>>;
  getEvents(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentEvent[]>>;
}

/**
 * Higher-level assembled services used by controllers.
 * 控制器使用的高层服务集合。
 *
 * These wrap use cases with richer orchestration (multi-step flows,
 * event emission, provider resolution, etc.).
 */
export interface AIModuleServices {
  readonly providerServices: AIProviderServices;
  readonly conversationServices: AIConversationServices;
  readonly chatServices: AIChatServices;
  readonly goalGenerationService: GenerateAIGoalUseCase;
  readonly knowledgeIndexServices: AIKnowledgeIndexServices | null;
  readonly knowledgeNoteService: AIKnowledgeNoteService;
  readonly knowledgeQueryServices: AIKnowledgeQueryServices;
  readonly analyticsQueryService: AIAnalyticsQueryService;
  readonly evaluationReportService: AIEvaluationReportService;
  readonly agentRuntimeService: AIAgentRuntimeService;
}

// ---------------------------------------------------------------------------
// Module Instance — 主组合根返回类型
// ---------------------------------------------------------------------------

/**
 * Primary AI composition root return type.
 * AI 模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `services` exposes higher-level orchestrators.
 * `start` / `dispose` own runtime side effects.
 */
export interface AIModuleInstance {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly services: AIModuleServices;
  readonly api: AIApplicationPort;
  /**
   * First production Turn Engine (ADR-035 stage 4). Open chat/analysis only;
   * not a Workflow and never a mutation executor.
   */
  readonly turnEngine: ITurnEnginePort;
  /**
   * Second production Turn Engine (residual 341). Readonly analysis via Model
   * Gateway (`engine.pi_readonly`); not the open-chat default.
   */
  readonly readonlyTurnEngine: ITurnEnginePort;
  /**
   * LangGraph workflow adapter when remote agent runtime is present (stage 3 / residual 318).
   */
  readonly workflowAdapter: IWorkflowAdapterPort | null;
  /**
   * Proposal Kernel lifecycle (stage 1 / residual 320). Always present; no mutation execution.
   */
  readonly proposalKernel: IProposalKernelPort;
  /**
   * Capability Resolver (stage 2 / residual 322). Fail-closed; no silent engine.* expansion.
   */
  readonly capabilityResolver: ICapabilityResolverPort;
  /**
   * Custom Model Gateway (stage 6 / residual 337). OpenAI-compatible catalog/complete/stream.
   */
  readonly modelGateway: IModelGatewayPort;
  /**
   * Assistant Facade (residual 343). Unified Host dispatch over Turn Engines + ProposalKernel.
   */
  readonly assistantFacade: IAssistantFacadePort;
  start(): void;
  dispose(): void;
}

async function getKnowledgeIndexDiagnostics(
  dependencies: AIModuleDependencies,
  supportsKnowledgeQuery: boolean,
) {
  if (!supportsKnowledgeQuery || !dependencies.knowledgeIndexRepository) {
    return undefined;
  }

  try {
    return await dependencies.knowledgeIndexRepository.getDiagnostics();
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  runtimeContributions?: AIRuntimeContributionsInput,
): readonly AIModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as AIModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Composition Root — 规范化的 AI 模块主组合根
// ---------------------------------------------------------------------------

/**
 * Canonical composition root.
 * 规范化的 AI 模块主组合根。
 *
 * This is modelled after the governance module. The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api`
 * 5. let the module instance own `start` / `dispose`
 */
export function createAIModule(dependencies: AIModuleDependencies): AIModuleInstance {
  const { conversationRepository, providerConfigRepository } = dependencies;

  // All-or-none checkpoint invariant: the two internal checkpoint ports must be
  // supplied together or not at all. Fail closed on a half-wired pair so a host
  // can never mount only one internal checkpoint surface.
  // checkpoint 对 all-or-none invariant：两个内部 checkpoint port 必须同时提供或
  // 同时缺省。半套 pair 直接 fail closed，避免宿主只挂载一半内部 checkpoint surface。
  if (Boolean(dependencies.agentCheckpointPort) !== Boolean(dependencies.langGraphCheckpointPort)) {
    throw new Error(
      'createAIModule: agentCheckpointPort and langGraphCheckpointPort must be supplied together ' +
        '(all-or-none invariant).',
    );
  }

  // --- Runtime selection: delegate to the appropriate runtime ---

  const isRemoteMode = Boolean(
    dependencies.chatExecutionPort ||
    dependencies.goalPlanningPort ||
    dependencies.goalAutomationPlanningPort ||
    dependencies.knowledgeIngestionPort ||
    dependencies.knowledgeQueryPort ||
    dependencies.knowledgeNoteGenerationPort ||
    dependencies.analyticsQueryPort ||
    dependencies.agentRuntimePort,
  );

  const runtime = isRemoteMode
    ? createRemoteAIServiceRuntime(dependencies)
    : createDirectProviderAIRuntime(dependencies);

  const { services, capabilities: baseCapabilities } = runtime;

  // --- Runtime contributions ---

  const runtimeContributions = [
    ...(services.knowledgeIndexServices
      ? [
          createKnowledgeAutoIndexRuntimeContribution(
            services.knowledgeIndexServices,
            providerConfigRepository,
          ),
        ]
      : []),
    ...normalizeRuntimeContributions(dependencies.runtimeContributions),
  ];

  // --- API facade: delegates to runtime-owned services ---

  let started = false;

  const api: AIApplicationPort = {
    // Internal checkpoint surface, present only when the host supplies the
    // all-or-none checkpoint pair. Desktop supplies neither.
    // 内部 checkpoint surface：仅当宿主提供完整的 checkpoint pair 时存在。Desktop
    // 两者都不提供。
    checkpoints:
      dependencies.agentCheckpointPort && dependencies.langGraphCheckpointPort
        ? {
            agent: dependencies.agentCheckpointPort,
            langGraph: dependencies.langGraphCheckpointPort,
          }
        : undefined,

    getCapabilities: async () =>
      ok({
        ...baseCapabilities,
        knowledgeIndexDiagnostics: await getKnowledgeIndexDiagnostics(
          dependencies,
          baseCapabilities.supportsKnowledgeQuery,
        ),
      }),

    // -- Provider Config --
    createProvider: (req, cx) => services.providerServices.create.execute(req, cx),
    updateProvider: (id, req, cx) =>
      services.providerServices.update.execute(cx.identityId, id, req),
    deleteProvider: (id, cx) => services.providerServices.delete.execute(cx.identityId, id),
    getProvider: (id, cx) => services.providerServices.get.execute(cx.identityId, id),
    listProviders: (cx) => services.providerServices.list.execute(cx),
    testConnection: (req, cx) => services.providerServices.testConnection.execute(req, cx),
    setDefaultProvider: (id, cx) => services.providerServices.setDefault.execute(id, cx),
    refreshProviderModels: (providerId, cx) =>
      services.providerServices.refreshModels.execute(providerId, cx),

    // -- Conversations --
    createConversation: (cx, name) =>
      services.conversationServices.createConversation.execute(cx, name),
    updateConversation: (id, req, cx) =>
      services.conversationServices.updateConversation.execute(cx.identityId, id, req),
    listConversations: (cx, page, pageSize) =>
      services.conversationServices.listConversations.execute(cx, page, pageSize),
    getConversation: async (id, cx, includeMessages) => {
      const result = await services.conversationServices.getConversation.execute(
        cx.identityId,
        id,
        includeMessages,
      );
      if (!result.ok) return result;
      if (result.data === null) {
        return error('NOT_FOUND', 'Conversation not found');
      }
      return ok(result.data.toClientDTO());
    },
    deleteConversation: (id, cx) =>
      services.conversationServices.deleteConversation.execute(cx.identityId, id),

    // -- Chat --
    sendMessage: (conversationId, content, cx, providerId, model) =>
      services.chatServices.send.execute(conversationId, content, cx, providerId, model),
    streamMessage: (conversationId, content, onChunk, cx, providerId, model, signal) =>
      services.chatServices.stream.execute(
        conversationId,
        content,
        onChunk,
        cx,
        providerId,
        model,
        signal,
      ),

    // -- Goal Generation --
    generateGoal: (params) => services.goalGenerationService.generateGoal(params),

    // -- Knowledge Notes --
    createKnowledgeNote: (req, cx) => services.knowledgeNoteService.createKnowledgeNote(req, cx),
    expandKnowledge: (req, cx) => services.knowledgeQueryServices.expand.execute(req, cx),
    queryKnowledge: (req, cx) => services.knowledgeQueryServices.query.execute(req, cx),
    reindexKnowledge: (req, cx) => services.knowledgeQueryServices.reindex.execute(req, cx),
    queryAnalytics: (req, cx) => services.analyticsQueryService.queryAnalytics(req, cx),
    getEvaluationOverview: (req = {}) => services.evaluationReportService.getOverview(req),
    startAgentRun: (req, cx, requestId, signal) =>
      services.agentRuntimeService.startRun(req, cx, requestId, signal),
    resumeAgentRun: (runId, payload, cx, requestId, signal) =>
      services.agentRuntimeService.resumeRun(runId, payload, cx, requestId, signal),
    getAgentRun: (runId, cx, requestId, signal) =>
      services.agentRuntimeService.getRun(runId, cx, requestId, signal),
    listAgentRuns: (params, cx, requestId, signal) =>
      services.agentRuntimeService.listRuns(params, cx, requestId, signal),
    getAgentEvents: (runId, cx, requestId, signal) =>
      services.agentRuntimeService.getEvents(runId, cx, requestId, signal),

    // Residual 345: AssistantFacade transport surface (identity must already be set on command).
    dispatchAssistant: async (command, onEvent, signal) => {
      let eventCount = 0;
      for await (const event of runtime.assistantFacade.dispatch(command, signal)) {
        eventCount += 1;
        onEvent(event);
      }
      return ok({ eventCount });
    },
  };

  // Turn Engine comes from runtime (same instance that powers open chat use cases).
  return {
    conversationRepository,
    providerConfigRepository,
    services,
    api,
    turnEngine: runtime.turnEngine,
    readonlyTurnEngine: runtime.readonlyTurnEngine,
    workflowAdapter: runtime.workflowAdapter,
    proposalKernel: runtime.proposalKernel,
    capabilityResolver: runtime.capabilityResolver,
    modelGateway: runtime.modelGateway,
    assistantFacade: runtime.assistantFacade,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
