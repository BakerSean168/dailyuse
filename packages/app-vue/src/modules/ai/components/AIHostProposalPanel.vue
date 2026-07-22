<script setup lang="ts">
/**
 * AIHostProposalPanel — residual 357/359/361 Host Proposal workbench strip.
 *
 * Lists waiting_approval bridge proposals with edit/revise + approve/reject.
 * Goal edits title; knowledge edits targetPath + contentMarkdown (residual 361).
 * Handlers must route through AssistantFacade lifecycle first; this panel
 * never runs Host mutation execution or agent resume itself.
 */
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { AssistantProposalPatch } from '@dailyuse/contracts/ai';
import {
  buildHostProposalPatchFromDraft,
  isHostProposalDraftDirty,
  type HostProposalPanelItem,
} from '../composables/hostProposalLifecycle';

const props = defineProps<{
  items: HostProposalPanelItem[];
  busy?: boolean;
}>();

export type HostProposalPanelActionPayload = {
  item: HostProposalPanelItem;
  revision: number;
  patch: AssistantProposalPatch;
  dirty: boolean;
};

const emit = defineEmits<{
  approve: [payload: HostProposalPanelActionPayload];
  reject: [payload: { item: HostProposalPanelItem; revision: number }];
  revise: [payload: HostProposalPanelActionPayload];
}>();

const { t } = useI18n();

type DraftState = {
  title: string;
  targetPath: string;
  contentMarkdown: string;
  revision: number;
  baselineTitle: string;
  baselineTargetPath: string;
  baselineContentMarkdown: string;
};

/** Local draft fields + tracked Host revision per proposalId. */
const drafts = reactive<Record<string, DraftState>>({});

function emptyDraft(item: HostProposalPanelItem): DraftState {
  return {
    title: item.title,
    targetPath: item.targetPath ?? '',
    contentMarkdown: item.contentMarkdown ?? '',
    revision: item.revision,
    baselineTitle: item.title,
    baselineTargetPath: item.targetPath ?? '',
    baselineContentMarkdown: item.contentMarkdown ?? '',
  };
}

watch(
  () => props.items,
  (items) => {
    const seen = new Set<string>();
    for (const item of items) {
      seen.add(item.proposalId);
      const existing = drafts[item.proposalId];
      if (!existing) {
        drafts[item.proposalId] = emptyDraft(item);
        continue;
      }
      // Keep user edits; refresh baseline only when draft matches previous baseline.
      if (existing.baselineTitle === existing.title) {
        existing.title = item.title;
        existing.baselineTitle = item.title;
      }
      if (existing.baselineTargetPath === existing.targetPath) {
        existing.targetPath = item.targetPath ?? '';
        existing.baselineTargetPath = item.targetPath ?? '';
      }
      if (existing.baselineContentMarkdown === existing.contentMarkdown) {
        existing.contentMarkdown = item.contentMarkdown ?? '';
        existing.baselineContentMarkdown = item.contentMarkdown ?? '';
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

function draftFor(item: HostProposalPanelItem): DraftState {
  return drafts[item.proposalId] ?? emptyDraft(item);
}

function isDirty(item: HostProposalPanelItem): boolean {
  const draft = draftFor(item);
  return isHostProposalDraftDirty({
    item,
    title: draft.title,
    targetPath: draft.targetPath,
    contentMarkdown: draft.contentMarkdown,
  });
}

function buildPayload(item: HostProposalPanelItem): HostProposalPanelActionPayload {
  const draft = draftFor(item);
  const patch = buildHostProposalPatchFromDraft({
    kind: item.kind,
    title: draft.title,
    targetPath: draft.targetPath,
    contentMarkdown: draft.contentMarkdown,
  });
  return {
    item,
    revision: draft.revision,
    patch,
    dirty: isDirty(item),
  };
}

function onRevise(item: HostProposalPanelItem) {
  emit('revise', buildPayload(item));
}

function onApprove(item: HostProposalPanelItem) {
  emit('approve', buildPayload(item));
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
  next: {
    revision: number;
    title?: string;
    targetPath?: string;
    contentMarkdown?: string;
  },
) {
  const draft = drafts[proposalId];
  if (!draft) return;
  draft.revision = next.revision;
  if (typeof next.title === 'string') {
    draft.title = next.title.trim();
    draft.baselineTitle = draft.title;
  } else {
    draft.baselineTitle = draft.title.trim();
  }
  if (typeof next.targetPath === 'string') {
    draft.targetPath = next.targetPath.trim();
    draft.baselineTargetPath = draft.targetPath;
  } else {
    draft.baselineTargetPath = draft.targetPath.trim();
  }
  if (typeof next.contentMarkdown === 'string') {
    draft.contentMarkdown = next.contentMarkdown;
    draft.baselineContentMarkdown = next.contentMarkdown;
  } else {
    draft.baselineContentMarkdown = draft.contentMarkdown;
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
          <div class="min-w-0 space-y-2">
            <label
              v-if="item.kind !== 'knowledge.write'"
              class="block text-xs font-medium text-foreground"
            >
              {{ t('aiAssistant.chatPage.hostProposals.editTitle') }}
              <input
                v-model="draftFor(item).title"
                type="text"
                class="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                :disabled="busy"
                :data-testid="`ai-host-proposal-title-${item.source}`"
              />
            </label>

            <template v-else>
              <p class="truncate text-sm font-medium text-foreground">
                {{ item.title }}
              </p>
              <label class="block text-xs font-medium text-foreground">
                {{ t('aiAssistant.chatPage.hostProposals.editTargetPath') }}
                <input
                  v-model="draftFor(item).targetPath"
                  type="text"
                  class="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                  :disabled="busy"
                  :data-testid="`ai-host-proposal-target-path-${item.source}`"
                />
              </label>
              <label class="block text-xs font-medium text-foreground">
                {{ t('aiAssistant.chatPage.hostProposals.editContent') }}
                <textarea
                  v-model="draftFor(item).contentMarkdown"
                  rows="5"
                  class="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                  :disabled="busy"
                  :data-testid="`ai-host-proposal-content-${item.source}`"
                />
              </label>
            </template>

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
