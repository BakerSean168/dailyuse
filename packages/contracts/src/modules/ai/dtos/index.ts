/**
 * AI Module DTOs
 */

export {
  GoalCategory,
  GeneratedGoalDraftSchema,
  KeyResultPreviewSchema,
  GenerateGoalResultDTOSchema,
  GenerateKeyResultsResultDTOSchema,
} from './goal-generation-result.dto';
export type {
  GeneratedGoalDraft,
  KeyResultPreview,
  GenerateGoalResultDTO,
  GenerateKeyResultsResultDTO,
} from './goal-generation-result.dto';
export type {
  GoalClarificationQuestionDTO,
  GoalClarificationDTO,
  GoalWorkflowClarificationResultDTO,
  GoalWorkflowDraftResultDTO,
  GoalWorkflowConfirmResultDTO,
  GoalWorkflowExecutionResultDTO,
  GoalWorkflowResultDTO,
} from './goal-workflow-result.dto';

export {
  TestAIProviderResultDTOSchema,
} from './provider-test-result.dto';
export type { TestAIProviderResultDTO } from './provider-test-result.dto';
