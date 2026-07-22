import type {
  GoalAutomationAction,
  GoalAutomationReminderPreview,
  GoalAutomationTaskTemplatePreview,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';

import type { AnalyticsQueryContext } from './analytics-query.port';
import type { ChatExecutionProviderConfig, ChatExecutionUsage } from './chat-execution.port';
import type { KnowledgeSourceNote } from './knowledge-ingestion.port';

export interface GoalAutomationPlanningInput {
  identityId: string;
  providerConfig: ChatExecutionProviderConfig;
  idea: string;
  category?: string;
  timeframe?: string;
  includeKeyResults: boolean;
  includeTaskTemplates: boolean;
  relatedNotes?: KnowledgeSourceNote[];
  analyticsContext?: AnalyticsQueryContext;
  requestId?: string;
}

export interface GoalAutomationPlanningResult {
  summary: string;
  goal: GeneratedGoalDraft;
  keyResults?: KeyResultPreview[];
  taskTemplates?: GoalAutomationTaskTemplatePreview[];
  reminders?: GoalAutomationReminderPreview[];
  actions: GoalAutomationAction[];
  usage: ChatExecutionUsage;
}

export interface IGoalAutomationPlanningPort {
  plan(input: GoalAutomationPlanningInput): Promise<GoalAutomationPlanningResult>;
}
