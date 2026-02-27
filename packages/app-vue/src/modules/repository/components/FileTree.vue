<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 p-2 border-b border-border">
      <Button variant="ghost" size="icon-sm" @click="$emit('create-resource', undefined)">
        <FilePlus class="h-4 w-4" />
        <TooltipProvider
          ><Tooltip
            ><TooltipTrigger as-child><span class="sr-only">新建笔记</span></TooltipTrigger
            ><TooltipContent>新建笔记</TooltipContent></Tooltip
          ></TooltipProvider
        >
      </Button>
      <Button variant="ghost" size="icon-sm" @click="$emit('create-folder', undefined)">
        <FolderPlus class="h-4 w-4" />
        <TooltipProvider
          ><Tooltip
            ><TooltipTrigger as-child><span class="sr-only">新建文件夹</span></TooltipTrigger
            ><TooltipContent>新建文件夹</TooltipContent></Tooltip
          ></TooltipProvider
        >
      </Button>
      <Button variant="ghost" size="icon-sm" @click="$emit('ai-generate-knowledge', undefined)">
        <Bot class="h-4 w-4" />
        <TooltipProvider
          ><Tooltip
            ><TooltipTrigger as-child><span class="sr-only">AI 生成知识文档</span></TooltipTrigger
            ><TooltipContent>AI 生成知识文档</TooltipContent></Tooltip
          ></TooltipProvider
        >
      </Button>
      <div class="flex-1" />
      <Button variant="ghost" size="icon-sm" :disabled="loading" @click="$emit('refresh')">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </Button>
    </div>

    <!-- Empty state -->
    <div
      v-if="!repositoryId"
      class="flex flex-col items-center justify-center flex-1 p-8 text-center"
    >
      <FolderX class="h-8 w-8 mb-2 text-muted-foreground" />
      <span class="text-sm text-muted-foreground">请先选择仓储</span>
    </div>

    <!-- Loading state -->
    <div
      v-else-if="loading && nodes.length === 0"
      class="flex flex-col items-center justify-center flex-1"
    >
      <Loader2 class="h-6 w-6 animate-spin" />
    </div>

    <!-- Tree content -->
    <div
      v-else
      class="flex-1 overflow-y-auto p-1"
      @contextmenu.prevent="handleEmptyAreaContextMenu"
    >
      <!-- Empty tree -->
      <div
        v-if="nodes.length === 0"
        class="flex flex-col items-center justify-center p-8 text-center"
      >
        <FolderOpen class="h-8 w-8 mb-2 text-muted-foreground" />
        <span class="text-sm text-muted-foreground mb-2">暂无文件夹</span>
        <Button variant="outline" size="sm" @click="$emit('create-folder', undefined)">
          <Plus class="h-3.5 w-3.5 mr-1" />
          创建文件夹
        </Button>
      </div>

      <!-- Tree nodes -->
      <template v-else>
        <FileTreeNode
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :level="0"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="$emit('select-node', $event)"
          @toggle="$emit('toggle-node', $event)"
          @dblclick="$emit('open-resource', $event)"
          @contextmenu="handleNodeContextMenu"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  FilePlus,
  FolderPlus,
  Bot,
  RefreshCw,
  FolderX,
  Loader2,
  FolderOpen,
  Plus,
} from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@dailyuse/ui-vue-shadcn';
import type { TreeNode } from '@dailyuse/contracts/repository';
import FileTreeNode from './FileTreeNode.vue';

interface Props {
  repositoryId: string | null;
  nodes: TreeNode[];
  selectedId: string | null;
  expandedIds: string[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'create-folder': [parentId?: string];
  'create-resource': [folderId?: string];
  'rename-node': [node: TreeNode];
  'delete-node': [node: TreeNode];
  'open-resource': [node: TreeNode];
  'select-node': [node: TreeNode];
  'toggle-node': [node: TreeNode];
  'ai-generate-knowledge': [parentFolderId?: string];
  refresh: [];
}>();

function handleEmptyAreaContextMenu(_event: MouseEvent) {
  // TODO: Implement empty area context menu
}

function handleNodeContextMenu(_event: MouseEvent, _node: TreeNode) {
  // TODO: Implement node context menu
}
</script>
