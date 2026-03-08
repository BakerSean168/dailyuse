/**
 * AI Module DTOs
 */

export { GoalCategory } from './goal-generation-result.dto';
export type {
  GeneratedGoalDraft,
  KeyResultPreview,
  GenerateGoalResultDTO,
  GenerateKeyResultsResultDTO,
} from './goal-generation-result.dto';
export type { GenerateGoalDTO, GenerateKeyResultsDTO } from './goal-generation-input.dto';
export type { ConversationListDTO } from './conversation-list.dto';

export type { RefineGoalResultDTO } from './goal-refinement-result.dto'; // Wait, I haven't created this file yet.

export type { GeneratedTaskPreview, GenerateTasksResultDTO } from './task-generation-result.dto';

export type { KnowledgeGenerationResultDTO, SummarizationResultDTO } from './knowledge-result.dto';

export type { TestAIProviderResultDTO } from './provider-test-result.dto';
export type { FailoverResultDTO } from './provider-failover.dto';
