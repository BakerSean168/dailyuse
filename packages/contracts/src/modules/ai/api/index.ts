/**
 * AI Module API Contracts (Grouped by operation type)
 */

// === Goal Generation Operations ===
export {
  GoalCategory,
  GenerateGoalSchema,
  GenerateKeyResultsSchema,
} from './crud';
export type {
  GenerateGoalReq,
  GenerateGoalRes,
  GenerateKeyResultsReq,
  GenerateKeyResultsRes,
} from './crud';

// === Task Generation Operations ===
export {
  GenerateTasksSchema,
} from './crud';
export type {
  GenerateTasksReq,
  GenerateTasksRes,
} from './crud';

// === Knowledge Operations ===
export {
  KnowledgeGenerationSchema,
  SummarizationSchema,
} from './crud';
export type {
  KnowledgeGenerationReq,
  KnowledgeGenerationRes,
  SummarizationReq,
  SummarizationRes,
} from './crud';

// === AI Provider Configuration Operations ===
export {
  CreateAIProviderConfigSchema,
  UpdateAIProviderConfigSchema,
  TestAIProviderSchema,
} from './crud';
export type {
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  GetAIProviderConfigsReq,
  GetAIProviderConfigsRes,
  GetAIProviderConfigReq,
  GetAIProviderConfigRes,
  DeleteAIProviderConfigReq,
  DeleteAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
} from './crud';