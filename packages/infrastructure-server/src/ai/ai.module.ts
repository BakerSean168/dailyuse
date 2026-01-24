import type {  PrismaClient  } from "@prisma/client";
import {
  AIConversationPrismaRepository,
  AIGenerationTaskPrismaRepository,
  AIProviderConfigPrismaRepository,
  AIUsageQuotaPrismaRepository
} from './adapters/prisma';
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
  public readonly conversationRepository: AIConversationPrismaRepository;
  public readonly generationTaskRepository: AIGenerationTaskPrismaRepository;
  public readonly providerConfigRepository: AIProviderConfigPrismaRepository;
  public readonly usageQuotaRepository: AIUsageQuotaPrismaRepository;

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
    this.conversationRepository = new AIConversationPrismaRepository(prisma);
    this.generationTaskRepository = new AIGenerationTaskPrismaRepository(prisma);
    this.providerConfigRepository = new AIProviderConfigPrismaRepository(prisma);
    this.usageQuotaRepository = new AIUsageQuotaPrismaRepository(prisma);

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
      (config: any) => AIAdapterFactory.createFromConfig(config)
    );

    const validationService = new AIGenerationValidationService();
    const defaultAdapter = AIAdapterFactory.getDefaultAdapter();
    const quotaEnforcementService = { enforceQuota: async () => ({ allowed: true, remaining: 1000 }) } as any;

    this.generationService = new AIGenerationApplicationService(
      validationService,
      this.conversationRepository,
      this.usageQuotaRepository,
      quotaEnforcementService,
      defaultAdapter,
      this.providerConfigRepository,
      this.generationTaskRepository,
    );

    this.chatService = new AIChatApplicationService(this.conversationRepository, defaultAdapter);
  }
}
