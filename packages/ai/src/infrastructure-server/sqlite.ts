/**
 * AI Module - SQLite Composition Root
 */

import type Database from 'better-sqlite3';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../domain-server';
import { AIContainer } from './di/ai-container';
import {
  SqliteAIConversationRepository,
  SqliteAIProviderConfigRepository,
} from './adapters/sqlite';
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

type BetterSQLiteDB = Database.Database;

export class AISqliteModule {
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

  constructor(dbConnection: BetterSQLiteDB) {
    const conversationRepository = new SqliteAIConversationRepository(dbConnection);
    const providerConfigRepository = new SqliteAIProviderConfigRepository(dbConnection);

    const container = AIContainer.getInstance();
    container.reset();
    container.setConversationRepository(conversationRepository);
    container.setProviderConfigRepository(providerConfigRepository);

    this.conversationRepository = container.getConversationRepository();
    this.providerConfigRepository = container.getProviderConfigRepository();

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

export { SqliteAIConversationRepository, SqliteAIProviderConfigRepository, AIContainer };
