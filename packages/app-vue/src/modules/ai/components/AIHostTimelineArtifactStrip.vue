<script setup lang="ts">
/**
 * AIHostTimelineArtifactStrip — residual 383 Host Artifact cards in the
 * Conversation message timeline workflow surface.
 *
 * Compact cards for Host proposal / execution receipt. Click reopens the right
 * Host workbench. Presentation only — no Host kernel mutation execution.
 */
import { useI18n } from 'vue-i18n';
import type { HostTimelineArtifactItem } from '../composables/hostProposalLifecycle';

const props = defineProps<{
  items: HostTimelineArtifactItem[];
}>();

const emit = defineEmits<{
  open: [item: HostTimelineArtifactItem];
}>();

const { t } = useI18n();

function surfaceLabel(item: HostTimelineArtifactItem): string {
  return item.surface === 'proposal'
    ? t('aiAssistant.chatPage.context.hostTimelineProposal')
    : t('aiAssistant.chatPage.context.hostTimelineReceipt');
}

function statusLabel(item: HostTimelineArtifactItem): string {
  const key = item.statusLabelKey;
  if (key === 'pending') return t('aiAssistant.chatPage.context.hostTimelineStatusPending');
  if (key === 'ok') return t('aiAssistant.chatPage.context.hostReceiptStatusOk');
  if (key === 'partial') return t('aiAssistant.chatPage.context.hostReceiptStatusPartial');
  if (key === 'failed') return t('aiAssistant.chatPage.context.hostReceiptStatusFailed');
  return t('aiAssistant.chatPage.context.hostReceiptStatusCancelled');
}

function kindLabel(kind: HostTimelineArtifactItem['kind']): string {
  if (kind === 'goal.create') return t('aiAssistant.chatPage.context.hostReceiptKindGoal');
  if (kind === 'knowledge.write') return t('aiAssistant.chatPage.context.hostReceiptKindKnowledge');
  return kind;
}
</script>

<template>
  <section
    v-if="items.length > 0"
    class="space-y-2"
    data-testid="ai-host-timeline-artifact-strip"
  >
    <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {{ t('aiAssistant.chatPage.context.hostTimelineTitle') }}
    </p>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="flex w-full flex-col gap-1 rounded-2xl border bg-card px-4 py-3 text-left transition-colors hover:border-ring hover:bg-muted/30"
      :data-testid="`ai-host-timeline-artifact-${item.proposalId}`"
      @click="emit('open', item)"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] uppercase tracking-wide text-muted-foreground">
          {{ surfaceLabel(item) }} · {{ kindLabel(item.kind) }}
        </span>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="
            item.statusLabelKey === 'ok'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : item.statusLabelKey === 'failed'
                ? 'bg-destructive/10 text-destructive'
                : item.statusLabelKey === 'pending'
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
                  : 'bg-muted text-muted-foreground'
          "
          :data-testid="`ai-host-timeline-artifact-status-${item.proposalId}`"
        >
          {{ statusLabel(item) }}
        </span>
      </div>
      <p
        class="truncate text-sm font-medium text-foreground"
        :data-testid="`ai-host-timeline-artifact-title-${item.proposalId}`"
      >
        {{ item.title }}
      </p>
      <p
        v-if="item.summary"
        class="line-clamp-2 text-xs leading-5 text-muted-foreground"
        :data-testid="`ai-host-timeline-artifact-summary-${item.proposalId}`"
      >
        {{ item.summary }}
      </p>
      <p class="text-[11px] text-primary/80">
        {{ t('aiAssistant.chatPage.context.hostTimelineOpenWorkbench') }}
      </p>
    </button>
  </section>
</template>
