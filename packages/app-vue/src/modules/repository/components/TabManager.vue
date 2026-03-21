<template>
  <div class="border-b border-border bg-background">
    <Tabs :model-value="activeTabValue" @update:model-value="handleActiveTabChange" class="w-full">
      <TabsList class="h-9 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.id"
          :value="tab.id"
          class="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-normal data-[state=active]:border-primary data-[state=active]:shadow-none"
          @contextmenu.prevent="handleContextMenu($event, tab)"
        >
          <component :is="tab.icon" class="mr-2 h-4 w-4" />
          <span class="text-sm">{{ displayName(tab.name) }}</span>

          <!-- Dirty indicator -->
          <div v-if="tab.isDirty" class="ml-2 h-2 w-2 rounded-full bg-warning" />

          <!-- Pin indicator -->
          <component v-if="tab.isPinned" :is="PinIcon" class="ml-1 h-3 w-3 text-primary" />

          <!-- Close button -->
          <Button
            variant="ghost"
            size="icon"
            class="ml-2 h-4 w-4 p-0 hover:bg-accent"
            @mousedown.stop.prevent
            @click.stop.prevent="emit('close-tab', tab.id)"
          >
            <component :is="XIcon" class="h-3 w-3" />
          </Button>
        </TabsTrigger>
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
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileIcon, PinIcon, PinOffIcon, XIcon, ArrowRightIcon } from 'lucide-vue-next';
import { Tabs, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';

export interface ResourceTab {
  id: string;
  name: string;
  icon: any;
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
</script>
