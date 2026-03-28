import type {
  GoalAutomationAction,
  GoalAutomationTaskTemplatePreview,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';

import type { ChatExecutionProviderConfig, ChatExecutionUsage } from './chat-execution.port';

export interface GoalAutomationPlanningInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
  includeTaskTemplates: boolean;
  requestId?: string;
}

export interface GoalAutomationPlanningResult {
  summary: string;
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
  taskTemplates?: GoalAutomationTaskTemplatePreview[];
  actions: GoalAutomationAction[];
  usage: ChatExecutionUsage;
}

export interface IGoalAutomationPlanningPort {
  plan(input: GoalAutomationPlanningInput): Promise<GoalAutomationPlanningResult>;
}
