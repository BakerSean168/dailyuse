import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../domain-server';
import { AIRepositoryFactory } from './di';
import { AIContainer } from './di/ai-container';

import {
  CreateConversation,
  DeleteConversation,
  ListConversations,
  ListProviders,
  GetConversation,
  SendMessage,
  GenerateGoal,
  AIConversationService,
  AIProviderConfigService,
  AIChatApplicationService,
  GoalGenerationApplicationService,
} from '../application-server/use-cases';

export class AIModule {
  public readonly conversationRepository: IAIConversationRepository;
  public readonly providerConfigRepository: IAIProviderConfigRepository;

  public readonly createConversation: CreateConversation;
  public readonly deleteConversation: DeleteConversation;
  public readonly listConversations: ListConversations;
  public readonly listProviders: ListProviders;
  public readonly getConversation: GetConversation;
  public readonly sendMessage: SendMessage;
  public readonly generateGoal: GenerateGoal;
  public readonly conversationService: AIConversationService;
  public readonly providerConfigService: AIProviderConfigService;
  public readonly chatService: AIChatApplicationService;
  public readonly goalGenerationService: GoalGenerationApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'powersync',
    dbConnection: PrismaClient | IElectronDatabase,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = AIRepositoryFactory.create(dataSourceType, dbConnection);
    const container = AIContainer.getInstance();
    container.reset();
    container.setConversationRepository(repositories.conversationRepository);
    container.setProviderConfigRepository(repositories.providerConfigRepository);

    this.conversationRepository = container.getConversationRepository();
    this.providerConfigRepository = container.getProviderConfigRepository();

    // 2. Initialize Services
    this.createConversation = new CreateConversation(this.conversationRepository);
    this.deleteConversation = new DeleteConversation(this.conversationRepository);
    this.listConversations = new ListConversations(this.conversationRepository);
    this.listProviders = new ListProviders(this.providerConfigRepository);
    this.getConversation = new GetConversation(this.conversationRepository);
    this.sendMessage = new SendMessage(this.conversationRepository);
    this.generateGoal = new GenerateGoal(this.providerConfigRepository);
    this.conversationService = new AIConversationService(this.conversationRepository);
    this.providerConfigService = new AIProviderConfigService(this.providerConfigRepository);

    this.goalGenerationService = new GoalGenerationApplicationService(
      null,
      this.providerConfigRepository,
      null,
      null,
    );

    this.chatService = new AIChatApplicationService(
      this.conversationRepository,
      this.providerConfigRepository,
    );
  }
}
