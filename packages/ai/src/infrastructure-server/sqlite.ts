/**
 * AI Module - SQLite Composition Root
 */

import type Database from 'better-sqlite3';
import type {
  IAIConversationRepository,
  IAIGenerationTaskRepository,
  IAIProviderConfigRepository,
  IAIUsageQuotaRepository,
} from '../domain-server';
import { AIGenerationValidationService } from '../domain-server/services/AIGenerationValidationService';
import { AIContainer } from './di/ai-container';
import {
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIProviderConfigRepository,
  SqliteAIUsageQuotaRepository,
} from './adapters/sqlite';
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
  GoalGenerationApplicationService,
} from '../application-server/use-cases';
import { QuotaEnforcementService } from '../domain-server/services/QuotaEnforcementService';

type BetterSQLiteDB = Database.Database;

export class AISqliteModule {
  public readonly conversationRepository: IAIConversationRepository;
  public readonly generationTaskRepository: IAIGenerationTaskRepository;
  public readonly providerConfigRepository: IAIProviderConfigRepository;
  public readonly usageQuotaRepository: IAIUsageQuotaRepository;

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
  public readonly goalGenerationService: GoalGenerationApplicationService;

  constructor(dbConnection: BetterSQLiteDB) {
    const conversationRepository = new SqliteAIConversationRepository(dbConnection);
    const generationTaskRepository = new SqliteAIGenerationTaskRepository(dbConnection);
    const providerConfigRepository = new SqliteAIProviderConfigRepository(dbConnection);
    const usageQuotaRepository = new SqliteAIUsageQuotaRepository(dbConnection);

    const container = AIContainer.getInstance();
    container.reset();
    container.setConversationRepository(conversationRepository);
    container.setGenerationTaskRepository(generationTaskRepository);
    container.setProviderConfigRepository(providerConfigRepository);
    container.setUsageQuotaRepository(usageQuotaRepository);

    this.conversationRepository = container.getConversationRepository();
    this.generationTaskRepository = container.getGenerationTaskRepository();
    this.providerConfigRepository = container.getProviderConfigRepository();
    this.usageQuotaRepository = container.getUsageQuotaRepository();

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
    this.providerConfigService = new AIProviderConfigService(this.providerConfigRepository);

    const validationService = new AIGenerationValidationService();
    const quotaEnforcementService = new QuotaEnforcementService(this.usageQuotaRepository);

    this.generationService = new AIGenerationApplicationService(
      validationService,
      this.conversationRepository,
      this.usageQuotaRepository,
      quotaEnforcementService,
      this.providerConfigRepository,
      this.generationTaskRepository,
    );

    this.goalGenerationService = new GoalGenerationApplicationService(
      validationService,
      this.providerConfigRepository,
      this.usageQuotaRepository,
      quotaEnforcementService,
    );

    this.chatService = new AIChatApplicationService(
      this.conversationRepository,
      this.providerConfigRepository,
    );
  }
}

export {
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIProviderConfigRepository,
  SqliteAIUsageQuotaRepository,
  AIContainer,
};
