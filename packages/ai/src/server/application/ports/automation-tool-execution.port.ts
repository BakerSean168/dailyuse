import type {
  GoalAutomationAction,
  GoalAutomationExecutedAction,
  GoalAutomationReminderPreview,
  GoalAutomationTaskTemplatePreview,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';

export interface GoalAutomationExecutionInput {
  identityId: string;
  request: {
    idea: string;
    category?: string;
    timeframe?: string;
  };
  plan: {
    goal: GeneratedGoalDraft;
    keyResults?: KeyResultPreview[];
    taskTemplates?: GoalAutomationTaskTemplatePreview[];
    reminders?: GoalAutomationReminderPreview[];
  };
  actions: GoalAutomationAction[];
}

export interface IAIAutomationToolExecutorPort {
  executeGoalAutomation(input: GoalAutomationExecutionInput): Promise<GoalAutomationExecutedAction[]>;
}
