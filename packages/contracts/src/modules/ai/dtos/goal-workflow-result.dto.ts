import type { AiProviderConfigId } from '../../../primitives';
import type {
  GoalAutomationAction,
  GoalAutomationExecutedAction,
  GoalAutomationPlanDTO,
} from '../api/ai-goal-automation.dto';
import type { GenerateGoalResultDTO } from './goal-generation-result.dto';

export interface GoalClarificationQuestionDTO {
  question: string;
  context?: string | null;
}

export interface GoalClarificationDTO {
  needsClarification: true;
  questions: GoalClarificationQuestionDTO[];
  rationale?: string | null;
}

export interface GoalWorkflowClarificationResultDTO {
  state: 'clarification';
  clarification: GoalClarificationDTO;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
  generatedAt: number;
  providerUsed?: string;
  modelUsed?: string;
}

export interface GoalWorkflowDraftResultDTO extends GenerateGoalResultDTO {
  state: 'draft';
}

export interface GoalWorkflowConfirmResultDTO {
  state: 'confirm';
  summary: string;
  plan: GoalAutomationPlanDTO;
  actions: GoalAutomationAction[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
  generatedAt: number;
  providerUsed?: string;
  modelUsed?: string;
}

export interface GoalWorkflowExecutionSummaryDTO {
  status: 'success' | 'partial' | 'failed';
  executedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface GoalWorkflowRecoveryDTO {
  canRetry: boolean;
  failedActions: GoalAutomationExecutedAction[];
  suggestions: string[];
}

export interface GoalWorkflowExecutionResultDTO {
  state: 'result';
  summary: string;
  plan: GoalAutomationPlanDTO;
  actions: GoalAutomationAction[];
  executedActions: GoalAutomationExecutedAction[];
  executionSummary: GoalWorkflowExecutionSummaryDTO;
  recovery: GoalWorkflowRecoveryDTO;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
  generatedAt: number;
  providerUsed?: string;
  modelUsed?: string;
}

export type GoalWorkflowResultDTO =
  | GoalWorkflowClarificationResultDTO
  | GoalWorkflowDraftResultDTO
  | GoalWorkflowConfirmResultDTO
  | GoalWorkflowExecutionResultDTO;
