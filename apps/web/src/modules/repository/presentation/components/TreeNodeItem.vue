<script setup lang="ts">
import { TreeNodeItem } from '@dailyuse/ui-vue-shadcn/repository';
import type { TreeNode } from '@dailyuse/contracts/repository';

interface Props {
  node: TreeNode;
  level?: number;
  showFileInfo?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
  open: [node: TreeNode];
  contextMenu: [event: { node: TreeNode; mouseEvent: MouseEvent }];
}>();
</script>

<template>
  <TreeNodeItem
    :node="node"
    :level="level"
    :show-file-info="showFileInfo"
    :selected-uuid="null"
    :expanded-uuids="[]"
    @select="emit('select', $event)"
    @toggle="emit('toggle', $event)"
    @open="emit('open', $event)"
    @context-menu="emit('contextMenu', $event)"
  />
</template>
