<!--
  File Explorer Component - shadcn/ui version
-->

<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div v-if="selectedRepository" class="flex items-center gap-1 px-2 py-2 border-b">
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('create-resource')">
        <FilePlus class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('create-folder')">
        <FolderPlus class="h-4 w-4" />
      </Button>
    </div>

    <!-- Empty State -->
    <div v-if="!selectedRepository" class="flex flex-col items-center justify-center flex-1 px-4 py-12 text-center">
      <FolderOff class="w-12 h-12 mb-2 text-muted-foreground/50" />
      <p class="text-sm text-muted-foreground">请先选择一个仓储</p>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex items-center justify-center flex-1">
      <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center flex-1 px-4 text-center">
      <AlertCircle class="w-12 h-12 mb-2 text-destructive" />
      <p class="text-sm text-destructive mb-3">{{ error }}</p>
      <Button size="sm" @click="$emit('refresh')">重试</Button>
    </div>

    <!-- Folder Tree -->
    <div v-else class="flex-1 overflow-y-auto p-2">
      <div v-if="treeItems.length > 0" class="space-y-0.5">
        <TreeItem
          v-for="item in treeItems"
          :key="item.uuid"
          :item="item"
          :opened-folders="openedFolders"
          :selected-uuid="selectedFolderUuid"
          @select="handleSelect"
          @toggle="handleToggle"
          @create-subfolder="$emit('create-folder', $event)"
          @rename="$emit('rename-folder', $event)"
          @delete="$emit('delete-folder', $event)"
          @add-bookmark="$emit('add-bookmark', $event)"
        />
      </div>

      <div v-else class="flex flex-col items-center justify-center py-12 text-center">
        <FolderOff class="w-12 h-12 mb-2 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground mb-3">暂无文件夹</p>
        <Button size="sm" variant="outline" @click="$emit('create-folder')">
          <Plus class="mr-2 h-4 w-4" />
          创建文件夹
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FolderPlus, FilePlus, FolderOff, AlertCircle, Loader2, Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import TreeItem from './FileTreeItem.vue';
import type { FolderClient } from '@dailyuse/contracts/repository';

interface TreeItemData {
  uuid: string;
  title: string;
  children: TreeItemData[];
  raw: FolderClient;
}

interface Props {
  selectedRepository?: string | null;
  folders: FolderClient[];
  isLoading?: boolean;
  error?: string | null;
  selectedFolderUuid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRepository: null,
  isLoading: false,
  error: null,
  selectedFolderUuid: null,
});

const emit = defineEmits<{
  'create-folder': [parentUuid?: string];
  'create-resource': [];
  'rename-folder': [folder: FolderClient];
  'delete-folder': [folder: FolderClient];
  'select-folder': [folder: FolderClient | null];
  'add-bookmark': [folder: FolderClient];
  refresh: [];
}>();

const openedFolders = ref<string[]>([]);

const treeItems = computed(() => {
  return buildTreeItems(props.folders);
});

function buildTreeItems(folders: FolderClient[]): TreeItemData[] {
  const folderMap = new Map<string, TreeItemData>();
  const roots: TreeItemData[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.uuid, {
      uuid: folder.uuid,
      title: folder.name,
      children: [],
      raw: folder,
    });
  });

  folders.forEach((folder) => {
    const node = folderMap.get(folder.uuid);
    if (!node) return;

    if (!folder.parentUuid) {
      roots.push(node);
    } else {
      const parent = folderMap.get(folder.parentUuid);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}

function handleSelect(folder: FolderClient) {
  emit('select-folder', folder);
}

function handleToggle(uuid: string) {
  const index = openedFolders.value.indexOf(uuid);
  if (index > -1) {
    openedFolders.value.splice(index, 1);
  } else {
    openedFolders.value.push(uuid);
  }
}
</script>
