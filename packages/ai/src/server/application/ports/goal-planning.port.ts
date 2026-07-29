import type {
  GeneratedGoalDraft,
  GoalClarificationDTO,
  KeyResultPreview,
} from '@memoflow/contracts/ai';

import type { ChatExecutionProviderConfig, ChatExecutionUsage } from './chat-execution.port';

export interface GoalPlanningInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
  clarificationAnswers?: string[];
  requestId?: string;
}

export interface GoalPlanningDraftResult {
  state: 'draft';
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
  usage: ChatExecutionUsage;
}

export interface GoalPlanningClarificationResult {
  state: 'clarification';
  clarification: GoalClarificationDTO;
  usage: ChatExecutionUsage;
}

export type GoalPlanningResult = GoalPlanningDraftResult | GoalPlanningClarificationResult;

export interface IGoalPlanningPort {
  plan(input: GoalPlanningInput): Promise<GoalPlanningResult>;
}
