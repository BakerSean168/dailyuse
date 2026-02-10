import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import { AIGenerationValidationService } from '@/domain-server';
import { AIAdapterFactory } from './adapters/a-i-adapter-factory';
import { AIRepositoryFactory } from './di';

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
  AIChatApplicationService,
} from '@/application-server';

type BetterSQLiteDB = Database.Database;

type AIRepositories = ReturnType<typeof AIRepositoryFactory.createPrismaRepositories>;

export class AIModule {
  public readonly conversationRepository: AIRepositories['conversationRepository'];
  public readonly generationTaskRepository: AIRepositories['generationTaskRepository'];
  public readonly providerConfigRepository: AIRepositories['providerConfigRepository'];
  public readonly usageQuotaRepository: AIRepositories['usageQuotaRepository'];

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

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = AIRepositoryFactory.create(dataSourceType, dbConnection);
    this.conversationRepository = repositories.conversationRepository;
    this.generationTaskRepository = repositories.generationTaskRepository;
    this.providerConfigRepository = repositories.providerConfigRepository;
    this.usageQuotaRepository = repositories.usageQuotaRepository;

    // 2. Initialize Services
    this.createConversation = new CreateConversation(this.conversationRepository);
    this.deleteConversation = new DeleteConversation(this.conversationRepository);
    this.listConversations = new ListConversations(this.conversationRepository);
    this.listProviders = new ListProviders(this.providerConfigRepository);
    this.getConversation = new GetConversation(this.conversationRepository);
    this.sendMessage = new SendMessage(this.conversationRepository);
    this.generateGoal = new GenerateGoal(
      this.generationTaskRepository,
      this.providerConfigRepository,
    );
    this.getQuota = new GetQuota(this.usageQuotaRepository);
    this.conversationService = new AIConversationService(this.conversationRepository);
    this.providerConfigService = new AIProviderConfigService(
      this.providerConfigRepository,
      (config: any) => AIAdapterFactory.createFromConfig(config),
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
