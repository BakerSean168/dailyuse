import { useI18n } from 'vue-i18n';
import type { GoalAgentAction, GoalAutomationResult, GoalExecutedAction, ChatItem } from './types';

export function useAIFormatters() {
  const { t } = useI18n();

  function typingPlaceholder(item: ChatItem): string {
    return item.role === 'assistant' && item.status === 'generating' ? '...' : '';
  }

  function getMessageStatusLabel(item: ChatItem): string {
    if (item.status === 'aborted') return t('aiAssistant.dialogs.chat.aborted');
    if (item.status === 'error') return item.errorMessage || t('aiAssistant.dialogs.chat.sendFailed');
    return '';
  }

  function formatAutomationTool(tool: GoalAutomationResult['actions'][number]['tool']): string {
    const labels: Record<GoalAutomationResult['actions'][number]['tool'], string> = {
      create_goal: t('aiAssistant.dialogs.automation.toolLabels.createGoal'),
      create_key_result: t('aiAssistant.dialogs.automation.toolLabels.createKeyResult'),
      create_task_template: t('aiAssistant.dialogs.automation.toolLabels.createTaskTemplate'),
      create_reminder: t('aiAssistant.dialogs.agent.toolLabels.createReminder'),
      search_notes: t('aiAssistant.dialogs.automation.toolLabels.searchNotes'),
      fetch_stats: t('aiAssistant.dialogs.automation.toolLabels.fetchStats'),
    };
    return labels[tool];
  }

  function formatAgentTool(tool: GoalAgentAction['tool'] | string): string {
    const labels: Record<string, string> = {
      create_goal: t('aiAssistant.dialogs.automation.toolLabels.createGoal'),
      create_key_result: t('aiAssistant.dialogs.automation.toolLabels.createKeyResult'),
      create_task_template: t('aiAssistant.dialogs.automation.toolLabels.createTaskTemplate'),
      create_reminder: t('aiAssistant.dialogs.agent.toolLabels.createReminder'),
      create_knowledge_note: t('aiAssistant.dialogs.agent.toolLabels.createKnowledgeNote'),
      search_existing_goals: t('aiAssistant.dialogs.agent.toolLabels.searchExistingGoals'),
      search_knowledge: t('aiAssistant.dialogs.agent.toolLabels.searchKnowledge'),
      fetch_goal_stats: t('aiAssistant.dialogs.agent.toolLabels.fetchGoalStats'),
      fetch_resource: t('aiAssistant.dialogs.agent.toolLabels.fetchResource'),
      find_related_notes: t('aiAssistant.dialogs.agent.toolLabels.findRelatedNotes'),
    };
    return labels[tool] ?? tool;
  }

  function formatActionStatus(status: GoalExecutedAction['status']): string {
    const labels = {
      executed: t('aiAssistant.dialogs.automation.statusLabels.executed'),
      skipped: t('aiAssistant.dialogs.automation.statusLabels.skipped'),
      failed: t('aiAssistant.dialogs.automation.statusLabels.failed'),
    } as const;
    return labels[status];
  }

  function formatExecutionOutcome(status: 'success' | 'partial' | 'failed'): string {
    const labels = {
      success: t('aiAssistant.dialogs.automation.outcomeLabels.success'),
      partial: t('aiAssistant.dialogs.automation.outcomeLabels.partial'),
      failed: t('aiAssistant.dialogs.automation.outcomeLabels.failed'),
    } as const;
    return labels[status];
  }

  return {
    typingPlaceholder,
    getMessageStatusLabel,
    formatAutomationTool,
    formatAgentTool,
    formatActionStatus,
    formatExecutionOutcome,
  };
}
