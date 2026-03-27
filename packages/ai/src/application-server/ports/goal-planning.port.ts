import type { GeneratedGoalDraft, KeyResultPreview } from '@dailyuse/contracts/ai';

import type { ChatExecutionProviderConfig, ChatExecutionUsage } from './chat-execution.port';

export interface GoalPlanningInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
  requestId?: string;
}

export interface GoalPlanningResult {
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
  usage: ChatExecutionUsage;
}

export interface IGoalPlanningPort {
  plan(input: GoalPlanningInput): Promise<GoalPlanningResult>;
}
