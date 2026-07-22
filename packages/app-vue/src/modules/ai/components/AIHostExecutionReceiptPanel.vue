<script setup lang="ts">
/**
 * AIHostExecutionReceiptPanel — residual 379/385 Host execution-report workbench.
 *
 * Mounted in AIContextPanel right rail after Host approve + domain executor.
 * Residual 385 adds rich replay: description/path/body preview, action lines,
 * and primary entity deep-link. Presentation only — never Host kernel mutation.
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { HostExecutionReceiptItem } from '../composables/hostProposalLifecycle';

const props = defineProps<{
  items: HostExecutionReceiptItem[];
}>();

const emit = defineEmits<{
  openEntity: [payload: { source: HostExecutionReceiptItem['source']; entityId: string }];
}>();

const { t } = useI18n();

function kindLabel(kind: HostExecutionReceiptItem['kind']): string {
  if (kind === 'goal.create') return t('aiAssistant.chatPage.context.hostReceiptKindGoal');
  if (kind === 'knowledge.write') return t('aiAssistant.chatPage.context.hostReceiptKindKnowledge');
  return kind;
}

function statusLabel(item: HostExecutionReceiptItem): string {
  if (item.runStatus === 'completed' && item.ok) {
    return t('aiAssistant.chatPage.context.hostReceiptStatusOk');
  }
  if (item.runStatus === 'completed') {
    return t('aiAssistant.chatPage.context.hostReceiptStatusPartial');
  }
  if (item.runStatus === 'failed') {
    return t('aiAssistant.chatPage.context.hostReceiptStatusFailed');
  }
  return t('aiAssistant.chatPage.context.hostReceiptStatusCancelled');
}

function actionStatusLabel(status: HostExecutionReceiptItem['actionLines'][number]['status']): string {
  if (status === 'executed') return t('aiAssistant.chatPage.context.hostReceiptActionExecuted');
  if (status === 'failed') return t('aiAssistant.chatPage.context.hostReceiptActionFailed');
  return t('aiAssistant.chatPage.context.hostReceiptActionSkipped');
}

function onOpenEntity(item: HostExecutionReceiptItem) {
  if (!item.primaryEntityId) return;
  emit('openEntity', { source: item.source, entityId: item.primaryEntityId });
}
</script>

<template>
  <section
    v-if="items.length > 0"
    class="space-y-3"
    data-testid="ai-host-execution-receipt-panel"
  >
    <header class="space-y-0.5">
      <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {{ t('aiAssistant.chatPage.context.hostReceiptTitle') }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ t('aiAssistant.chatPage.context.hostReceiptSubtitle') }}
      </p>
    </header>

    <article
      v-for="item in items"
      :key="item.receiptKey"
      class="rounded-lg border bg-card p-3 shadow-sm"
      :data-testid="`ai-host-execution-receipt-${item.proposalId}`"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 space-y-1">
          <p class="text-[11px] uppercase tracking-wide text-muted-foreground">
            {{ kindLabel(item.kind) }}
          </p>
          <p
            class="truncate text-sm font-medium text-foreground"
            :data-testid="`ai-host-execution-receipt-title-${item.proposalId}`"
          >
            {{ item.title }}
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="
            item.ok
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : item.runStatus === 'failed'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
          "
          :data-testid="`ai-host-execution-receipt-status-${item.proposalId}`"
        >
          {{ statusLabel(item) }}
        </span>
      </div>

      <p
        class="mt-2 text-xs leading-5 text-muted-foreground"
        :data-testid="`ai-host-execution-receipt-summary-${item.proposalId}`"
      >
        {{ item.summary }}
      </p>

      <!-- Residual 385: rich replay fields -->
      <p
        v-if="item.description"
        class="mt-2 text-xs leading-5 text-foreground/90"
        :data-testid="`ai-host-execution-receipt-description-${item.proposalId}`"
      >
        {{ item.description }}
      </p>
      <p
        v-if="item.targetPath"
        class="mt-2 truncate font-mono text-[11px] text-muted-foreground"
        :data-testid="`ai-host-execution-receipt-path-${item.proposalId}`"
      >
        {{ item.targetPath }}
      </p>
      <pre
        v-if="item.contentPreview"
        class="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-2 text-[11px] leading-5 text-muted-foreground"
        :data-testid="`ai-host-execution-receipt-preview-${item.proposalId}`"
      >{{ item.contentPreview }}</pre>

      <dl class="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
        <div>
          <dt>{{ t('aiAssistant.chatPage.context.hostReceiptExecuted') }}</dt>
          <dd
            class="font-medium text-foreground"
            :data-testid="`ai-host-execution-receipt-executed-${item.proposalId}`"
          >
            {{ item.executedCount }}
          </dd>
        </div>
        <div>
          <dt>{{ t('aiAssistant.chatPage.context.hostReceiptSkipped') }}</dt>
          <dd class="font-medium text-foreground">{{ item.skippedCount }}</dd>
        </div>
        <div>
          <dt>{{ t('aiAssistant.chatPage.context.hostReceiptFailed') }}</dt>
          <dd class="font-medium text-foreground">{{ item.failedCount }}</dd>
        </div>
      </dl>

      <ul
        v-if="item.actionLines.length > 0"
        class="mt-2 space-y-1"
        :data-testid="`ai-host-execution-receipt-actions-${item.proposalId}`"
      >
        <li
          v-for="(line, index) in item.actionLines"
          :key="`${item.receiptKey}:${index}:${line.tool}`"
          class="rounded-md border border-dashed px-2 py-1 text-[11px] leading-5 text-muted-foreground"
          :data-testid="`ai-host-execution-receipt-action-${item.proposalId}-${index}`"
        >
          <span class="font-medium text-foreground">{{ line.tool }}</span>
          · {{ actionStatusLabel(line.status) }}
          <span v-if="line.message"> — {{ line.message }}</span>
          <span v-if="line.entityId" class="font-mono"> ({{ line.entityId }})</span>
        </li>
      </ul>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <p
          v-if="item.entityIds.length > 0"
          class="truncate text-[11px] text-muted-foreground"
          :data-testid="`ai-host-execution-receipt-entities-${item.proposalId}`"
        >
          {{
            t('aiAssistant.chatPage.context.hostReceiptEntities', {
              ids: item.entityIds.join(', '),
            })
          }}
        </p>
        <Button
          v-if="item.primaryEntityId"
          variant="outline"
          size="sm"
          class="h-7 px-2 text-[11px]"
          :data-testid="`ai-host-execution-receipt-open-${item.proposalId}`"
          @click="onOpenEntity(item)"
        >
          {{
            item.source === 'goal'
              ? t('aiAssistant.chatPage.context.hostReceiptOpenGoal')
              : t('aiAssistant.chatPage.context.hostReceiptOpenNote')
          }}
        </Button>
      </div>

      <p class="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
        {{ item.proposalId }} · r{{ item.revision }}
      </p>
    </article>
  </section>
</template>
