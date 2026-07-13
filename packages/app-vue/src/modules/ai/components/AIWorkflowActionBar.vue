<script setup lang="ts">
/**
 * AIWorkflowActionBar — 工作流生命周期操作条（V2 §6.0）
 *
 * 状态机按钮组挂在 Composer 上方条 + 消息时间线工作流卡片附近；
 * 状态机分支逻辑一行不改（Brief §12-5），`goal-agent-*` 等 testid 随迁。
 * legacy workflow 调试分支已删除（§1-5）。
 *
 * 处理器以函数 props 传入（与本模块 `:format-*` 既有约定一致），
 * 避免在中间层重写状态机事件。
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { AlertTriangle } from 'lucide-vue-next';
import type {
  GoalClarification,
  KnowledgeAnswer,
  KnowledgeNoteAgentRunResult,
  NoteSummary,
  WorkflowMode,
} from '../composables/types';

defineProps<{
  toolMode: WorkflowMode;
  workflowStatusText: string;

  // ── goal-create 状态 ──
  goalClarification: GoalClarification | null;
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

  // ── knowledge note / qa 状态 ──
  noteAgentRun: KnowledgeNoteAgentRunResult | null;
  noteSummary: NoteSummary | null;
  noteAgentLoading: boolean;
  noteCreating: boolean;
  canRunKnowledgeNoteAgent: boolean;
  canRetryKnowledgeNoteAgentExecution: boolean;
  knowledgeAnswer: KnowledgeAnswer | null;
  knowledgeQueryLoading: boolean;
  canAskKnowledge: boolean;
  canRunWorkflowActions: boolean;
  canSendMessage: boolean;

  // ── 动作（函数 props：状态机处理器原样透传） ──
  startGoalAgentRun: () => void;
  submitGoalAgentClarification: () => void;
  confirmGoalAgentRun: () => void;
  cancelGoalAgentRun: () => void;
  continueGoalAgentExecution: () => void;
  retryGoalAgentExecution: () => void;
  toggleGoalDraftEditor: () => void;
  openAutomatedGoal: () => void;
  startKnowledgeNoteAgentRun: () => void;
  createKnowledgeNoteFromConversation: () => void;
  startKnowledgeNoteAgentRunFromKnowledgeAnswer: (answer: KnowledgeAnswer) => void;
  retryKnowledgeNoteAgentExecution: () => void;
  openCreatedNote: () => void;
  askKnowledgeFromConversation: () => void;
  exitToolMode: () => void;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    v-if="toolMode !== 'chat'"
    class="rounded-2xl border bg-muted/30 px-4 py-3"
    data-testid="ai-workflow-action-bar"
  >
    <p class="text-sm leading-6 text-muted-foreground">
      {{ workflowStatusText }}
    </p>

    <div class="mt-3 flex flex-wrap gap-2">
      <template v-if="toolMode === 'goal-create'">
        <Button
          v-if="canRetryGoalAgentExecution"
          variant="outline"
          :disabled="goalAgentResuming"
          data-testid="goal-agent-retry-execution"
          @click="retryGoalAgentExecution">
          {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
        </Button>
        <Button
          v-else-if="!goalAgentWaitingForClarification && !goalAgentWaitingForApproval && !goalAgentWaitingForExecution"
          variant="outline"
          :disabled="!canRunGoalAgent"
          data-testid="goal-agent-start-run"
          @click="startGoalAgentRun">
          {{ goalAgentLoading ? t('aiAssistant.dialogs.agent.starting') : t('aiAssistant.dialogs.agent.startRun') }}
        </Button>
        <template v-else-if="goalAgentWaitingForApproval">
          <Button variant="outline"
            :disabled="goalAgentResuming"
            data-testid="goal-agent-toggle-editor"
            @click="toggleGoalDraftEditor">
            {{ showGoalDraftEditor ? t('aiAssistant.chatPage.workflow.hideGoalEditor') : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate') }}
          </Button>
          <Button variant="outline"
            :disabled="goalAgentResuming"
            data-testid="goal-agent-confirm-run"
            @click="confirmGoalAgentRun">
            {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.confirmRun') }}
          </Button>
          <Button variant="ghost"
            :disabled="goalAgentResuming"
            data-testid="goal-agent-cancel-run"
            @click="cancelGoalAgentRun">
            {{ t('common.cancel') }}
          </Button>
        </template>
        <template v-else-if="goalAgentWaitingForExecution">
          <Button variant="outline"
            :disabled="!canContinueGoalAgentExecution"
            data-testid="goal-agent-continue-execution"
            @click="continueGoalAgentExecution">
            {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.dialogs.agent.continueExecution') }}
          </Button>
        </template>
        <template v-if="goalAgentWaitingForClarification && goalClarification">
          <Button variant="outline"
            :disabled="!canResumeGoalAgentClarification"
            data-testid="goal-workflow-submit-clarification"
            @click="submitGoalAgentClarification">
            {{ goalAgentResuming ? t('aiAssistant.dialogs.agent.resuming') : t('aiAssistant.chatPage.workflow.submitGoalClarification') }}
          </Button>
          <Button variant="ghost"
            :disabled="goalAgentResuming"
            data-testid="goal-agent-cancel-run"
            @click="cancelGoalAgentRun">
            {{ t('common.cancel') }}
          </Button>
        </template>
        <Button
          v-if="automatedGoalId"
          variant="outline"
          data-testid="goal-workflow-open-created-goal"
          @click="openAutomatedGoal">
          {{ t('aiAssistant.dialogs.automation.openCreatedGoal') }}
        </Button>
      </template>

      <template v-else-if="toolMode === 'knowledge-generate'">
        <Button
          v-if="canRetryKnowledgeNoteAgentExecution"
          variant="outline"
          :disabled="noteCreating"
          data-testid="knowledge-note-retry-execution"
          @click="retryKnowledgeNoteAgentExecution">
          {{ noteCreating ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
        </Button>
        <Button
          v-else-if="!noteAgentRun && !noteSummary"
          variant="outline"
          :disabled="!canRunKnowledgeNoteAgent"
          data-testid="knowledge-note-agent-start-run"
          @click="startKnowledgeNoteAgentRun">
          {{ noteAgentLoading ? t('aiAssistant.dialogs.note.drafting') : t('aiAssistant.dialogs.note.draft') }}
        </Button>
        <Button v-else-if="!noteSummary" :disabled="noteCreating || !canRunWorkflowActions"
          data-testid="knowledge-note-save-draft"
          @click="createKnowledgeNoteFromConversation">
          {{ noteCreating ? t('aiAssistant.dialogs.note.creating') : t('aiAssistant.chatPage.workflow.createKnowledgeNote') }}
        </Button>
        <Button v-else variant="outline" @click="openCreatedNote">
          {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
        </Button>
      </template>

      <template v-else-if="toolMode === 'knowledge-qa'">
        <Button
          :disabled="knowledgeQueryLoading || !canRunWorkflowActions || !canAskKnowledge"
          data-testid="knowledge-qa-ask"
          @click="askKnowledgeFromConversation">
          {{ knowledgeQueryLoading ? t('aiAssistant.dialogs.knowledge.searching') : t('aiAssistant.dialogs.knowledge.ask') }}
        </Button>
        <Button
          v-if="knowledgeAnswer && !noteAgentRun && !noteSummary"
          variant="outline"
          :disabled="noteAgentLoading || knowledgeQueryLoading || !canSendMessage || knowledgeAnswer.evidenceStatus !== 'grounded'"
          data-testid="knowledge-qa-draft-note"
          @click="startKnowledgeNoteAgentRunFromKnowledgeAnswer(knowledgeAnswer)">
          {{ noteAgentLoading ? t('aiAssistant.dialogs.note.drafting') : t('aiAssistant.dialogs.note.draft') }}
        </Button>
        <Button
          v-else-if="canRetryKnowledgeNoteAgentExecution"
          variant="outline"
          :disabled="noteCreating"
          data-testid="knowledge-qa-retry-execution"
          @click="retryKnowledgeNoteAgentExecution">
          {{ noteCreating ? t('aiAssistant.dialogs.agent.resuming') : t('common.retry') }}
        </Button>
        <Button
          v-else-if="noteAgentRun && !noteSummary"
          variant="outline"
          :disabled="noteCreating || !canRunWorkflowActions"
          data-testid="knowledge-qa-save-draft"
          @click="createKnowledgeNoteFromConversation">
          {{ noteCreating ? t('aiAssistant.dialogs.note.creating') : t('aiAssistant.chatPage.workflow.createKnowledgeNote') }}
        </Button>
        <Button v-else-if="noteSummary" variant="outline" @click="openCreatedNote">
          {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
        </Button>
      </template>

      <Button variant="ghost" @click="exitToolMode">
        {{ t('aiAssistant.chatPage.workflow.exitTool') }}
      </Button>
    </div>

    <!-- 知识问答：未接地时说明「生成笔记」禁用原因（§1-3 状态③，校验逻辑本身不动） -->
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
