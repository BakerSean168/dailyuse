<!--
  FileTreePanel - Unified file tree panel - shadcn/ui version
  Story 11.1: 统一的文件树面板
-->

<template>
  <div class="flex flex-col h-full bg-background">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 px-2 py-2 border-b">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
      </Button>

      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('toggle-expand-all')">
        <component :is="isAllExpanded ? UnfoldVertical : Maximize2" class="h-4 w-4" />
      </Button>

      <div class="flex-1" />

      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('create-folder')">
        <FolderPlus class="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('create-resource')">
        <FilePlus class="h-4 w-4" />
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Loading -->
      <div
        v-if="isLoading && nodes.length === 0"
        class="flex flex-col items-center justify-center h-full gap-4"
      >
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        <span class="text-sm text-muted-foreground">{{
          t('repository.fileTreePanel.loading')
        }}</span>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!isLoading && nodes.length === 0"
        class="flex flex-col items-center justify-center h-full gap-4 text-center px-4"
      >
        <FolderOpen class="w-12 h-12 text-muted-foreground/50" />
        <span class="text-sm text-muted-foreground">{{ t('repository.fileTreePanel.empty') }}</span>
        <Button size="sm" variant="outline" @click="$emit('create-folder')">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('repository.fileTreePanel.createFolder') }}
        </Button>
      </div>

      <!-- Tree Nodes -->
      <div v-else class="space-y-0.5">
        <TreeNodeItem
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :show-file-info="showFileInfo"
          @select="$emit('select-node', $event)"
          @open="$emit('open-file', $event)"
          @rename="$emit('rename-node', $event)"
          @delete="$emit('delete-node', $event)"
          @create-subfolder="$emit('create-subfolder', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  RefreshCw,
  FolderPlus,
  FilePlus,
  FolderOpen,
  Loader2,
  Plus,
  UnfoldVertical,
  Maximize2,
} from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import TreeNodeItem from './TreeNodeItem.vue';
import type { TreeNode } from '@dailyuse/contracts/repository';

const { t } = useI18n();

interface Props {
  nodes: TreeNode[];
  isLoading?: boolean;
  showFileInfo?: boolean;
  isAllExpanded?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  showFileInfo: false,
  isAllExpanded: false,
});

defineEmits<{
  refresh: [];
  'toggle-expand-all': [];
  'create-folder': [];
  'create-resource': [];
  'select-node': [node: TreeNode];
  'open-file': [node: TreeNode];
  'rename-node': [node: TreeNode];
  'delete-node': [node: TreeNode];
  'create-subfolder': [node: TreeNode];
}>();
</script>
