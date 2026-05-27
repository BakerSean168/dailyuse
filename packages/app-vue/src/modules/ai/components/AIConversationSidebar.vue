<template>
  <aside class="hidden min-h-0 w-72 shrink-0 flex-col border-r bg-sidebar md:flex">
    <!-- Header -->
    <div class="flex h-14 items-center border-b px-4">
      <div class="flex items-center gap-2 font-semibold">
        <Bot class="h-5 w-5 text-primary" />
        <span>{{ t('nav.aiChat') }}</span>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="t('aiAssistant.dialogs.chat.newConversation')"
          @click="$emit('new-conversation')"
        >
          <Plus class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="t('aiAssistant.dialogs.chat.refresh')"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          <RefreshCcw class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="t('nav.settings')"
          @click="$emit('open-settings')"
        >
          <Settings2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Conversation list -->
    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <div
        v-for="item in conversations"
        :key="item.id"
        role="button"
        tabindex="0"
        class="group mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
        :class="
          activeConversationId === item.id
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        "
        @click="$emit('select', item)"
        @keydown.enter.prevent="$emit('select', item)"
        @keydown.space.prevent="$emit('select', item)"
      >
        <MessageSquare class="h-4 w-4 shrink-0" />
        <span class="min-w-0 flex-1 truncate">
          {{ item.name || t('common.untitled') }}
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          @click.stop="$emit('delete', item.id)"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>

      <div
        v-if="!conversations.length && !loading"
        class="rounded-lg px-3 py-4 text-sm text-muted-foreground"
      >
        {{ t('aiAssistant.dialogs.chat.noSavedConversations') }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Bot, MessageSquare, Plus, RefreshCcw, Settings2, Trash2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { ConversationSummary } from '../composables/types';

defineProps<{
  conversations: ConversationSummary[];
  activeConversationId: string;
  loading: boolean;
}>();

defineEmits<{
  'new-conversation': [];
  refresh: [];
  'open-settings': [];
  select: [item: ConversationSummary];
  delete: [id: string];
}>();

const { t } = useI18n();
</script>
