<script setup lang="ts">
/**
 * AIHostProposalPanel — residual 357 thin Host Proposal workbench strip.
 *
 * Lists waiting_approval bridge proposals with approve/reject actions.
 * Handlers must route through AssistantFacade lifecycle first; this panel
 * never runs Host mutation execution or agent resume itself.
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { HostProposalPanelItem } from '../composables/hostProposalLifecycle';

defineProps<{
  items: HostProposalPanelItem[];
  busy?: boolean;
}>();

const emit = defineEmits<{
  approve: [item: HostProposalPanelItem];
  reject: [item: HostProposalPanelItem];
}>();

const { t } = useI18n();

function kindLabel(kind: HostProposalPanelItem['kind']): string {
  if (kind === 'goal.create') return t('aiAssistant.chatPage.hostProposals.kindGoal');
  if (kind === 'knowledge.write') return t('aiAssistant.chatPage.hostProposals.kindKnowledge');
  return t('aiAssistant.chatPage.hostProposals.kindTask');
}
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
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 space-y-1">
            <p class="truncate text-sm font-medium text-foreground">
              {{ item.title }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ kindLabel(item.kind) }}
              ·
              {{ t('aiAssistant.chatPage.hostProposals.revision', { revision: item.revision }) }}
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
          <div class="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="busy"
              :data-testid="`ai-host-proposal-reject-${item.source}`"
              @click="emit('reject', item)"
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
              @click="emit('approve', item)"
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
