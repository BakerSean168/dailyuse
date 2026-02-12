<template>
  <div class="file-explorer">
    <!-- 顶部工具栏 - 新建文件夹和笔记按钮 -->
    <div v-if="selectedRepository" class="explorer-toolbar">
      <v-btn
        icon="mdi-note-plus-outline"
        size="small"
        variant="text"
        title="新建笔记"
        @click="handleCreateResource"
      />
      <v-btn
        icon="mdi-folder-plus-outline"
        size="small"
        variant="text"
        title="新建文件夹"
        @click="handleCreateFolder"
      />
      <v-spacer />
    </div>

    <div v-if="!selectedRepository" class="empty-prompt">
      <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
      <p class="text-disabled">请先选择一个仓储</p>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <div v-else-if="error" class="error-state">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-2 text-error" />
      <p class="text-error">{{ error }}</p>
      <v-btn color="primary" size="small" @click="loadFolderTree">重试</v-btn>
    </div>

    <div v-else class="folder-tree-container">
      <v-treeview
        v-if="treeItems.length > 0"
        v-model:opened="openedFolders"
        v-model:selected="selectedFolders"
        :items="treeItems"
        item-value="id"
        item-title="title"
        activatable
        open-on-click
        density="compact"
        class="folder-tree"
      >
        <template #prepend="{ item }">
          <v-icon :icon="getFolderIcon(item)" size="small" />
        </template>

        <template #append="{ item }">
          <v-menu location="end">
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-dots-vertical"
                size="x-small"
                variant="text"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            
            <v-list density="compact">
              <v-list-item @click="handleCreateSubfolder(item.raw)">
                <template #prepend>
                  <v-icon icon="mdi-folder-plus-outline" size="small" />
                </template>
                <v-list-item-title>新建子文件夹</v-list-item-title>
              </v-list-item>

              <v-list-item @click="handleRenameFolder(item.raw)">
                <template #prepend>
                  <v-icon icon="mdi-pencil-outline" size="small" />
                </template>
                <v-list-item-title>重命名</v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="handleAddToBookmarks(item.raw)">
                <template #prepend>
                  <v-icon 
                    :icon="bookmarkStore.hasBookmark(item.raw.uuid) ? 'mdi-bookmark' : 'mdi-bookmark-outline'" 
                    :color="bookmarkStore.hasBookmark(item.raw.uuid) ? 'primary' : undefined"
                    size="small"
                  />
                </template>
                <v-list-item-title>
                  {{ bookmarkStore.hasBookmark(item.raw.uuid) ? '已添加书签' : '添加到书签' }}
                </v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="handleDeleteFolder(item.raw)" class="text-error">
                <template #prepend>
                  <v-icon icon="mdi-delete-outline" size="small" color="error" />
                </template>
                <v-list-item-title>删除</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-treeview>

      <div v-else class="empty-folder-state">
        <v-icon icon="mdi-folder-off-outline" size="48" class="mb-2 text-disabled" />
        <p class="text-disabled">暂无文件夹</p>
        <v-btn color="primary" variant="tonal" size="small" @click="handleCreateFolder">
          <v-icon icon="mdi-plus" class="mr-1" />
          创建文件夹
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useFolderStore } from '../stores';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { getRepositoryApiClient } from '@dailyuse/repository/infrastructure-client';

const repositoryApiClient = getRepositoryApiClient();
import { Folder } from '@dailyuse/repository/domain-client';
import type { FolderClient } from '@dailyuse/contracts/repository';

// Props
interface Props {
  selectedRepository?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRepository: null,
});

// Emits
const emit = defineEmits<{
  (e: 'create-folder', parentUuid?: string): void;
  (e: 'create-resource'): void;
  (e: 'rename-folder', folder: FolderClient): void;
  (e: 'delete-folder', folder: FolderClient): void;
  (e: 'select-folder', folder: FolderClient | null): void;
}>();

// Store
const folderStore = useFolderStore();
const bookmarkStore = useBookmarkStore();

// Local state
const isLoading = ref(false);
const error = ref<string | null>(null);
const openedFolders = ref<string[]>([]);
const selectedFolders = ref<string[]>([]);

// Computed
const treeItems = computed(() => {
  if (!props.selectedRepository) return [];

  const folders = folderStore.getFoldersByRepositoryUuid(props.selectedRepository);
  return buildTreeItems(folders);
});

// Methods
async function loadFolderTree() {
  if (!props.selectedRepository) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await repositoryApiClient.getFolderTree(props.selectedRepository);
    const folders = data.map((dto: any) => Folder.fromServerDTO(dto));
    folderStore.setFoldersForRepository(props.selectedRepository!, folders);
  } catch (err: any) {
    error.value = err.message || '加载文件夹树失败';
    console.error('加载文件夹树失败:', err);
  } finally {
    isLoading.value = false;
  }
}

function buildTreeItems(folders: FolderClient[]): any[] {
  const folderMap = new Map<string, any>();
  const roots: any[] = [];

  // 第一遍：创建节点
  folders.forEach((folder) => {
    folderMap.set(folder.uuid, {
      id: folder.uuid,
      title: folder.name,
      children: [],
      raw: folder,
    });
  });

  // 第二遍：构建树形结构
  folders.forEach((folder) => {
    const node = folderMap.get(folder.uuid);
    
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

function getFolderIcon(item: any): string {
  const folder = item.raw as FolderClient;
  
  if (folder.metadata?.icon) {
    return folder.metadata.icon;
  }
  
  return openedFolders.value.includes(item.id)
    ? 'mdi-folder-open-outline'
    : 'mdi-folder-outline';
}

function handleCreateFolder() {
  emit('create-folder');
}

function handleCreateResource() {
  emit('create-resource');
}

function handleCreateSubfolder(folder: FolderClient) {
  emit('create-folder', folder.uuid);
}

function handleRenameFolder(folder: FolderClient) {
  emit('rename-folder', folder);
}

function handleDeleteFolder(folder: FolderClient) {
  emit('delete-folder', folder);
}

function handleAddToBookmarks(folder: FolderClient) {
  if (!props.selectedRepository) return;
  
  if (bookmarkStore.hasBookmark(folder.uuid)) {
    // 已存在，不再添加
    return;
  }
  
  bookmarkStore.addBookmark({
    name: folder.name,
    targetUuid: folder.uuid,
    targetType: 'folder',
    repositoryUuid: props.selectedRepository,
    icon: 'mdi-folder-outline',
  });
  
  console.log('已添加文件夹到书签:', folder.name);
}

// Watchers
watch(
  () => props.selectedRepository,
  (newValue) => {
    if (newValue) {
      loadFolderTree();
    } else {
      openedFolders.value = [];
      selectedFolders.value = [];
    }
  },
  { immediate: true }
);

watch(selectedFolders, (newValue) => {
  if (newValue.length > 0) {
    const folder = folderStore.getFolderByUuid(newValue[0]);
    folderStore.setSelectedFolder(folder?.uuid || null);
    emit('select-folder', folder);
  } else {
    folderStore.setSelectedFolder(null);
    emit('select-folder', null);
  }
});

// Lifecycle
onMounted(() => {
  if (props.selectedRepository) {
    loadFolderTree();
  }
});

// Expose
defineExpose({
  refresh: loadFolderTree,
});
</script>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 工具栏 - Obsidian 风格 */
.explorer-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 状态区域 */
.empty-prompt,
.loading-state,
.error-state,
.empty-folder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

/* 文件夹树容器 */
.folder-tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.folder-tree {
  padding: 8px;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>
