import type {  PrismaClient  } from "@prisma/client";
import { PrismaAIConversationRepository } from './repositories/prisma-a-i-conversation-repository';
import { PrismaAIGenerationTaskRepository } from './repositories/prisma-a-i-generation-task-repository';
import { PrismaAIProviderConfigRepository } from './repositories/prisma-a-i-provider-config-repository';
import { PrismaAIUsageQuotaRepository } from './repositories/prisma-a-i-usage-quota-repository';
import { AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import { AIAdapterFactory } from './adapters/a-i-adapter-factory';

import {
  CreateConversation,
  DeleteConversation,
  ListConversations,
  ListProviders,
  GetConversation,
  SendMessage,
  GenerateGoal,
  GetQuota,
  AIConversationService,
  AIProviderConfigService,
  AIGenerationApplicationService,
  AIChatApplicationService
} from '@dailyuse/application-server/ai';

export class AIModule {
  public readonly conversationRepository: PrismaAIConversationRepository;
  public readonly generationTaskRepository: PrismaAIGenerationTaskRepository;
  public readonly providerConfigRepository: PrismaAIProviderConfigRepository;
  public readonly usageQuotaRepository: PrismaAIUsageQuotaRepository;

  public readonly createConversation: CreateConversation;
  public readonly deleteConversation: DeleteConversation;
  public readonly listConversations: ListConversations;
  public readonly listProviders: ListProviders;
  public readonly getConversation: GetConversation;
  public readonly sendMessage: SendMessage;
  public readonly generateGoal: GenerateGoal;
  public readonly getQuota: GetQuota;
  public readonly conversationService: AIConversationService;
  public readonly providerConfigService: AIProviderConfigService;
  public readonly generationService: AIGenerationApplicationService;
  public readonly chatService: AIChatApplicationService;

  constructor(prisma: PrismaClient) {
    this.conversationRepository = new PrismaAIConversationRepository(prisma);
    this.generationTaskRepository = new PrismaAIGenerationTaskRepository(prisma);
    this.providerConfigRepository = new PrismaAIProviderConfigRepository(prisma);
    this.usageQuotaRepository = new PrismaAIUsageQuotaRepository(prisma);

    this.createConversation = new CreateConversation(this.conversationRepository);
    this.deleteConversation = new DeleteConversation(this.conversationRepository);
    this.listConversations = new ListConversations(this.conversationRepository);
    this.listProviders = new ListProviders(this.providerConfigRepository);
    this.getConversation = new GetConversation(this.conversationRepository);
    this.sendMessage = new SendMessage(this.conversationRepository);
    this.generateGoal = new GenerateGoal(this.generationTaskRepository, this.providerConfigRepository);
    this.getQuota = new GetQuota(this.usageQuotaRepository);
    this.conversationService = new AIConversationService(this.conversationRepository);
    this.providerConfigService = new AIProviderConfigService(
      this.providerConfigRepository,
      (config) => AIAdapterFactory.createFromConfig(config)
    );

    // Generation Service Dependencies
    const validationService = new AIGenerationValidationService();
    // Use factory to get default adapter from ENV or Config
    const defaultAdapter = AIAdapterFactory.getDefaultAdapter();

    this.generationService = new AIGenerationApplicationService(
      validationService,
      defaultAdapter,
      this.usageQuotaRepository,
      this.conversationRepository,
      this.providerConfigService,
      this.providerConfigRepository,
      this.generationTaskRepository,
      undefined // DocumentService
    );

    this.chatService = new AIChatApplicationService(this.conversationRepository, defaultAdapter);
  }
}
