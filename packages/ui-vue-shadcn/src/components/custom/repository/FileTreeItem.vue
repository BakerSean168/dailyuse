<!--
  Tree Item Component for FileExplorer - shadcn/ui version
-->

<template>
  <div class="select-none">
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
      :class="{ 'bg-accent': isSelected }"
      @click="handleClick"
    >
      <Button
        variant="ghost"
        size="icon"
        class="h-5 w-5 shrink-0"
        @click.stop="$emit('toggle', item.uuid)"
      >
        <ChevronRight class="h-4 w-4 transition-transform" :class="{ 'rotate-90': isOpen }" />
      </Button>

      <component
        :is="isOpen ? FolderOpen : Folder"
        class="h-4 w-4 shrink-0"
      />

      <span class="text-sm flex-1 truncate">{{ item.title }}</span>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6 opacity-0 group-hover:opacity-100"
            @click.stop
          >
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click.stop="$emit('create-subfolder', item.raw.uuid)">
            <FolderPlus class="mr-2 h-4 w-4" />
            新建子文件夹
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="$emit('rename', item.raw)">
            <Pencil class="mr-2 h-4 w-4" />
            重命名
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click.stop="$emit('add-bookmark', item.raw)">
            <Bookmark class="mr-2 h-4 w-4" />
            添加到书签
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive" @click.stop="$emit('delete', item.raw)">
            <Trash2 class="mr-2 h-4 w-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="isOpen && item.children.length > 0" class="ml-4">
      <TreeItem
        v-for="child in item.children"
        :key="child.uuid"
        :item="child"
        :opened-folders="openedFolders"
        :selected-uuid="selectedUuid"
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
  MoreVertical,
  Pencil,
  Bookmark,
  Trash2,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FolderClient } from '@dailyuse/contracts/repository';

interface TreeItemData {
  uuid: string;
  title: string;
  children: TreeItemData[];
  raw: FolderClient;
}

interface Props {
  item: TreeItemData;
  openedFolders: string[];
  selectedUuid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedUuid: null,
});

const emit = defineEmits<{
  select: [folder: FolderClient];
  toggle: [uuid: string];
  'create-subfolder': [parentUuid: string];
  rename: [folder: FolderClient];
  delete: [folder: FolderClient];
  'add-bookmark': [folder: FolderClient];
}>();

const isOpen = computed(() => props.openedFolders.includes(props.item.uuid));
const isSelected = computed(() => props.selectedUuid === props.item.uuid);

function handleClick() {
  emit('select', props.item.raw);
}
</script>
