<!--
  Tree Item Component for FileExplorer - shadcn/ui version
-->

<template>
  <div class="select-none">
    <ActionableWrapper :actions="getItemActions()" :show-more-button="false">
      <div
        class="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
        :class="{ 'bg-accent': isSelected }"
        @click="handleClick"
      >
        <Button
          variant="ghost"
          size="icon"
          class="h-5 w-5 shrink-0"
          @click.stop="$emit('toggle', item.id)"
        >
          <ChevronRight class="h-4 w-4 transition-transform" :class="{ 'rotate-90': isOpen }" />
        </Button>

        <component :is="isOpen ? FolderOpen : Folder" class="h-4 w-4 shrink-0" />

        <span class="text-sm flex-1 truncate">{{ item.title }}</span>
      </div>
    </ActionableWrapper>

    <div v-if="isOpen && item.children.length > 0" class="ml-4">
      <TreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :opened-folders="openedFolders"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @create-subfolder="$emit('create-subfolder', $event)"
        @rename="$emit('rename', $event)"
        @delete="$emit('delete', $event)"
        @add-bookmark="$emit('add-bookmark', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Pencil,
  Bookmark,
  Trash2,
} from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

interface TreeItemData {
  id: string;
  title: string;
  children: TreeItemData[];
  raw: FolderClientDTO;
}

const props = withDefaults(
  defineProps<{
    item: TreeItemData;
    openedFolders: string[];
    selectedId?: string | null;
  }>(),
  {
    selectedId: null,
  },
);

const emit = defineEmits<{
  select: [folder: FolderClientDTO];
  toggle: [id: string];
  'create-subfolder': [parentId: string];
  rename: [folder: FolderClientDTO];
  delete: [folder: FolderClientDTO];
  'add-bookmark': [folder: FolderClientDTO];
}>();

const isOpen = computed(() => props.openedFolders.includes(props.item.id));
const isSelected = computed(() => props.selectedId === props.item.id);

function handleClick() {
  emit('select', props.item.raw);
}

function getItemActions(): MenuAction[] {
  return [
    {
      key: 'create-subfolder',
      label: menuLabel('createSubfolder'),
      icon: FolderPlus,
      handler: () => emit('create-subfolder', props.item.raw.id),
    },
    {
      key: 'rename',
      label: menuLabel('rename'),
      icon: Pencil,
      handler: () => emit('rename', props.item.raw),
    },
    {
      key: 'add-bookmark',
      label: menuLabel('addBookmark'),
      icon: Bookmark,
      separator: true,
      handler: () => emit('add-bookmark', props.item.raw),
    },
    {
      key: 'delete',
      label: menuLabel('delete'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => emit('delete', props.item.raw),
    },
  ];
}
</script>
