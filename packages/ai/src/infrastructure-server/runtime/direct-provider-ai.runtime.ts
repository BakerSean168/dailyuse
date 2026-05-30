/**
 * Direct-provider AI runtime.
 * 直连模式 AI 运行时。
 *
 * Assembles services using local OpenAI-compatible adapters.
 * Always supports chat and goal generation.
 * Optionally supports knowledge notes when persistence is provided.
 * Does NOT support knowledge query, analytics, or goal automation.
 */

import type { AICapabilities } from '@dailyuse/contracts/ai';
import type {
  AIModuleDependencies,
  AIModuleServices,
  AIProviderServices,
  AIConversationServices,
  AIChatServices,
} from '../ai.module';
import type { AIRuntimeOutput } from './ai-runtime';
import {
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
  CreateConversationV2UseCase,
  GetConversationV2UseCase,
  ListConversationsV2UseCase,
  DeleteConversationV2UseCase,
  UpdateConversationUseCase,
  AddConversationMessageUseCase,
  GetConversationsByStatusUseCase,
  UpdateConversationStatusUseCase,
  GenerateAIGoalUseCase,
  ManageAIKnowledgeNoteUseCase,
} from '../../application-server/use-cases';
import {
  DirectProviderChatExecutionAdapter,
  DirectProviderGoalPlanningAdapter,
  DirectProviderKnowledgeNoteGenerationAdapter,
} from '../chat-execution';
import { AIKnowledgeNotePathResolver } from '../../application-server/services/ai-knowledge-note-path-resolver';
import { OpenAICompatibleModelCatalogGateway } from '../gateways/openai-compatible-model-catalog.gateway';

const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

/**
 * Creates the direct-provider runtime.
 * Direct mode always uses local OpenAI-compatible adapters.
 */
export function createDirectProviderAIRuntime(dependencies: AIModuleDependencies): AIRuntimeOutput {
  const { conversationRepository, providerConfigRepository } = dependencies;

  // Direct-provider always uses local adapters
  const chatExecutionPort = new DirectProviderChatExecutionAdapter();
  const goalPlanningPort = new DirectProviderGoalPlanningAdapter();
  const knowledgeNoteGenerationPort = new DirectProviderKnowledgeNoteGenerationAdapter();
  const modelCatalogPort = new OpenAICompatibleModelCatalogGateway();

  // Provider services
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

  // Conversation services
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

  // Goal generation
  const goalGenerationService = new GenerateAIGoalUseCase(
    providerConfigRepository,
    goalPlanningPort,
    undefined, // no goal automation in direct mode
    undefined, // no automation tool executor in direct mode
    dependencies.executionLogPort,
    dependencies.knowledgeSourcePort,
    dependencies.analyticsReadPort,
  );

  // Knowledge notes — optional, requires persistence + subpath
  const knowledgeNoteUseCase =
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

  const capabilities: AICapabilities = {
    runtimeMode: 'direct-provider',
    supportsChat: true,
    supportsGoalGeneration: true,
    supportsKnowledgeNotes: Boolean(knowledgeNoteUseCase),
    supportsKnowledgeQuery: false,
    supportsKnowledgeReindex: false,
    supportsAnalyticsQuery: false,
    supportsGoalAutomation: false,
    supportsEvaluationReports: false,
    advancedFeaturesReason: ADVANCED_AI_REASON,
  };

  const services: AIModuleServices = {
    providerServices,
    conversationServices,
    chatServices,
    goalGenerationService,
    knowledgeIndexServices: null,
    knowledgeNoteService: createKnowledgeNoteRuntimeService(knowledgeNoteUseCase),
    knowledgeQueryServices: createKnowledgeQueryRuntimeServices(null, capabilities),
    analyticsQueryService: createAnalyticsRuntimeService(null, capabilities),
    evaluationReportService: createEvaluationRuntimeService(null),
  };

  return { services, capabilities, runtimeContributions: [] };
}
