<template>
  <div class="border-b bg-background">
    <Tabs
      :model-value="String(activeTabIndex)"
      @update:model-value="activeTabIndex = Number($event)"
      class="w-full"
    >
      <TabsList class="h-10 w-full justify-start rounded-none bg-transparent p-0">
        <TabsTrigger
          v-for="(tab, index) in tabs"
          :key="tab.id"
          :value="String(index)"
          @click="handleTabClick(tab)"
          class="relative h-10 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary px-3"
        >
          <component :is="getFileIcon(tab.fileType)" class="h-4 w-4 mr-2" />
          <span class="text-sm max-w-[120px] truncate">{{ tab.title }}</span>

          <div v-if="tab.isDirty" class="w-2 h-2 rounded-full bg-warning ml-1" />

          <Button
            variant="ghost"
            size="icon"
            class="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 hover:bg-accent"
            @click.stop="handleTabClose(tab)"
          >
            <X class="h-3 w-3" />
          </Button>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Tabs, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { FileText, Image, Video, Music, File, X } from 'lucide-vue-next';
import type { EditorTab } from '../types';

const props = withDefaults(
  defineProps<{
    tabs: EditorTab[];
    activeTab?: string;
  }>(),
  {
    activeTab: undefined,
  },
);

const emit = defineEmits<{
  'tab-click': [tab: EditorTab];
  'tab-close': [tab: EditorTab];
  'update:activeTab': [id: string];
}>();

const activeTabIndex = computed({
  get: () => {
    if (!props.activeTab) return 0;
    return props.tabs.findIndex((tab) => tab.id === props.activeTab);
  },
  set: (index: number) => {
    const tab = props.tabs[index];
    if (tab) {
      emit('update:activeTab', tab.id);
    }
  },
});

function handleTabClick(tab: EditorTab) {
  emit('tab-click', tab);
}

function handleTabClose(tab: EditorTab) {
  emit('tab-close', tab);
}

function getFileIcon(fileType: string) {
  const iconMap: Record<string, any> = {
    markdown: FileText,
    image: Image,
    video: Video,
    audio: Music,
  };
  return iconMap[fileType] || File;
}
</script>

<style scoped>
.group:hover .opacity-0 {
  opacity: 1;
}
</style>
