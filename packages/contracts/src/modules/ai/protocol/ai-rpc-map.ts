/**
 * AI RPC Map
 * 
 * Defines RPC operations for AI module
 */
import type {
  GenerateGoalsReq, GenerateGoalsRes,
  GenerateTasksReq, GenerateTasksRes,
  KnowledgeGenerationReq, KnowledgeGenerationRes,
  SummarizationReq, SummarizationRes,
  CreateAIProviderConfigReq, CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq, UpdateAIProviderConfigRes,
  TestAIProviderReq, TestAIProviderRes,
} from '../api';

export type AIRpcMap = {
  // Goal Generation
  'ai:generate-goal': [GenerateGoalsReq, GenerateGoalsRes];
  
  // Task Generation
  'ai:generate-tasks': [GenerateTasksReq, GenerateTasksRes];
  
  // Knowledge & Summarization
  'ai:generate-knowledge': [KnowledgeGenerationReq, KnowledgeGenerationRes];
  'ai:summarize': [SummarizationReq, SummarizationRes];
  
  // Provider Configuration
  'ai:create-provider-config': [CreateAIProviderConfigReq, CreateAIProviderConfigRes];
  'ai:update-provider-config': [UpdateAIProviderConfigReq, UpdateAIProviderConfigRes];
  'ai:test-provider': [TestAIProviderReq, TestAIProviderRes];
};
