/**
 * Remote AI-service runtime.
 * 远程 AI 服务运行时。
 *
 * Per-bundle completeness checks:
 * - chat: use remote port if provided, fall back to direct-provider
 * - goal generation: use remote port if provided, fall back to direct-provider
 * - knowledge note: use remote port if provided, fall back to direct-provider
 * - knowledge query: requires full bundle (source + index repo + ingestion + query)
 * - analytics: requires analyticsReadPort + analyticsQueryPort
 * - goal automation: requires goalAutomationPlanningPort + automationToolExecutorPort
 *
 * Complete bundles are enabled; incomplete bundles get null services.
 * Only fail-fast on explicitly attempted incomplete bundles (handled at call site).
 */

import type { AICapabilities } from '@dailyuse/contracts/ai';
import type {
  AIModuleDependencies,
  AIModuleServices,
  AIProviderServices,
  AIConversationServices,
  AIChatServices,
  AIKnowledgeIndexServices,
} from '../ai.module';
import type { AIRuntimeOutput } from './ai-runtime';
import {
  createAgentRuntimeService,
  createAnalyticsRuntimeService,
  createEvaluationRuntimeService,
  createKnowledgeNoteRuntimeService,
  createKnowledgeQueryRuntimeServices,
} from './ai-runtime';
import {
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
  CreateConversationUseCase,
  GetConversationUseCase,
  ListConversationsUseCase,
  DeleteConversationUseCase,
  UpdateConversationUseCase,
  AddConversationMessageUseCase,
  GetConversationsByStatusUseCase,
  UpdateConversationStatusUseCase,
  GenerateAIGoalUseCase,
  ManageAIKnowledgeNoteUseCase,
  SyncKnowledgeResourcesUseCase,
  ReindexAllKnowledgeUseCase,
  SyncRelevantKnowledgeUseCase,
  SyncResourceByIdUseCase,
  RemoveKnowledgeIndexResourceUseCase,
  QueryKnowledgeUseCase,
  ExpandKnowledgeUseCase,
  ReindexKnowledgeUseCase,
  QueryAIAnalyticsUseCase,
  ManageAIEvaluationReportUseCase,
} from '../../application/use-cases';
import {
  DirectProviderChatExecutionAdapter,
  DirectProviderGoalPlanningAdapter,
  DirectProviderKnowledgeNoteGenerationAdapter,
} from '../chat-execution';
import { AIKnowledgeNotePathResolver } from '../../application/services/ai-knowledge-note-path-resolver';
import { OpenAICompatibleModelCatalogGateway } from '../gateways/openai-compatible-model-catalog.gateway';

const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

/**
 * Creates the remote AI-service runtime.
 * Per-bundle logic: use remote port if provided, fall back to direct-provider.
 */
export function createRemoteAIServiceRuntime(dependencies: AIModuleDependencies): AIRuntimeOutput {
  const { conversationRepository, providerConfigRepository } = dependencies;

  // --- Bundle resolution: remote if provided, direct-provider fallback ---

  const chatExecutionPort =
    dependencies.chatExecutionPort ?? new DirectProviderChatExecutionAdapter();
  const goalPlanningPort = dependencies.goalPlanningPort ?? new DirectProviderGoalPlanningAdapter();
  const knowledgeNoteGenerationPort =
    dependencies.knowledgeNoteGenerationPort ?? new DirectProviderKnowledgeNoteGenerationAdapter();
  const modelCatalogPort = new OpenAICompatibleModelCatalogGateway();

  // --- Provider services (always present) ---

  const providerServices: AIProviderServices = {
    create: new CreateAIProviderUseCase(providerConfigRepository),
    update: new UpdateAIProviderUseCase(providerConfigRepository),
    delete: new DeleteAIProviderUseCase(providerConfigRepository),
    get: new GetAIProviderUseCase(providerConfigRepository),
    list: new ListAIProvidersUseCase(providerConfigRepository),
    testConnection: new TestAIProviderConnectionUseCase(
      providerConfigRepository,
      chatExecutionPort,
    ),
    setDefault: new SetDefaultAIProviderUseCase(providerConfigRepository),
    getDefault: new GetDefaultAIProviderUseCase(providerConfigRepository),
    refreshModels: new RefreshAIProviderModelsUseCase(providerConfigRepository, modelCatalogPort),
  };

  // --- Conversation services (always present) ---

  const conversationServices: AIConversationServices = {
    createConversation: new CreateConversationUseCase(conversationRepository),
    getConversation: new GetConversationUseCase(conversationRepository),
    listConversations: new ListConversationsUseCase(conversationRepository),
    deleteConversation: new DeleteConversationUseCase(conversationRepository),
    updateConversation: new UpdateConversationUseCase(conversationRepository),
    addMessage: new AddConversationMessageUseCase(conversationRepository),
    getByStatus: new GetConversationsByStatusUseCase(conversationRepository),
    updateStatus: new UpdateConversationStatusUseCase(conversationRepository),
  };

  // --- Chat bundle (always present — falls back to direct) ---

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

  // --- Goal generation bundle (always present — falls back to direct) ---

  const goalGenerationService = new GenerateAIGoalUseCase(
    providerConfigRepository,
    goalPlanningPort,
    dependencies.goalAutomationPlanningPort,
    dependencies.automationToolExecutorPort,
    dependencies.executionLogPort,
    dependencies.knowledgeSourcePort,
    dependencies.analyticsReadPort,
  );

  // --- Knowledge note generation bundle ---

  const knowledgeNoteUseCase = dependencies.knowledgeNotePersistence
    ? new ManageAIKnowledgeNoteUseCase(
        providerConfigRepository,
        knowledgeNoteGenerationPort,
        dependencies.knowledgeNotePersistence,
        new AIKnowledgeNotePathResolver(),
        dependencies.executionLogPort,
      )
    : null;

  // --- Knowledge query bundle (requires all 4 dependencies) ---

  let knowledgeIndexServices: AIKnowledgeIndexServices | null = null;
  const knowledgeQueryUseCases =
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
              dependencies.knowledgeIndexStatusPort,
            ),
            reindexAll: new ReindexAllKnowledgeUseCase(
              dependencies.knowledgeSourcePort!,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
              dependencies.knowledgeIndexStatusPort,
            ),
            syncRelevant: new SyncRelevantKnowledgeUseCase(
              dependencies.knowledgeSourcePort!,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
              dependencies.knowledgeIndexStatusPort,
            ),
            syncById: new SyncResourceByIdUseCase(
              dependencies.knowledgeSourcePort!,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
              dependencies.knowledgeIndexStatusPort,
            ),
            removeById: new RemoveKnowledgeIndexResourceUseCase(
              dependencies.knowledgeIndexRepository,
            ),
          };

          return {
            query: new QueryKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.syncRelevant,
              dependencies.knowledgeQueryPort!,
              dependencies.executionLogPort,
            ),
            expand: new ExpandKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.syncRelevant,
              dependencies.knowledgeQueryPort!,
              dependencies.executionLogPort,
            ),
            reindex: new ReindexKnowledgeUseCase(
              providerConfigRepository,
              knowledgeIndexServices!.reindexAll,
              knowledgeIndexServices!.syncById,
            ),
          };
        })()
      : null;

  // --- Analytics bundle (requires both ports) ---

  const analyticsQueryUseCase =
    dependencies.analyticsReadPort && dependencies.analyticsQueryPort
      ? new QueryAIAnalyticsUseCase(
          providerConfigRepository,
          dependencies.analyticsReadPort,
          dependencies.analyticsQueryPort,
          dependencies.executionLogPort,
        )
      : null;

  // --- Evaluation reports (single port) ---

  const evaluationReportUseCase = dependencies.evaluationReportPort
    ? new ManageAIEvaluationReportUseCase(dependencies.evaluationReportPort)
    : null;

  // --- Capabilities (runtime owns its own declarations) ---

  const supportsKnowledgeQuery = Boolean(knowledgeQueryUseCases);
  const supportsAnalyticsQuery = Boolean(analyticsQueryUseCase);
  const supportsGoalAutomation = Boolean(
    dependencies.goalAutomationPlanningPort && dependencies.automationToolExecutorPort,
  );
  const supportsAgentRuntime = Boolean(dependencies.agentRuntimePort);

  const capabilities: AICapabilities = {
    runtimeMode: 'remote-ai-service',
    supportsChat: true,
    supportsGoalGeneration: true,
    supportsKnowledgeNotes: Boolean(knowledgeNoteUseCase),
    supportsKnowledgeQuery,
    supportsKnowledgeReindex: supportsKnowledgeQuery,
    supportsAnalyticsQuery,
    supportsGoalAutomation,
    supportsAgentRuntime,
    supportsEvaluationReports: Boolean(evaluationReportUseCase),
    advancedFeaturesReason:
      supportsKnowledgeQuery &&
      supportsAnalyticsQuery &&
      supportsGoalAutomation &&
      supportsAgentRuntime
        ? undefined
        : ADVANCED_AI_REASON,
  };

  // --- Assemble services ---

  const services: AIModuleServices = {
    providerServices,
    conversationServices,
    chatServices,
    goalGenerationService,
    knowledgeIndexServices,
    knowledgeNoteService: createKnowledgeNoteRuntimeService(knowledgeNoteUseCase),
    knowledgeQueryServices: createKnowledgeQueryRuntimeServices(
      knowledgeQueryUseCases,
      capabilities,
    ),
    analyticsQueryService: createAnalyticsRuntimeService(analyticsQueryUseCase, capabilities),
    evaluationReportService: createEvaluationRuntimeService(evaluationReportUseCase),
    agentRuntimeService: createAgentRuntimeService(
      dependencies.agentRuntimePort,
      dependencies.automationToolExecutorPort,
      dependencies.providerConfigRepository,
      dependencies.knowledgeSourcePort,
      dependencies.analyticsReadPort,
      knowledgeQueryUseCases?.query,
      knowledgeNoteUseCase,
      dependencies.executionLogPort,
    ),
  };

  return { services, capabilities, runtimeContributions: [] };
}
