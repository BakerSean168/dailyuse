<template>
  <!-- Goal clarification -->
  <section
    v-if="toolMode === 'goal' && goalClarification"
    class="rounded-3xl border bg-card p-5"
    data-testid="goal-clarification-panel"
  >
    <div class="flex flex-col gap-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.workflow.goalClarificationTitle') }}
        </p>
        <p class="text-sm leading-6 text-muted-foreground">
          {{ goalClarification.rationale || t('aiAssistant.chatPage.workflow.goalClarificationHint') }}
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(item, index) in goalClarification.questions"
          :key="`${item.question}-${index}`"
          class="rounded-2xl border bg-muted/30 p-4"
        >
          <p class="text-sm font-medium text-foreground">
            {{ index + 1 }}. {{ item.question }}
          </p>
          <p v-if="item.context" class="mt-2 text-sm leading-6 text-muted-foreground">
            {{ item.context }}
          </p>
          <textarea
            :value="clarificationAnswers[index]"
            rows="2"
            class="mt-3 block w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            :placeholder="t('aiAssistant.chatPage.workflow.goalClarificationAnswerPlaceholder')"
            :data-testid="`goal-clarification-answer-${index}`"
            @input="updateClarificationAnswer(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Goal draft -->
  <section
    v-if="toolMode === 'goal' && goalDraft"
    class="rounded-3xl border bg-card p-5"
    data-testid="goal-draft-panel"
  >
    <div class="flex flex-col gap-4">
      <div class="space-y-2">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.workflow.goalDraftTitle') }}
        </p>
        <h2 class="text-lg font-semibold text-foreground">
          {{ editableGoal.name || t('common.untitled') }}
        </h2>
        <p class="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {{ editableGoal.description }}
        </p>
      </div>

      <div v-if="editableKeyResults.length" class="flex flex-wrap gap-2">
        <span
          v-for="(item, index) in editableKeyResults"
          :key="`${item.title}-${index}`"
          class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground"
        >
          {{ item.title || t('aiAssistant.goalDraft.keyResults') }}
        </span>
      </div>

      <AIGoalDraftEditor
        v-if="showGoalDraftEditor"
        :goal="editableGoal"
        :key-results="editableKeyResults"
        :is-submitting="creatingGoal"
        @confirm="$emit('confirm')"
        @add-key-result="$emit('add-key-result')"
        @remove-key-result="(index) => $emit('remove-key-result', index)"
        @update-goal="(payload) => $emit('update-goal', payload)"
        @update-key-result="(payload) => $emit('update-key-result', payload)"
      />
    </div>
  </section>

  <!-- Goal automation result -->
  <section
    v-if="toolMode === 'goal' && goalAutomationResult"
    class="rounded-3xl border bg-card p-5"
    data-testid="goal-automation-panel"
  >
    <div class="space-y-4">
      <div>
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.summary') }}
        </p>
        <p class="mt-2 text-sm leading-6 text-foreground">
          {{ goalAutomationResult.summary }}
        </p>
      </div>

      <div v-if="goalAutomationResult.actions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.actions') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(action, index) in goalAutomationResult.actions"
            :key="`${action.tool}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAutomationTool(action.tool) }}
            </p>
            <p v-if="action.rationale" class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ action.rationale }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="goalExecutedActions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.executionStatus') }}
        </p>
        <p
          v-if="goalExecutionSummary"
          class="mt-2 text-sm leading-6 text-muted-foreground"
        >
          {{
            t('aiAssistant.dialogs.automation.executionSummaryText', {
              status: formatExecutionOutcome(goalExecutionSummary.status),
              executed: goalExecutionSummary.executedCount,
              skipped: goalExecutionSummary.skippedCount,
              failed: goalExecutionSummary.failedCount,
            })
          }}
        </p>
      </div>

      <div v-if="goalExecutedActions.length">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.executionTimeline') }}
        </p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(action, index) in goalExecutedActions"
            :key="`${action.tool}-${action.status}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4"
          >
            <p class="text-sm font-medium text-foreground">
              {{ formatAutomationTool(action.tool) }} · {{ formatActionStatus(action.status) }}
            </p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ action.message }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="goalExecutionRecovery && (goalExecutionRecovery.canRetry || goalExecutionRecovery.suggestions.length)"
      >
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.dialogs.automation.recoveryTitle') }}
        </p>
        <p
          v-if="goalExecutionRecovery.canRetry"
          class="mt-2 text-sm leading-6 text-foreground"
        >
          {{ t('aiAssistant.dialogs.automation.recoveryRetryReady') }}
        </p>
        <div v-if="goalExecutionRecovery.suggestions.length" class="mt-2 space-y-2">
          <p class="text-sm leading-6 text-muted-foreground">
            {{ t('aiAssistant.dialogs.automation.recoverySuggestions') }}
          </p>
          <div
            v-for="(suggestion, index) in goalExecutionRecovery.suggestions"
            :key="`${suggestion}-${index}`"
            class="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Knowledge note summary -->
  <section
    v-if="toolMode === 'knowledge-note' && noteSummary"
    class="rounded-3xl border bg-card p-5"
  >
    <div class="space-y-4">
      <div>
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.workflow.noteCreatedTitle') }}
        </p>
        <h2 class="mt-2 text-lg font-semibold text-foreground">
          {{ noteSummary.resource?.name || t('aiAssistant.dialogs.note.newNoteCreated') }}
        </h2>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border bg-muted/30 p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.dialogs.note.savedTo') }}
          </p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ noteSummary.resolvedPath }}
          </p>
        </div>
        <div class="rounded-2xl border bg-muted/30 p-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.dialogs.note.preview') }}
          </p>
          <p class="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
            {{ notePreview }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" @click="$emit('open-created-note')">
          {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
        </Button>
        <Button variant="ghost" @click="$emit('start-new-conversation', 'knowledge-note')">
          {{ t('aiAssistant.chatPage.workflow.startAnotherNote') }}
        </Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import AIGoalDraftEditor from './AIGoalDraftEditor.vue';
import type {
  EditableGoal,
  EditableKeyResult,
  GoalAutomationResult,
  GoalClarification,
  GoalDraft,
  GoalExecutedAction,
  NoteSummary,
  WorkflowMode,
} from '../composables/types';

const props = defineProps<{
  toolMode: WorkflowMode;
  goalClarification: GoalClarification | null;
  goalDraft: GoalDraft | null;
  goalAutomationResult: GoalAutomationResult | null;
  clarificationAnswers: string[];
  editableGoal: EditableGoal;
  editableKeyResults: EditableKeyResult[];
  showGoalDraftEditor: boolean;
  creatingGoal: boolean;
  goalExecutedActions: GoalExecutedAction[];
  goalExecutionSummary: { status: 'success' | 'partial' | 'failed'; executedCount: number; skippedCount: number; failedCount: number } | null;
  goalExecutionRecovery: { canRetry: boolean; suggestions: string[] } | null;
  noteSummary: NoteSummary | null;
  notePreview: string;
  formatAutomationTool: (tool: GoalAutomationResult['actions'][number]['tool']) => string;
  formatActionStatus: (status: GoalExecutedAction['status']) => string;
  formatExecutionOutcome: (status: 'success' | 'partial' | 'failed') => string;
}>();

const emit = defineEmits<{
  'update:clarificationAnswers': [answers: string[]];
  confirm: [];
  'add-key-result': [];
  'remove-key-result': [index: number];
  'update-goal': [payload: EditableGoal];
  'update-key-result': [payload: { index: number; value: EditableKeyResult }];
  'open-created-note': [];
  'start-new-conversation': [mode: string];
}>();

const { t } = useI18n();

function updateClarificationAnswer(index: number, value: string) {
  const next = [...props.clarificationAnswers];
  next[index] = value;
  emit('update:clarificationAnswers', next);
}
</script>
