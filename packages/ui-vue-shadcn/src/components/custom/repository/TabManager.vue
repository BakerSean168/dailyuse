<template>
  <div class="border-b border-border bg-background">
    <Tabs v-model="localActiveTab" class="w-full">
      <TabsList class="h-9 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.id"
          :value="tab.id"
          class="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-normal data-[state=active]:border-primary data-[state=active]:shadow-none"
          @click="emit('switch-tab', tab.id)"
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
            @click.stop="emit('close-tab', tab.id)"
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
          {{ contextMenu.tab?.isPinned ? '取消固定' : '固定' }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="emit('close-tab', contextMenu.tab!.id)">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          关闭
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('close-others', contextMenu.tab!.id)">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          关闭其他
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('close-right', contextMenu.tab!.id)">
          <component :is="ArrowRightIcon" class="mr-2 h-4 w-4" />
          关闭右侧
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive" @click="emit('close-all')">
          <component :is="XIcon" class="mr-2 h-4 w-4" />
          关闭所有
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { FileIcon, PinIcon, PinOffIcon, XIcon, ArrowRightIcon } from 'lucide-vue-next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ResourceTab {
  id: string;
  name: string;
  icon: any;
  isDirty: boolean;
  isPinned: boolean;
}

interface Props {
  tabs: ResourceTab[];
  activeTabId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  activeTabId: null,
});

const emit = defineEmits<{
  'switch-tab': [id: string];
  'close-tab': [id: string];
  'toggle-pin': [id: string];
  'close-others': [id: string];
  'close-right': [id: string];
  'close-all': [];
}>();

const localActiveTab = computed({
  get: () => props.activeTabId || '',
  set: (value) => {
    if (value) emit('switch-tab', value);
  },
});

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  tab: null as ResourceTab | null,
});

function displayName(name: string): string {
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}

function handleContextMenu(event: MouseEvent, tab: ResourceTab) {
  contextMenu.tab = tab;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.show = true;
}
</script>
