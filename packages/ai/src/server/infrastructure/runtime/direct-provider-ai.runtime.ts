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
  buildAgentRuntimeCapabilityOffers,
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
} from '../../application/use-cases';
import {
  DirectProviderChatExecutionAdapter,
  DirectProviderGoalPlanningAdapter,
  DirectProviderKnowledgeNoteGenerationAdapter,
} from '../chat-execution';
import { DirectTurnEngine, ReadonlyAnalysisTurnEngine } from '../turn-engine';
import { AssistantFacade } from '../assistant-facade';
import { ProposalKernel } from '../proposal-kernel';
import { CapabilityResolver } from '../capability-resolver';
import { AIKnowledgeNotePathResolver } from '../../application/services/ai-knowledge-note-path-resolver';
import { OpenAICompatibleModelCatalogGateway } from '../gateways/openai-compatible-model-catalog.gateway';
import { CustomModelGateway } from '../model-gateway';

const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

/**
 * Creates the direct-provider runtime.
 * Direct mode always uses local OpenAI-compatible adapters.
 */
export function createDirectProviderAIRuntime(dependencies: AIModuleDependencies): AIRuntimeOutput {
  const { conversationRepository, providerConfigRepository } = dependencies;

  // Residual 337: shared CustomModelGateway for Host + direct provider adapters.
  const modelGateway = new CustomModelGateway();
  // Direct-provider always uses local adapters through the Host Model Gateway.
  const chatExecutionPort = new DirectProviderChatExecutionAdapter(modelGateway);
  const goalPlanningPort = new DirectProviderGoalPlanningAdapter(modelGateway);
  const knowledgeNoteGenerationPort = new DirectProviderKnowledgeNoteGenerationAdapter(
    modelGateway,
  );
  const modelCatalogPort = new OpenAICompatibleModelCatalogGateway();

  // Provider services
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

  // Conversation services
  const conversationServices: AIConversationServices = {
    createConversation: new CreateConversationUseCase(conversationRepository),
    getConversation: new GetConversationUseCase(conversationRepository),
    listConversations: new ListConversationsUseCase(conversationRepository),
    deleteConversation: new DeleteConversationUseCase(conversationRepository),
    updateConversation: new UpdateConversationUseCase(conversationRepository),
  };

  // Open chat routes through DirectTurnEngine (residual 316).
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
  // Residual 343: unified Host dispatch (open chat default stays DirectTurnEngine).
  const assistantFacade = new AssistantFacade(
    turnEngine,
    readonlyTurnEngine,
    proposalKernel,
    turnEngine,
  );

  // Chat services
  const chatServices: AIChatServices = {
    send: new SendAIMessageUseCase(turnEngine, dependencies.executionLogPort),
    stream: new StreamAIMessageUseCase(turnEngine, dependencies.executionLogPort),
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

  // Knowledge notes — optional, requires host persistence.
  const knowledgeNoteUseCase = dependencies.knowledgeNotePersistence
    ? new ManageAIKnowledgeNoteUseCase(
        providerConfigRepository,
        knowledgeNoteGenerationPort,
        dependencies.knowledgeNotePersistence,
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
    supportsAgentRuntime: false,
    supportsEvaluationReports: false,
    advancedFeaturesReason: ADVANCED_AI_REASON,
  };

  // Residual 322/324: fail-closed capability projection shared with agent start gate.
  const capabilityResolver = new CapabilityResolver(
    buildAgentRuntimeCapabilityOffers({ knowledgeNoteUseCase }),
  );

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
    agentRuntimeService: createAgentRuntimeService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      knowledgeNoteUseCase,
      undefined,
      capabilityResolver,
    ),
  };

  return {
    services,
    capabilities,
    runtimeContributions: [],
    turnEngine,
    readonlyTurnEngine,
    workflowAdapter: null,
    proposalKernel,
    capabilityResolver,
    modelGateway,
    assistantFacade,
  };
}
