<script setup lang="ts">
/**
 * AIHostProposalPanel — residual 357/359 Host Proposal workbench strip.
 *
 * Lists waiting_approval bridge proposals with edit/revise + approve/reject.
 * Handlers must route through AssistantFacade lifecycle first; this panel
 * never runs Host mutation execution or agent resume itself.
 */
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { HostProposalPanelItem } from '../composables/hostProposalLifecycle';

const props = defineProps<{
  items: HostProposalPanelItem[];
  busy?: boolean;
}>();

const emit = defineEmits<{
  approve: [payload: { item: HostProposalPanelItem; title: string; revision: number }];
  reject: [payload: { item: HostProposalPanelItem; revision: number }];
  revise: [payload: { item: HostProposalPanelItem; title: string; revision: number }];
}>();

const { t } = useI18n();

/** Local draft title + tracked Host revision per proposalId. */
const drafts = reactive<Record<string, { title: string; revision: number; baselineTitle: string }>>(
  {},
);

watch(
  () => props.items,
  (items) => {
    const seen = new Set<string>();
    for (const item of items) {
      seen.add(item.proposalId);
      const existing = drafts[item.proposalId];
      if (!existing) {
        drafts[item.proposalId] = {
          title: item.title,
          revision: item.revision,
          baselineTitle: item.title,
        };
        continue;
      }
      // Keep user edits; refresh baseline/revision only when proposal identity resets.
      if (existing.baselineTitle === existing.title) {
        existing.title = item.title;
        existing.baselineTitle = item.title;
      }
      if (existing.revision < item.revision) {
        existing.revision = item.revision;
      }
    }
    for (const key of Object.keys(drafts)) {
      if (!seen.has(key)) delete drafts[key];
    }
  },
  { immediate: true, deep: true },
);

function kindLabel(kind: HostProposalPanelItem['kind']): string {
  if (kind === 'goal.create') return t('aiAssistant.chatPage.hostProposals.kindGoal');
  if (kind === 'knowledge.write') return t('aiAssistant.chatPage.hostProposals.kindKnowledge');
  return t('aiAssistant.chatPage.hostProposals.kindTask');
}

function draftFor(item: HostProposalPanelItem) {
  return (
    drafts[item.proposalId] ?? {
      title: item.title,
      revision: item.revision,
      baselineTitle: item.title,
    }
  );
}

function isDirty(item: HostProposalPanelItem): boolean {
  const draft = draftFor(item);
  return draft.title.trim() !== draft.baselineTitle.trim();
}

function onRevise(item: HostProposalPanelItem) {
  const draft = draftFor(item);
  emit('revise', {
    item,
    title: draft.title.trim() || item.title,
    revision: draft.revision,
  });
}

function onApprove(item: HostProposalPanelItem) {
  const draft = draftFor(item);
  emit('approve', {
    item,
    title: draft.title.trim() || item.title,
    revision: draft.revision,
  });
}

function onReject(item: HostProposalPanelItem) {
  const draft = draftFor(item);
  emit('reject', {
    item,
    revision: draft.revision,
  });
}

/** Parent calls after successful Host revise to bump local revision/baseline. */
function applyRevised(
  proposalId: string,
  next: { revision: number; title?: string },
) {
  const draft = drafts[proposalId];
  if (!draft) return;
  draft.revision = next.revision;
  if (typeof next.title === 'string' && next.title.trim()) {
    draft.title = next.title.trim();
    draft.baselineTitle = next.title.trim();
  } else {
    draft.baselineTitle = draft.title.trim();
  }
}

defineExpose({ applyRevised });
</script>

<template>
  <section
    v-if="items.length > 0"
    class="rounded-lg border border-border bg-card p-3 shadow-sm"
    data-testid="ai-host-proposal-panel"
  >
    <header class="mb-2 space-y-1">
      <p class="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {{ t('aiAssistant.chatPage.hostProposals.title') }}
      </p>
      <p class="text-xs leading-5 text-muted-foreground">
        {{ t('aiAssistant.chatPage.hostProposals.lifecycleOnly') }}
      </p>
    </header>

    <ul class="space-y-3" data-testid="ai-host-proposal-list">
      <li
        v-for="item in items"
        :key="item.proposalId"
        class="rounded-md border border-border/80 bg-background/60 p-3"
        :data-testid="`ai-host-proposal-item-${item.source}`"
      >
        <div class="space-y-2">
          <div class="min-w-0 space-y-1">
            <label class="block text-xs font-medium text-foreground">
              {{ t('aiAssistant.chatPage.hostProposals.editTitle') }}
              <input
                v-model="draftFor(item).title"
                type="text"
                class="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                :disabled="busy"
                :data-testid="`ai-host-proposal-title-${item.source}`"
              />
            </label>
            <p class="text-xs text-muted-foreground">
              {{ kindLabel(item.kind) }}
              ·
              {{
                t('aiAssistant.chatPage.hostProposals.revision', {
                  revision: draftFor(item).revision,
                })
              }}
              ·
              {{ item.proposalId }}
            </p>
            <p v-if="item.summary" class="text-xs leading-5 text-muted-foreground">
              {{ item.summary }}
            </p>
            <p class="text-[11px] text-muted-foreground">
              {{
                t('aiAssistant.chatPage.hostProposals.pendingActions', {
                  count: item.pendingActionCount,
                })
              }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="busy || !isDirty(item)"
              :data-testid="`ai-host-proposal-revise-${item.source}`"
              @click="onRevise(item)"
            >
              {{
                busy
                  ? t('aiAssistant.chatPage.hostProposals.busy')
                  : t('aiAssistant.chatPage.hostProposals.revise')
              }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="busy"
              :data-testid="`ai-host-proposal-reject-${item.source}`"
              @click="onReject(item)"
            >
              {{
                busy
                  ? t('aiAssistant.chatPage.hostProposals.busy')
                  : t('aiAssistant.chatPage.hostProposals.reject')
              }}
            </Button>
            <Button
              size="sm"
              :disabled="busy"
              :data-testid="`ai-host-proposal-approve-${item.source}`"
              @click="onApprove(item)"
            >
              {{
                busy
                  ? t('aiAssistant.chatPage.hostProposals.busy')
                  : t('aiAssistant.chatPage.hostProposals.approve')
              }}
            </Button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
