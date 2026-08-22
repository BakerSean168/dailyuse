<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button } from '@memoflow/ui-vue-shadcn';
import { AlertTriangle } from '@lucide/vue';
import type { GoalClarificationView, KnowledgeAnswer, WorkflowMode } from '../composables';

const props = defineProps<{
  toolMode: WorkflowMode;
  workflowStatusText: string;
  goalClarification: GoalClarificationView | null;
  automatedGoalId: string | null;
  goalAgentLoading: boolean;
  goalAgentResuming: boolean;
  showGoalDraftEditor: boolean;
  canRunGoalAgent: boolean;
  canResumeGoalAgentClarification: boolean;
  canContinueGoalAgentExecution: boolean;
  canRetryGoalAgentExecution: boolean;
  goalAgentWaitingForClarification: boolean;
  goalAgentWaitingForApproval: boolean;
  goalAgentWaitingForExecution: boolean;
  knowledgeAnswer: KnowledgeAnswer | null;
  knowledgeQueryLoading: boolean;
  canAskKnowledge: boolean;
  taskAgentLoading: boolean;
  canRunTaskAgent: boolean;
  linkedGoalId: string | null;
  recentGoals: Array<{ id: string; title: string }>;
  knowledgeCaptureLoading: boolean;
  canRunKnowledgeCapture: boolean;
  startGoalAgentRun: () => void;
  startTaskAgentRun: () => void;
  setLinkedGoalId: (goalId: string | null) => void;
  startKnowledgeCaptureRun: () => void;
  submitGoalAgentClarification: () => void;
  confirmGoalAgentRun: () => void;
  cancelGoalAgentRun: () => void;
  continueGoalAgentExecution: () => void;
  retryGoalAgentExecution: () => void;
  toggleGoalDraftEditor: () => void;
  openAutomatedGoal: () => void;
  askKnowledgeFromConversation: () => void;
  exitToolMode: () => void;
}>();

const { t } = useI18n();
function onTaskLinkedGoalChange(event: Event) {
  const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
  props.setLinkedGoalId(value || null);
}
</script>

<template>
  <div
    v-if="toolMode !== 'chat'"
    class="rounded-2xl border bg-muted/30 px-4 py-3"
    data-testid="ai-workflow-action-bar"
  >
    <p class="text-sm leading-6 text-muted-foreground">{{ workflowStatusText }}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <template v-if="toolMode === 'goal-create'">
        <Button
          v-if="canRetryGoalAgentExecution"
          variant="outline"
          :disabled="goalAgentResuming"
          data-testid="goal-agent-retry-execution"
          @click="retryGoalAgentExecution"
        >{{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}</Button>
        <Button
          v-else-if="!goalAgentWaitingForClarification && !goalAgentWaitingForApproval && !goalAgentWaitingForExecution"
          variant="outline"
          :disabled="!canRunGoalAgent"
          data-testid="goal-agent-start-run"
          @click="startGoalAgentRun"
        >{{ goalAgentLoading ? t('aiAssistant.dialogs.agent.starting') : t('aiAssistant.dialogs.agent.startRun') }}</Button>
        <template v-else-if="goalAgentWaitingForApproval">
          <Button variant="outline" :disabled="goalAgentResuming" data-testid="goal-agent-toggle-editor" @click="toggleGoalDraftEditor">
            {{ showGoalDraftEditor ? t('aiAssistant.chatPage.workflow.hideGoalEditor') : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate') }}
          </Button>
          <Button variant="outline" :disabled="goalAgentResuming" data-testid="goal-agent-confirm-run" @click="confirmGoalAgentRun">
            {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.confirmRun') }}
          </Button>
          <Button variant="ghost" :disabled="goalAgentResuming" data-testid="goal-agent-cancel-run" @click="cancelGoalAgentRun">{{ t('common.cancel') }}</Button>
        </template>
        <Button
          v-else-if="goalAgentWaitingForExecution"
          variant="outline"
          :disabled="!canContinueGoalAgentExecution"
          data-testid="goal-agent-continue-execution"
          @click="continueGoalAgentExecution"
        >{{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.continueExecution') }}</Button>
        <template v-if="goalAgentWaitingForClarification && goalClarification">
          <Button variant="outline" :disabled="!canResumeGoalAgentClarification" data-testid="goal-workflow-submit-clarification" @click="submitGoalAgentClarification">
            {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.chatPage.workflow.submitGoalClarification') }}
          </Button>
          <Button variant="ghost" :disabled="goalAgentResuming" data-testid="goal-agent-cancel-run" @click="cancelGoalAgentRun">{{ t('common.cancel') }}</Button>
        </template>
        <Button v-if="automatedGoalId" variant="outline" data-testid="goal-workflow-open-created-goal" @click="openAutomatedGoal">
          {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
        </Button>
      </template>

      <template v-else-if="toolMode === 'task-create'">
        <label class="flex min-w-[12rem] flex-col gap-1 text-xs text-muted-foreground">
          <span>{{ t('aiAssistant.chatPage.workflow.taskLinkedGoalLabel') }}</span>
          <select class="h-9 rounded-md border bg-background px-2 text-sm text-foreground" data-testid="task-agent-linked-goal" :value="linkedGoalId ?? ''" @change="onTaskLinkedGoalChange">
            <option value="">{{ t('aiAssistant.chatPage.workflow.taskLinkedGoalNone') }}</option>
            <option v-for="goal in recentGoals" :key="goal.id" :value="goal.id">{{ goal.title }}</option>
          </select>
        </label>
        <Button variant="outline" :disabled="!canRunTaskAgent" data-testid="task-agent-start-run" @click="startTaskAgentRun">
          {{ taskAgentLoading ? t('aiAssistant.dialogs.agent.starting') : t('aiAssistant.dialogs.agent.startRun') }}
        </Button>
      </template>

      <template v-else-if="toolMode === 'knowledge-capture'">
        <Button variant="outline" :disabled="!canRunKnowledgeCapture" data-testid="knowledge-capture-agent-start-run" @click="startKnowledgeCaptureRun">
          {{ knowledgeCaptureLoading ? t('aiAssistant.dialogs.agent.starting') : t('aiAssistant.dialogs.agent.startRun') }}
        </Button>
      </template>

      <template v-else-if="toolMode === 'knowledge-qa'">
        <Button :disabled="knowledgeQueryLoading || !canAskKnowledge" data-testid="knowledge-qa-ask" @click="askKnowledgeFromConversation">
          {{ knowledgeQueryLoading ? t('aiAssistant.dialogs.knowledge.searching') : t('aiAssistant.dialogs.knowledge.ask') }}
        </Button>
      </template>

      <Button variant="ghost" @click="exitToolMode">{{ t('aiAssistant.chatPage.workflow.exitTool') }}</Button>
    </div>

    <p
      v-if="toolMode === 'knowledge-qa' && knowledgeAnswer && knowledgeAnswer.evidenceStatus !== 'grounded'"
      class="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"
      data-testid="knowledge-qa-ungrounded-hint"
    >
      <AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      {{ t('aiAssistant.chatPage.workflow.ungroundedHint') }}
    </p>
  </div>
</template>
