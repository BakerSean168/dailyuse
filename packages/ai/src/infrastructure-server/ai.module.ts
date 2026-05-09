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
 * @see {@link createGovernanceModule} in @dailyuse/governance for the canonical example.
 */

import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../domain-server';
import type {
  IAIExecutionLogPort,
  IAIEvaluationReportPort,
  IAIAutomationToolExecutorPort,
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
} from '../application-server/ports';

import {
  // Concrete classes used by createAIUseCases()
  CreateConversationUseCase,
  DeleteConversationUseCase,
  ListConversationsUseCase,
  GetConversationUseCase,
} from '../application-server/use-cases';
import { createKnowledgeAutoIndexRuntimeContribution } from './runtime/knowledge-auto-index.runtime';
import { createDirectProviderAIRuntime } from './runtime/direct-provider-ai.runtime';
import { createRemoteAIServiceRuntime } from './runtime/remote-ai-service.runtime';

import type { Result } from '@dailyuse/contracts/result';
import type {
  AICapabilities,
  AIConversationClientDTO,
  ConversationListRes,
  SendMessageRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
  UpdateConversationReq,
  UpdateConversationRes,
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  AIProviderConfigClientDTO,
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
} from '@dailyuse/contracts/ai';

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
  GetDefaultAIProviderUseCase,
  RefreshAIProviderModelsUseCase,
  SendAIMessageUseCase,
  StreamAIMessageUseCase,
  CreateConversationV2UseCase,
  GetConversationV2UseCase,
  ListConversationsV2UseCase,
  DeleteConversationV2UseCase,
  UpdateConversationUseCase,
  AddConversationMessageUseCase,
  GetConversationsByStatusUseCase,
  UpdateConversationStatusUseCase,
  SyncKnowledgeResourcesUseCase,
  ReindexAllKnowledgeUseCase,
  SyncRelevantKnowledgeUseCase,
  SyncResourceByIdUseCase,
} from '../application-server/use-cases';

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
  readonly knowledgeIngestionPort?: IKnowledgeIngestionPort;
  readonly knowledgeQueryPort?: IKnowledgeQueryPort;
  readonly knowledgeNoteGenerationPort?: IKnowledgeNoteGenerationPort;
  readonly analyticsQueryPort?: IAnalyticsQueryPort;
  readonly knowledgeSourcePort?: IKnowledgeSourcePort;
  readonly analyticsReadPort?: IAnalyticsReadPort;
  readonly executionLogPort?: IAIExecutionLogPort;
  readonly evaluationReportPort?: IAIEvaluationReportPort;

  /**
   * Knowledge-note persistence is an external collaborator.
   * 知识笔记持久化是一个外部协作者。
   *
   * The host application (API / Electron) decides how notes are stored.
   * 宿主应用（API / Electron）决定笔记如何存储。
   */
  readonly knowledgeNotePersistence?: IKnowledgeNotePersistencePort;

  /**
   * Resolves the knowledge-note subdirectory for a given identity.
   * 根据身份 ID 解析知识笔记子目录。
   */
  readonly getKnowledgeNoteSubpath?: (identityId: string) => Promise<string>;

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
  | AIModuleRuntimeContribution
  | readonly AIModuleRuntimeContribution[];

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

// ---------------------------------------------------------------------------
// Use Cases — 已完成接线的底层 use case 集合
// ---------------------------------------------------------------------------

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `AIApplicationPort`.
 */
export interface AIModuleUseCases {
  readonly createConversation: CreateConversationUseCase;
  readonly deleteConversation: DeleteConversationUseCase;
  readonly listConversations: ListConversationsUseCase;
  readonly getConversation: GetConversationUseCase;
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
  readonly getDefault: GetDefaultAIProviderUseCase;
  readonly refreshModels: RefreshAIProviderModelsUseCase;
}

/**
 * Conversation decomposed use cases (from ManageAIConversationUseCase).
 */
export interface AIConversationServices {
  readonly createConversationV2: CreateConversationV2UseCase;
  readonly getConversationV2: GetConversationV2UseCase;
  readonly listConversationsV2: ListConversationsV2UseCase;
  readonly deleteConversationV2: DeleteConversationV2UseCase;
  readonly updateConversation: UpdateConversationUseCase;
  readonly addMessage: AddConversationMessageUseCase;
  readonly getByStatus: GetConversationsByStatusUseCase;
  readonly updateStatus: UpdateConversationStatusUseCase;
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
  readonly syncResources: SyncKnowledgeResourcesUseCase;
  readonly reindexAll: ReindexAllKnowledgeUseCase;
  readonly syncRelevant: SyncRelevantKnowledgeUseCase;
  readonly syncById: SyncResourceByIdUseCase;
}

/**
 * Knowledge query decomposed use cases.
 */
export interface AIKnowledgeQueryServices {
  readonly isAvailable: boolean;
  readonly query: {
    execute(
      req: QueryKnowledgeReq,
      cx: ExecutionContext,
    ): Promise<Result<QueryKnowledgeRes>>;
  };
  readonly expand: {
    execute(
      req: ExpandKnowledgeReq,
      cx: ExecutionContext,
    ): Promise<Result<ExpandKnowledgeRes>>;
  };
  readonly reindex: {
    execute(
      req: ReindexKnowledgeReq,
      cx: ExecutionContext,
    ): Promise<Result<ReindexKnowledgeRes>>;
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
  queryAnalytics(
    req: QueryAnalyticsReq,
    cx: ExecutionContext,
  ): Promise<Result<QueryAnalyticsRes>>;
}

export interface AIEvaluationReportService {
  readonly isAvailable: boolean;
  getOverview(
    req?: GetAIEvaluationOverviewReq,
  ): Promise<Result<GetAIEvaluationOverviewRes>>;
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
}

// ---------------------------------------------------------------------------
// Application Port — 传输层无关的可调用应用层门面
// ---------------------------------------------------------------------------

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface AIApplicationPort {
  getCapabilities(): Promise<Result<AICapabilities>>;

  // -- Provider Config --
  createProvider(
    req: CreateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateAIProviderConfigRes>>;
  updateProvider(id: string, req: UpdateAIProviderConfigReq): Promise<Result<UpdateAIProviderConfigRes>>;
  deleteProvider(id: string): Promise<Result<void>>;
  getProvider(id: string): Promise<Result<AIProviderConfigClientDTO>>;
  listProviders(cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO[]>>;
  testConnection(req: TestAIProviderReq, cx: ExecutionContext): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  refreshProviderModels(providerId: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>>;

  // -- Conversations --
  createConversation(cx: ExecutionContext, name?: string): Promise<Result<AIConversationClientDTO>>;
  updateConversation(id: string, req: UpdateConversationReq): Promise<Result<UpdateConversationRes>>;
  listConversations(
    cx: ExecutionContext,
    page?: number,
    pageSize?: number,
  ): Promise<Result<ConversationListRes>>;
  getConversation(
    id: string,
    includeMessages?: boolean,
  ): Promise<Result<AIConversationClientDTO | null>>;
  deleteConversation(id: string): Promise<Result<void>>;

  // -- Chat --
  sendMessage(
    conversationId: string,
    content: string,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
  ): Promise<Result<SendMessageRes>>;
  streamMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
    signal?: AbortSignal,
  ): Promise<Result<{
    userMessage: SendMessageRes['userMessage'];
    assistantMessage: SendMessageRes['assistantMessage'];
    tokenUsage: SendMessageRes['tokenUsage'];
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }>>;

  // -- Goal Generation --
  generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<Result<GenerateGoalsRes>>;

  // -- Knowledge Notes --
  createKnowledgeNote(
    req: CreateKnowledgeNoteReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateKnowledgeNoteRes>>;
  expandKnowledge(req: ExpandKnowledgeReq, cx: ExecutionContext): Promise<Result<ExpandKnowledgeRes>>;
  queryKnowledge(req: QueryKnowledgeReq, cx: ExecutionContext): Promise<Result<QueryKnowledgeRes>>;
  reindexKnowledge(req: ReindexKnowledgeReq, cx: ExecutionContext): Promise<Result<ReindexKnowledgeRes>>;
  queryAnalytics(req: QueryAnalyticsReq, cx: ExecutionContext): Promise<Result<QueryAnalyticsRes>>;
  getEvaluationOverview(req?: GetAIEvaluationOverviewReq): Promise<Result<GetAIEvaluationOverviewRes>>;
}

// ---------------------------------------------------------------------------
// Module Instance — 主组合根返回类型
// ---------------------------------------------------------------------------

/**
 * Primary AI composition root return type.
 * AI 模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `services` exposes higher-level orchestrators.
 * `start` / `dispose` own runtime side effects.
 */
export interface AIModuleInstance {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly useCases: AIModuleUseCases;
  readonly services: AIModuleServices;
  readonly api: AIApplicationPort;
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
// Use-case assembly — 纯组装函数
// ---------------------------------------------------------------------------

/**
 * Pure assembly helper used by the composition root and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createAIUseCases(
  dependencies: Pick<AIModuleDependencies, 'conversationRepository'>,
): AIModuleUseCases {
  const { conversationRepository } = dependencies;

  return {
    createConversation: new CreateConversationUseCase(conversationRepository),
    deleteConversation: new DeleteConversationUseCase(conversationRepository),
    listConversations: new ListConversationsUseCase(conversationRepository),
    getConversation: new GetConversationUseCase(conversationRepository),
  };
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
  const useCases = createAIUseCases({ conversationRepository });

  // --- Runtime selection: delegate to the appropriate runtime ---

  const isRemoteMode = Boolean(
    dependencies.chatExecutionPort ||
      dependencies.goalPlanningPort ||
      dependencies.goalAutomationPlanningPort ||
      dependencies.knowledgeIngestionPort ||
      dependencies.knowledgeQueryPort ||
      dependencies.knowledgeNoteGenerationPort ||
      dependencies.analyticsQueryPort,
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
    updateProvider: (id, req) => services.providerServices.update.execute(id, req),
    deleteProvider: (id) => services.providerServices.delete.execute(id),
    getProvider: (id) => services.providerServices.get.execute(id),
    listProviders: (cx) => services.providerServices.list.execute(cx),
    testConnection: (req, cx) => services.providerServices.testConnection.execute(req, cx),
    setDefaultProvider: (id, cx) => services.providerServices.setDefault.execute(id, cx),
    refreshProviderModels: (providerId, cx) =>
      services.providerServices.refreshModels.execute(providerId, cx),

    // -- Conversations --
    createConversation: (cx, name) =>
      services.conversationServices.createConversationV2.execute(cx, name),
    updateConversation: (id, req) =>
      services.conversationServices.updateConversation.execute(id, req),
    listConversations: (cx, page, pageSize) =>
      services.conversationServices.listConversationsV2.execute(cx, page, pageSize),
    getConversation: async (id, includeMessages) => {
      const result = await services.conversationServices.getConversationV2.execute(
        id,
        includeMessages,
      );
      if (!result.ok) return result;
      if (result.data === null) {
        return error('NOT_FOUND', 'Conversation not found');
      }
      return ok(result.data.toClientDTO());
    },
    deleteConversation: (id) =>
      services.conversationServices.deleteConversationV2.execute(id),

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
  };

  return {
    conversationRepository,
    providerConfigRepository,
    useCases,
    services,
    api,
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
