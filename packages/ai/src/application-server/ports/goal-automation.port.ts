import type {
  GoalAutomationAction,
  GoalAutomationTaskTemplatePreview,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';

import type { AnalyticsQueryContext } from './analytics-query.port';
import type { ChatExecutionProviderConfig, ChatExecutionUsage } from './chat-execution.port';
import type { KnowledgeSourceResource } from './knowledge-ingestion.port';

export interface GoalAutomationPlanningInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
  includeTaskTemplates: boolean;
  relatedResources?: KnowledgeSourceResource[];
  analyticsContext?: AnalyticsQueryContext;
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
