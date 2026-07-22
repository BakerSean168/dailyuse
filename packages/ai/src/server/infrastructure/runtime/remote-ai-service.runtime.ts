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
  buildAgentRuntimeCapabilityOffers,
} from './ai-runtime';
import {
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
  GenerateAIGoalUseCase,
  ManageAIKnowledgeNoteUseCase,
  SyncKnowledgeNotesUseCase,
  ReindexAllKnowledgeUseCase,
  SyncRelevantKnowledgeUseCase,
  SyncNoteByIdUseCase,
  RemoveKnowledgeIndexNoteUseCase,
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
import { DirectTurnEngine, ReadonlyAnalysisTurnEngine } from '../turn-engine';
import { ProposalKernel } from '../proposal-kernel';
import { CapabilityResolver } from '../capability-resolver';
import { LangGraphWorkflowAdapter } from '../workflow';
import { AIKnowledgeNotePathResolver } from '../../application/services/ai-knowledge-note-path-resolver';
import { OpenAICompatibleModelCatalogGateway } from '../gateways/openai-compatible-model-catalog.gateway';
import { CustomModelGateway } from '../model-gateway';

const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

/**
 * Creates the remote AI-service runtime.
 * Per-bundle logic: use remote port if provided, fall back to direct-provider.
 */
export function createRemoteAIServiceRuntime(dependencies: AIModuleDependencies): AIRuntimeOutput {
  const { conversationRepository, providerConfigRepository } = dependencies;

  // --- Bundle resolution: remote if provided, direct-provider fallback ---

  // Residual 337: Host Model Gateway always present; direct fallbacks share it.
  const modelGateway = new CustomModelGateway();
  const chatExecutionPort =
    dependencies.chatExecutionPort ?? new DirectProviderChatExecutionAdapter(modelGateway);
  const goalPlanningPort =
    dependencies.goalPlanningPort ?? new DirectProviderGoalPlanningAdapter(modelGateway);
  const knowledgeNoteGenerationPort =
    dependencies.knowledgeNoteGenerationPort ?? new DirectProviderKnowledgeNoteGenerationAdapter(modelGateway);
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
    refreshModels: new RefreshAIProviderModelsUseCase(providerConfigRepository, modelCatalogPort),
  };

  // --- Conversation services (always present) ---

  const conversationServices: AIConversationServices = {
    createConversation: new CreateConversationUseCase(conversationRepository),
    getConversation: new GetConversationUseCase(conversationRepository),
    listConversations: new ListConversationsUseCase(conversationRepository),
    deleteConversation: new DeleteConversationUseCase(conversationRepository),
    updateConversation: new UpdateConversationUseCase(conversationRepository),
  };

  // --- Chat bundle via DirectTurnEngine (residual 316) ---

  const turnEngine = new DirectTurnEngine(
    conversationRepository,
    providerConfigRepository,
    chatExecutionPort,
  );
  // Residual 341: second production Turn Engine (readonly analysis via Model Gateway).
  const readonlyTurnEngine = new ReadonlyAnalysisTurnEngine(
    providerConfigRepository,
    modelGateway,
  );

  // Residual 320: Host proposal lifecycle (no mutation execution).
  const proposalKernel = new ProposalKernel();

  // Residual 318: wrap remote agent runtime with LangGraphWorkflowAdapter when present.
  const workflowAdapter = dependencies.agentRuntimePort
    ? new LangGraphWorkflowAdapter(dependencies.agentRuntimePort)
    : null;
  const agentRuntimePort = workflowAdapter ?? dependencies.agentRuntimePort;

  const chatServices: AIChatServices = {
    send: new SendAIMessageUseCase(turnEngine, dependencies.executionLogPort),
    stream: new StreamAIMessageUseCase(turnEngine, dependencies.executionLogPort),
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
            syncResources: new SyncKnowledgeNotesUseCase(
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
            syncById: new SyncNoteByIdUseCase(
              dependencies.knowledgeSourcePort!,
              dependencies.knowledgeIndexRepository,
              dependencies.knowledgeIngestionPort,
              dependencies.executionLogPort,
              dependencies.knowledgeIndexStatusPort,
            ),
            removeById: new RemoveKnowledgeIndexNoteUseCase(
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

  // Residual 322/324: fail-closed capability projection shared with agent start gate.
  // Workflow adapter offers are explicit (not silent engine.*) when remote agent runtime is present.
  const capabilityOffers = [
    ...buildAgentRuntimeCapabilityOffers({
      knowledgeNoteUseCase,
      automationToolExecutorPort: dependencies.automationToolExecutorPort,
    }),
    ...(workflowAdapter ? workflowAdapter.toCapabilityOffers('any') : []),
  ];
  const capabilityResolver = new CapabilityResolver(capabilityOffers);

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
      agentRuntimePort,
      dependencies.automationToolExecutorPort,
      dependencies.providerConfigRepository,
      dependencies.knowledgeSourcePort,
      dependencies.analyticsReadPort,
      knowledgeQueryUseCases?.query,
      knowledgeNoteUseCase,
      dependencies.executionLogPort,
      capabilityResolver,
    ),
  };
  return { services, capabilities, runtimeContributions: [], turnEngine, readonlyTurnEngine, workflowAdapter, proposalKernel, capabilityResolver, modelGateway };
}
