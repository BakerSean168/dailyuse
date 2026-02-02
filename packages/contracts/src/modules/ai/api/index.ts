/**
 * AI Module API Export
 * AI 模块 API 导出
 */

// ===== Goal Generation =====
export {
  GoalCategory,
  GenerateGoalSchema,
  type GenerateGoalReq,
  type GeneratedGoalDraft,
  type GenerateGoalRes,
  GenerateKeyResultsSchema,
  type GenerateKeyResultsReq,
  type KeyResultPreview,
  type GenerateKeyResultsRes,
} from './goal-generation';

// ===== Task Generation =====
export {
  GenerateTasksSchema,
  type GenerateTasksReq,
  type GeneratedTaskPreview,
  type GenerateTasksRes,
} from './task-generation';

// ===== Knowledge & Summarization =====
export {
  KnowledgeGenerationSchema,
  type KnowledgeGenerationReq,
  type KnowledgeGenerationRes,
  SummarizationSchema,
  type SummarizationReq,
  type SummarizationRes,
} from './knowledge';

// ===== Provider Configuration =====
export {
  CreateAIProviderConfigSchema,
  type CreateAIProviderConfigReq,
  type CreateAIProviderConfigRes,
  UpdateAIProviderConfigSchema,
  type UpdateAIProviderConfigReq,
  type UpdateAIProviderConfigRes,
  TestAIProviderSchema,
  type TestAIProviderReq,
  type TestAIProviderRes,
} from './provider-config';