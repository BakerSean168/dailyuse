<template>
  <div class="flex flex-col h-full bg-background">
    <EditorTabBar
      v-if="tabs.length > 0"
      :tabs="tabs"
      :active-tab="activeTabId"
      @tab-click="handleTabClick"
      @tab-close="handleTabClose"
      @update:active-tab="activeTabId = $event"
    />

    <div class="flex-1 overflow-hidden">
      <template v-if="activeTab">
        <MarkdownEditor
          v-if="activeTab.fileType === 'markdown'"
          :model-value="activeTab.content ?? ''"
          :placeholder="
            t('editor.container.editingTitle', {
              name: activeTab.title ?? t('editor.container.document'),
            })
          "
          @update:model-value="handleContentChange"
          @change="handleContentChange"
        />

        <MediaViewer
          v-else
          :file-path="activeTab.filePath"
          :file-type="activeTab.fileType"
          :file-name="activeTab.title"
        />
      </template>

      <div v-else class="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText class="h-16 w-16 mb-4" />
        <div class="text-lg font-semibold mb-2">{{ t('editor.container.noOpenFiles') }}</div>
        <div class="text-sm">{{ t('editor.container.noOpenFilesDescription') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileText } from 'lucide-vue-next';
import { useConfirm } from '@dailyuse/ui-vue-shadcn';
import EditorTabBar from './EditorTabBar.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import MediaViewer from './MediaViewer.vue';
import type { EditorOpenFileInput, EditorTab } from '../types';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    initialTabs?: EditorTab[];
  }>(),
  {
    initialTabs: () => [],
  },
);

const emit = defineEmits<{
  'content-change': [tab: EditorTab];
  'tab-close': [tab: EditorTab];
  'save-request': [tab: EditorTab];
}>();

const tabs = ref<EditorTab[]>([...props.initialTabs]);

const activeTabId = ref<string | undefined>(tabs.value.length > 0 ? tabs.value[0].id : undefined);

const activeTab = computed(() => {
  if (!activeTabId.value) return null;
  return tabs.value.find((tab) => tab.id === activeTabId.value) || null;
});

function openFile(file: EditorOpenFileInput) {
  const existingTab = tabs.value.find((tab) => tab.filePath === file.filePath);
  if (existingTab) {
    activeTabId.value = existingTab.id;
    return existingTab;
  }

  const newTab: EditorTab = {
    id: file.id || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: file.title,
    fileType: file.fileType,
    filePath: file.filePath,
    content: file.content || '',
    isDirty: false,
    isPinned: false,
  };

  tabs.value.push(newTab);
  activeTabId.value = newTab.id;

  return newTab;
}

async function closeTab(tabId: string) {
  const index = tabs.value.findIndex((tab) => tab.id === tabId);
  if (index === -1) return;

  const tab = tabs.value[index];

  if (tab.isDirty) {
    const confirmed = await useConfirm({
      title: t('editor.container.unsavedCloseTitle'),
      description: t('editor.container.unsavedCloseConfirm', { name: tab.title }),
      confirmText: t('common.close'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });
    if (!confirmed) return;
  }

  tabs.value.splice(index, 1);
  emit('tab-close', tab);

  if (activeTabId.value === tabId) {
    if (tabs.value.length > 0) {
      const newIndex = Math.min(index, tabs.value.length - 1);
      activeTabId.value = tabs.value[newIndex].id;
    } else {
      activeTabId.value = undefined;
    }
  }
}

async function closeAllTabs() {
  const dirtyTabs = tabs.value.filter((tab) => tab.isDirty);
  if (dirtyTabs.length > 0) {
    const confirmed = await useConfirm({
      title: t('editor.container.unsavedCloseAllTitle'),
      description: t('editor.container.unsavedCloseAllConfirm', { count: dirtyTabs.length }),
      confirmText: t('common.close'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });
    if (!confirmed) return;
  }

  tabs.value = [];
  activeTabId.value = undefined;
}

function handleTabClick(tab: EditorTab) {
  activeTabId.value = tab.id;
}

function handleTabClose(tab: EditorTab) {
  void closeTab(tab.id);
}

function handleContentChange(newContent: string) {
  if (!activeTab.value) return;

  activeTab.value.content = newContent;
  activeTab.value.isDirty = true;

  emit('content-change', activeTab.value);
}

function saveCurrentFile() {
  if (!activeTab.value) return;

  emit('save-request', activeTab.value);
  activeTab.value.isDirty = false;
}

function saveAllFiles() {
  const dirtyTabs = tabs.value.filter((tab) => tab.isDirty);
  dirtyTabs.forEach((tab) => {
    emit('save-request', tab);
    tab.isDirty = false;
  });
}

defineExpose({
  openFile,
  closeTab,
  closeAllTabs,
  saveCurrentFile,
  saveAllFiles,
  tabs,
  activeTab,
});
</script>
