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
  QueryAIAnalyticsUseCase,
  CreateConversationUseCase,
  DeleteConversationUseCase,
  ManageAIEvaluationReportUseCase,
  GenerateAIGoalUseCase,
  ManageAIKnowledgeNoteUseCase,
  // Provider config decomposed use cases
  CreateAIProviderUseCase,
  UpdateAIProviderUseCase,
  DeleteAIProviderUseCase,
  GetAIProviderUseCase,
  ListAIProvidersUseCase,
  TestAIProviderConnectionUseCase,
  SetDefaultAIProviderUseCase,
  GetDefaultAIProviderUseCase,
  RefreshAIProviderModelsUseCase,
  // Chat decomposed use cases
  SendAIMessageUseCase,
  StreamAIMessageUseCase,
  // Conversation decomposed use cases
  CreateConversationV2UseCase,
  GetConversationV2UseCase,
  ListConversationsV2UseCase,
  DeleteConversationV2UseCase,
  UpdateConversationUseCase,
  AddConversationMessageUseCase,
  GetConversationsByStatusUseCase,
  UpdateConversationStatusUseCase,
  // Knowledge index decomposed use cases
  SyncKnowledgeResourcesUseCase,
  ReindexAllKnowledgeUseCase,
  SyncRelevantKnowledgeUseCase,
  SyncResourceByIdUseCase,
  // Knowledge query decomposed use cases
  QueryKnowledgeUseCase,
  ExpandKnowledgeUseCase,
  ReindexKnowledgeUseCase,
} from '../application-server/use-cases';
import { ListConversationsUseCase, GetConversationUseCase } from '../application-server/use-cases';
import { AIKnowledgeNotePathResolver } from './services/ai-knowledge-note-path-resolver';
import { createKnowledgeAutoIndexRuntimeContribution } from './runtime/knowledge-auto-index.runtime';
import {
  DirectProviderChatExecutionAdapter,
  DirectProviderGoalPlanningAdapter,
  DirectProviderKnowledgeNoteGenerationAdapter,
} from './chat-execution';
import { OpenAICompatibleModelCatalogGateway } from './gateways/openai-compatible-model-catalog.gateway';

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
  readonly query: QueryKnowledgeUseCase;
  readonly expand: ExpandKnowledgeUseCase;
  readonly reindex: ReindexKnowledgeUseCase;
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
  readonly knowledgeNoteService: ManageAIKnowledgeNoteUseCase | null;
  readonly knowledgeQueryServices: AIKnowledgeQueryServices | null;
  readonly analyticsQueryService: QueryAIAnalyticsUseCase | null;
  readonly evaluationReportService: ManageAIEvaluationReportUseCase | null;
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

const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

function resolveAICapabilities(dependencies: AIModuleDependencies): AICapabilities {
  const runtimeMode =
    dependencies.chatExecutionPort ||
    dependencies.goalPlanningPort ||
    dependencies.goalAutomationPlanningPort ||
    dependencies.knowledgeIngestionPort ||
    dependencies.knowledgeQueryPort ||
    dependencies.knowledgeNoteGenerationPort ||
    dependencies.analyticsQueryPort
      ? 'remote-ai-service'
      : 'direct-provider';
  const supportsKnowledgeNotes = Boolean(
    dependencies.knowledgeNotePersistence && dependencies.getKnowledgeNoteSubpath,
  );
  const supportsKnowledgeQuery = Boolean(
    dependencies.knowledgeSourcePort &&
    dependencies.knowledgeIndexRepository &&
    dependencies.knowledgeIngestionPort &&
    dependencies.knowledgeQueryPort,
  );
  const supportsAnalyticsQuery = Boolean(
    dependencies.analyticsReadPort && dependencies.analyticsQueryPort,
  );
  const supportsGoalAutomation = Boolean(
    dependencies.goalAutomationPlanningPort && dependencies.automationToolExecutorPort,
  );

  return {
    runtimeMode,
    supportsChat: true,
    supportsGoalGeneration: true,
    supportsKnowledgeNotes,
    supportsKnowledgeQuery,
    supportsKnowledgeReindex: supportsKnowledgeQuery,
    supportsAnalyticsQuery,
    supportsGoalAutomation,
    supportsEvaluationReports: Boolean(dependencies.evaluationReportPort),
    advancedFeaturesReason:
      supportsKnowledgeQuery && supportsAnalyticsQuery && supportsGoalAutomation
        ? undefined
        : ADVANCED_AI_REASON,
  };
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

function buildCapabilityUnavailableMessage(
  capabilityLabel: string,
  capabilities: AICapabilities,
): string {
  if (capabilities.advancedFeaturesReason) {
    return `${capabilityLabel} is unavailable. ${capabilities.advancedFeaturesReason}`;
  }

  return `${capabilityLabel} is unavailable in the current AI runtime.`;
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

/**
 * Pure assembly helper for higher-level services.
 * 纯组装函数：给定依赖对象，返回已接好线的服务集合。
 */
export function createAIServices(dependencies: AIModuleDependencies): AIModuleServices {
  const { conversationRepository, providerConfigRepository } = dependencies;
  const chatExecutionPort =
    dependencies.chatExecutionPort ?? new DirectProviderChatExecutionAdapter();
  const goalPlanningPort = dependencies.goalPlanningPort ?? new DirectProviderGoalPlanningAdapter();
  const knowledgeNoteGenerationPort =
    dependencies.knowledgeNoteGenerationPort ?? new DirectProviderKnowledgeNoteGenerationAdapter();
  const modelCatalogPort = new OpenAICompatibleModelCatalogGateway();

  // Provider config services
  const providerServices: AIProviderServices = {
    create: new CreateAIProviderUseCase(providerConfigRepository),
    update: new UpdateAIProviderUseCase(providerConfigRepository),
    delete: new DeleteAIProviderUseCase(providerConfigRepository),
    get: new GetAIProviderUseCase(providerConfigRepository),
    list: new ListAIProvidersUseCase(providerConfigRepository),
    testConnection: new TestAIProviderConnectionUseCase(providerConfigRepository, chatExecutionPort),
    setDefault: new SetDefaultAIProviderUseCase(providerConfigRepository),
    getDefault: new GetDefaultAIProviderUseCase(providerConfigRepository),
    refreshModels: new RefreshAIProviderModelsUseCase(providerConfigRepository, modelCatalogPort),
  };

  // Conversation services (decomposed from ManageAIConversationUseCase)
  const conversationServices: AIConversationServices = {
    createConversationV2: new CreateConversationV2UseCase(conversationRepository),
    getConversationV2: new GetConversationV2UseCase(conversationRepository),
    listConversationsV2: new ListConversationsV2UseCase(conversationRepository),
    deleteConversationV2: new DeleteConversationV2UseCase(conversationRepository),
    updateConversation: new UpdateConversationUseCase(conversationRepository),
    addMessage: new AddConversationMessageUseCase(conversationRepository),
    getByStatus: new GetConversationsByStatusUseCase(conversationRepository),
    updateStatus: new UpdateConversationStatusUseCase(conversationRepository),
  };

  // Chat services
  const chatServices: AIChatServices = {
    send: new SendAIMessageUseCase(
      conversationRepository,
      providerConfigRepository,
      chatExecutionPort,
      dependencies.executionLogPort,
    ),
    stream: new StreamAIMessageUseCase(
      conversationRepository,
      providerConfigRepository,
      chatExecutionPort,
      dependencies.executionLogPort,
    ),
  };

  const goalGenerationService = new GenerateAIGoalUseCase(
    providerConfigRepository,
    goalPlanningPort,
    dependencies.goalAutomationPlanningPort,
    dependencies.automationToolExecutorPort,
    dependencies.executionLogPort,
    dependencies.knowledgeSourcePort,
    dependencies.analyticsReadPort,
  );

  let knowledgeIndexServices: AIKnowledgeIndexServices | null = null;

  const knowledgeNoteService =
    dependencies.knowledgeNotePersistence && dependencies.getKnowledgeNoteSubpath
      ? new ManageAIKnowledgeNoteUseCase(
          providerConfigRepository,
          knowledgeNoteGenerationPort,
          dependencies.knowledgeNotePersistence,
          dependencies.getKnowledgeNoteSubpath,
          new AIKnowledgeNotePathResolver(),
          dependencies.executionLogPort,
        )
      : null;
  const knowledgeQueryServices =
    dependencies.knowledgeSourcePort &&
    dependencies.knowledgeIndexRepository &&
    dependencies.knowledgeIngestionPort &&
    dependencies.knowledgeQueryPort
      ? (() => {
          knowledgeIndexServices = {
            syncResources: new SyncKnowledgeResourcesUseCase(
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
            ),
            reindexAll: new ReindexAllKnowledgeUseCase(
              dependencies.knowledgeSourcePort,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
            ),
            syncRelevant: new SyncRelevantKnowledgeUseCase(
              dependencies.knowledgeSourcePort,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
            ),
            syncById: new SyncResourceByIdUseCase(
              dependencies.knowledgeSourcePort,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
            ),
          };

          return {
            query: new QueryKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.syncRelevant,
              dependencies.knowledgeQueryPort,
              dependencies.executionLogPort,
            ),
            expand: new ExpandKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.syncRelevant,
              dependencies.knowledgeQueryPort,
              dependencies.executionLogPort,
            ),
            reindex: new ReindexKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.reindexAll,
            ),
          };
        })()
      : null;
  const analyticsQueryService =
    dependencies.analyticsReadPort && dependencies.analyticsQueryPort
      ? new QueryAIAnalyticsUseCase(
          providerConfigRepository,
          dependencies.analyticsReadPort,
          dependencies.analyticsQueryPort,
          dependencies.executionLogPort,
        )
      : null;
  const evaluationReportService = dependencies.evaluationReportPort
    ? new ManageAIEvaluationReportUseCase(dependencies.evaluationReportPort)
    : null;

  return {
    providerServices,
    conversationServices,
    chatServices,
    goalGenerationService,
    knowledgeIndexServices,
    knowledgeNoteService,
    knowledgeQueryServices,
    analyticsQueryService,
    evaluationReportService,
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
  const services = createAIServices(dependencies);
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
  const baseCapabilities = resolveAICapabilities(dependencies);
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
    createProvider: (req, cx) =>
      services.providerServices.create.execute(req, cx),
    updateProvider: (id, req) => services.providerServices.update.execute(id, req),
    deleteProvider: (id) => services.providerServices.delete.execute(id),
    getProvider: (id) => services.providerServices.get.execute(id),
    listProviders: (cx) => services.providerServices.list.execute(cx),
    testConnection: (req, cx) =>
      services.providerServices.testConnection.execute(req, cx),
    setDefaultProvider: (id, cx) =>
      services.providerServices.setDefault.execute(id, cx),
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
    createKnowledgeNote: (req, cx) => {
      if (!services.knowledgeNoteService) {
        return Promise.resolve(
          error(
            'SERVICE_UNAVAILABLE',
            'Knowledge-note persistence was not provided to createAIModule. ' +
              '知识笔记持久化端口未注入到 createAIModule。',
          ),
        );
      }
      return services.knowledgeNoteService.createKnowledgeNote(req, cx);
    },
    expandKnowledge: (req, cx) => {
      if (!services.knowledgeQueryServices) {
        return Promise.resolve(
          error('SERVICE_UNAVAILABLE', buildCapabilityUnavailableMessage('Knowledge expansion', baseCapabilities)),
        );
      }
      return services.knowledgeQueryServices.expand.execute(req, cx);
    },
    queryKnowledge: (req, cx) => {
      if (!services.knowledgeQueryServices) {
        return Promise.resolve(
          error('SERVICE_UNAVAILABLE', buildCapabilityUnavailableMessage('Knowledge retrieval', baseCapabilities)),
        );
      }
      return services.knowledgeQueryServices.query.execute(req, cx);
    },
    reindexKnowledge: (req, cx) => {
      if (!services.knowledgeQueryServices) {
        return Promise.resolve(
          error('SERVICE_UNAVAILABLE', buildCapabilityUnavailableMessage('Knowledge reindexing', baseCapabilities)),
        );
      }
      return services.knowledgeQueryServices.reindex.execute(req, cx);
    },
    queryAnalytics: (req, cx) => {
      if (!services.analyticsQueryService) {
        return Promise.resolve(
          error('SERVICE_UNAVAILABLE', buildCapabilityUnavailableMessage('Analytics query', baseCapabilities)),
        );
      }
      return services.analyticsQueryService.queryAnalytics(req, cx);
    },
    getEvaluationOverview: (req = {}) => {
      if (!services.evaluationReportService) {
        return Promise.resolve(
          error('SERVICE_UNAVAILABLE', 'AI evaluation report access is unavailable.'),
        );
      }
      return services.evaluationReportService.getOverview(req);
    },
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
