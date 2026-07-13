<script setup lang="ts">
/**
 * NoteContextPanel — /note/:id 右栏（UI_PAGE_REDESIGN_PLAN §10-10）
 *
 * Tabs: [反链][图谱]。图谱 Tab 默认不激活、点击才渲染
 * （link-index 全量遍历资源有成本，§10-5 延迟初始化）。
 * <lg 由父级降级为底部区域（反链优先，图谱不渲染）。
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-vue-shadcn';
import BacklinkPanel from './BacklinkPanel.vue';
import LinkGraphView from './LinkGraphView.vue';

defineProps<{
  noteId: string;
  /** 窄屏时不渲染图谱 Tab（§10-8） */
  showGraph?: boolean;
}>();

const emit = defineEmits<{
  navigate: [resourceId: string];
  close: [];
}>();

const { t } = useI18n();

const activeTab = ref<'backlinks' | 'graph'>('backlinks');
/** 图谱只在第一次切换到该 Tab 时才挂载 */
const graphActivated = ref(false);

function handleTabChange(value: string | number) {
  activeTab.value = value === 'graph' ? 'graph' : 'backlinks';
  if (value === 'graph') {
    graphActivated.value = true;
  }
}
</script>

<template>
  <Tabs
    :model-value="activeTab"
    class="flex h-full min-h-0 flex-col"
    @update:model-value="handleTabChange"
  >
    <TabsList class="mx-3 mt-2 grid w-auto grid-cols-2">
      <TabsTrigger value="backlinks" data-testid="note-context-tab-backlinks">
        {{ t('editor.noteContext.backlinks') }}
      </TabsTrigger>
      <TabsTrigger v-if="showGraph !== false" value="graph" data-testid="note-context-tab-graph">
        {{ t('editor.noteContext.graph') }}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="backlinks" class="min-h-0 flex-1 overflow-hidden">
      <BacklinkPanel :note-id="noteId" @navigate="emit('navigate', $event)" />
    </TabsContent>

    <TabsContent v-if="showGraph !== false" value="graph" class="min-h-0 flex-1 overflow-hidden">
      <LinkGraphView
        v-if="graphActivated"
        :note-id="noteId"
        @node-click="emit('navigate', $event)"
        @close="emit('close')"
      />
    </TabsContent>
  </Tabs>
</template>
