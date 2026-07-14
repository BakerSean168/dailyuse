<template>
  <div class="border-b border-border bg-background">
    <Tabs :model-value="activeTabValue" @update:model-value="handleActiveTabChange" class="w-full">
      <TabsList class="h-9 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="group relative flex h-9 items-stretch"
          @contextmenu.prevent="handleContextMenu($event, tab)"
        >
          <TabsTrigger
            :value="tab.id"
            class="h-9 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 pr-8 font-normal data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            <component :is="tab.icon" class="mr-2 h-4 w-4 shrink-0" />
            <span class="text-sm">{{ displayName(tab.name) }}</span>
            <div v-if="tab.isDirty" class="ml-2 h-2 w-2 rounded-full bg-warning" />
            <component v-if="tab.isPinned" :is="PinIcon" class="ml-1 h-3 w-3 text-primary" />
          </TabsTrigger>

          <button
            type="button"
            class="absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm hover:bg-accent"
            :aria-label="t('repository.tabs.close')"
            @mousedown.stop.prevent
            @click.stop.prevent="handleCloseTab(tab.id)"
          >
            <component :is="XIcon" class="h-3 w-3" />
          </button>
        </div>
      </TabsList>
    </Tabs>

    <!-- Context Menu -->
    <DropdownMenu v-model:open="contextMenu.show">
      <DropdownMenuTrigger as-child>
        <div
          :style="{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            width: '1px',
            height: '1px',
          }"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="emit('toggle-pin', contextMenu.tab!.id)">
          <component :is="contextMenu.tab?.isPinned ? PinOffIcon : PinIcon" class="mr-2 h-4 w-4" />
          {{ contextMenu.tab?.isPinned ? t('repository.tabs.unpin') : t('repository.tabs.pin') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="emit('close-tab', contextMenu.tab!.id)">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          {{ t('repository.tabs.close') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('close-others', contextMenu.tab!.id)">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          {{ t('repository.tabs.closeOthers') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('close-right', contextMenu.tab!.id)">
          <component :is="ArrowRightIcon" class="mr-2 h-4 w-4" />
          {{ t('repository.tabs.closeRight') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive" @click="emit('close-all')">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          {{ t('repository.tabs.closeAll') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { PinIcon, PinOffIcon, XIcon, ArrowRightIcon } from '@lucide/vue';
import { Tabs, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import { logEditorIssue } from '../../../shared/utils/editor-issue-debug';

export interface ResourceTab {
  id: string;
  name: string;
  icon: Component;
  isDirty: boolean;
  isPinned: boolean;
}

const props = withDefaults(
  defineProps<{
    tabs: ResourceTab[];
    activeTabId?: string | null;
  }>(),
  {
    activeTabId: null,
  },
);

const emit = defineEmits<{
  'switch-tab': [id: string];
  'close-tab': [id: string];
  'toggle-pin': [id: string];
  'close-others': [id: string];
  'close-right': [id: string];
  'close-all': [];
}>();

const activeTabValue = computed(() => props.activeTabId || '');

const { t } = useI18n();

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  tab: null as ResourceTab | null,
});

function displayName(name: string): string {
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}

function handleActiveTabChange(value: string | number) {
  if (typeof value === 'string' && value && value !== props.activeTabId) {
    emit('switch-tab', value);
  }
}

function handleContextMenu(event: MouseEvent, tab: ResourceTab) {
  contextMenu.tab = tab;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.show = true;
}

function handleCloseTab(tabId: string) {
  logEditorIssue('tabs:close-button-click', { tabId });
  emit('close-tab', tabId);
}
</script>
