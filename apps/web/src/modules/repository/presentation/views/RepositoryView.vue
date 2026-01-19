<template>
  <div class="repository-view">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- 侧边栏顶部：视图切换标签 -->
      <div class="sidebar-tabs">
        <v-btn-toggle
          v-model="activeTab"
          mandatory
          density="compact"
          variant="text"
          divided
          class="tab-group"
        >
          <v-btn value="files" size="small">
            <v-icon icon="mdi-folder-outline" />
            <v-tooltip activator="parent" location="bottom">文件</v-tooltip>
          </v-btn>
          <v-btn value="resources" size="small">
            <v-icon icon="mdi-image-multiple-outline" />
            <v-tooltip activator="parent" location="bottom">资源</v-tooltip>
          </v-btn>
          <v-btn value="search" size="small">
            <v-icon icon="mdi-magnify" />
            <v-tooltip activator="parent" location="bottom">搜索</v-tooltip>
          </v-btn>
          <v-btn value="bookmarks" size="small">
            <v-icon icon="mdi-bookmark-outline" />
            <v-tooltip activator="parent" location="bottom">书签</v-tooltip>
          </v-btn>
          <v-btn value="tags" size="small">
            <v-icon icon="mdi-tag-outline" />
            <v-tooltip activator="parent" location="bottom">标签</v-tooltip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <!-- 侧边栏内容区域 -->
      <div class="sidebar-content">
        <!-- 文件树视图 -->
        <FilesPanel
          v-show="activeTab === 'files'"
          ref="filesPanelRef"
          :selected-repository="selectedRepository"
          @create-folder="handleCreateFolder"
          @create-resource="handleCreateResource"
          @rename-folder="handleRenameFolderNode"
          @delete-folder="handleDeleteFolderNode"
          @rename-resource="handleRenameResourceNode"
          @delete-resource="handleDeleteResourceNode"
          @ai-generate-knowledge="handleAIGenerateKnowledge"
        />

        <!-- 资源管理视图 -->
        <ResourcesPanel
          v-if="selectedRepository"
          v-show="activeTab === 'resources'"
          ref="resourcesPanelRef"
          :repository-uuid="selectedRepository"
        />

        <!-- 搜索视图 -->
        <SearchPanel
          v-if="selectedRepository"
          v-show="activeTab === 'search'"
          :repository-uuid="selectedRepository"
          @select="handleSearchResultSelect"
        />

        <!-- 书签视图 -->
        <BookmarksPanel
          v-if="selectedRepository"
          v-show="activeTab === 'bookmarks'"
          :repository-uuid="selectedRepository"
          @select="handleBookmarkSelect"
        />

        <!-- 标签视图 -->
        <TagsPanel
          v-if="selectedRepository"
          v-show="activeTab === 'tags'"
          :repository-uuid="selectedRepository"
          @select="handleTagSelect"
        />
      </div>

      <!-- 底部仓储选择器 (Obsidian 风格) -->
      <div class="repository-selector">
        <v-menu location="top" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              block
              variant="text"
              class="repository-selector-btn"
            >
              <v-icon :icon="currentRepository ? getRepositoryIcon(currentRepository.type) : 'mdi-database-outline'" class="mr-2" />
              <span class="flex-1 text-left">{{ currentRepository?.name || '选择仓储' }}</span>
              <v-icon icon="mdi-chevron-up" size="small" />
            </v-btn>
          </template>

          <v-card min-width="280">
            <v-card-title class="d-flex align-center py-2">
              <span class="text-subtitle-2">切换仓储</span>
              <v-spacer />
              <v-btn
                icon="mdi-plus"
                size="x-small"
                variant="text"
                @click="showCreateRepositoryDialog = true"
              />
            </v-card-title>
            <v-divider />
            
            <!-- 仓储列表 -->
            <v-list v-if="repositories.length > 0" density="compact" max-height="300" class="overflow-y-auto">
              <v-list-item
                v-for="repo in repositories"
                :key="repo.uuid"
                :active="selectedRepository === repo.uuid"
                @click="handleSelectRepository(repo.uuid)"
              >
                <template #prepend>
                  <v-icon :icon="getRepositoryIcon(repo.type)" size="small" />
                </template>
                <v-list-item-title>{{ repo.name }}</v-list-item-title>
                <template #append>
                  <v-menu>
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
                      <v-list-item @click="handleArchiveRepository(repo.uuid)">
                        <template #prepend>
                          <v-icon icon="mdi-archive-outline" size="small" />
                        </template>
                        <v-list-item-title>归档</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="handleDeleteRepository(repo.uuid)">
                        <template #prepend>
                          <v-icon icon="mdi-delete-outline" size="small" color="error" />
                        </template>
                        <v-list-item-title class="text-error">删除</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-list-item>
            </v-list>
            
            <!-- 空状态或管理选项 -->
            <div v-if="repositories.length === 0" class="pa-4 text-center">
              <v-icon icon="mdi-database-off-outline" size="48" class="mb-2 text-disabled" />
              <p class="text-caption text-disabled mb-3">暂无仓储</p>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                block
                @click="showCreateRepositoryDialog = true"
              >
                <v-icon icon="mdi-plus" class="mr-1" />
                创建仓储
              </v-btn>
            </div>
            <template v-else>
              <v-divider />
              <v-list density="compact">
                <v-list-item @click="showCreateRepositoryDialog = true">
                  <template #prepend>
                    <v-icon icon="mdi-cog-outline" size="small" />
                  </template>
                  <v-list-item-title>管理仓储...</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>
          </v-card>
        </v-menu>
      </div>
    </aside>

    <!-- 右侧：资源编辑器 + Tab 管理 (Epic 10 Story 10-2) -->
    <div class="resource-editor-panel">
      <v-card flat class="h-100">
        <!-- Tab 管理器 -->
        <TabManager v-if="hasOpenTabs" />

        <!-- 编辑器 -->
        <div v-if="activeResourceUuid" class="editor-wrapper">
          <ObsidianEditor :resource-uuid="activeResourceUuid" />
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <v-icon icon="mdi-language-markdown" size="64" class="mb-4" color="grey-lighten-1" />
          <p class="text-h6 text-grey">双击资源以打开编辑器</p>
          <p class="text-caption text-grey-lighten-1">支持 Markdown、图片、视频等多种格式</p>
        </div>
      </v-card>
    </div>

    <!-- Dialogs -->
    <CreateRepositoryDialog
      v-model="showCreateRepositoryDialog"
      @created="handleRepositoryCreated"
    />

    <CreateFolderDialog
      v-if="selectedRepository"
      v-model="showCreateFolderDialog"
      :repository-uuid="selectedRepository"
      :parent-uuid="folderParentUuid"
      @created="handleFolderCreated"
    />

    <CreateResourceDialog
      v-if="selectedRepository"
      v-model="showCreateResourceDialog"
      :repository-uuid="selectedRepository"
      :folder-uuid="resourceFolderUuid"
      @created="handleResourceCreated"
    />

    <v-dialog v-model="showRenameFolderDialog" max-width="500" persistent>
      <v-card v-if="folderToRename">
        <v-card-title>重命名文件夹</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="新名称"
            variant="outlined"
            autofocus
            @keyup.enter="handleSubmitRename"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRenameFolderDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="isRenaming" @click="handleSubmitRename">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteFolderDialog" max-width="500">
      <v-card v-if="folderToDelete">
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert-circle-outline" class="mr-2" />
          删除文件夹
        </v-card-title>
        <v-card-text>
          <p>确定要删除文件夹 <strong>{{ folderToDelete.name }}</strong> 吗？</p>
          <p class="text-caption text-disabled mt-2">此操作不可撤销，文件夹及其所有子文件夹都将被删除。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteFolderDialog = false">取消</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="handleSubmitDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- AI 知识文档生成对话框 -->
    <AIKnowledgeGeneratorDialog
      v-model="showAIKnowledgeDialog"
      :repository-uuid="selectedRepository"
      :parent-folder-uuid="aiKnowledgeParentUuid"
      @generated="handleAIKnowledgeGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRepositoryStore, useFolderStore } from '../stores';
import { useResourceStore } from '../stores/resourceStore';
import { getRepositoryApiClient } from '@dailyuse/infrastructure-client';

const repositoryApiClient = getRepositoryApiClient();
import { Repository, Folder } from '@dailyuse/domain-client/repository';
import type { TreeNode } from '@dailyuse/contracts/repository';
import FilesPanel from '../components/FilesPanel.vue';
import ResourcesPanel from '../components/ResourcesPanel.vue';
import SearchPanel from '../components/SearchPanel.vue';
import BookmarksPanel from '../components/BookmarksPanel.vue';
import TagsPanel from '../components/TagsPanel.vue';
import CreateRepositoryDialog from '../components/dialogs/CreateRepositoryDialog.vue';
import CreateFolderDialog from '../components/dialogs/CreateFolderDialog.vue';
import CreateResourceDialog from '../components/dialogs/CreateResourceDialog.vue';
import AIKnowledgeGeneratorDialog from '../components/dialogs/AIKnowledgeGeneratorDialog.vue';
import ObsidianEditor from '../components/ObsidianEditor.vue';
import TabManager from '../components/TabManager.vue';

// Stores
const repositoryStore = useRepositoryStore();
const folderStore = useFolderStore();
const resourceStore = useResourceStore();

// Refs
const filesPanelRef = ref<InstanceType<typeof FilesPanel> | null>(null);
const resourcesPanelRef = ref<InstanceType<typeof ResourcesPanel> | null>(null);

// Local state
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedRepository = ref<string | null>(null);
const selectedFolder = ref<Folder | null>(null);

// 侧边栏标签页状态
const activeTab = ref<'files' | 'resources' | 'search' | 'bookmarks' | 'tags'>('files');

// Dialogs
const showCreateRepositoryDialog = ref(false);
const showCreateFolderDialog = ref(false);
const showCreateResourceDialog = ref(false);
const showRenameFolderDialog = ref(false);
const showDeleteFolderDialog = ref(false);
const showAIKnowledgeDialog = ref(false);

// Folder operations
const folderParentUuid = ref<string | undefined>(undefined);
const resourceFolderUuid = ref<string | null>(null); // 创建资源时的目标文件夹
const aiKnowledgeParentUuid = ref<string | null>(null); // AI 知识生成的父文件夹
const folderToRename = ref<Folder | null>(null);
const folderToDelete = ref<Folder | null>(null);
const newFolderName = ref('');
const isRenaming = ref(false);
const isDeleting = ref(false);

// Computed
const repositories = computed(() => repositoryStore.getAllRepositories);
const currentRepository = computed(() => 
  repositories.value.find(r => r.uuid === selectedRepository.value)
);
const hasOpenTabs = computed(() => resourceStore.openTabs.length > 0);
const activeResourceUuid = computed(() => resourceStore.activeTabUuid);

// Methods
async function loadRepositories() {
  isLoading.value = true;
  error.value = null;

  try {
    // apiClient.get 自动提取 response.data，直接得到 RepositoryClientDTO[]
    const data = await repositoryApiClient.getRepositories();
    // data 可能是数组，也可能是 { repositories: [...] } 格式，需要兼容处理
    const repoList = Array.isArray(data) ? data : (data.repositories || []);
    const repos = repoList.map((dto: any) => Repository.fromClientDTO(dto));
    repositoryStore.setRepositories(repos);

    // 如果有仓储，默认选中第一个
    if (repos.length > 0 && !selectedRepository.value) {
      selectedRepository.value = repos[0].uuid;
    }
  } catch (err: any) {
    error.value = err.message || '加载仓储列表失败';
    console.error('加载仓储列表失败:', err);
  } finally {
    isLoading.value = false;
  }
}

function getRepositoryIcon(type: string): string {
  const iconMap: Record<string, string> = {
    LOCAL: 'mdi-folder-outline',
    GIT: 'mdi-git',
    CLOUD: 'mdi-cloud-outline',
  };
  return iconMap[type] || 'mdi-database-outline';
}

function handleSelectRepository(uuid: string) {
  selectedRepository.value = uuid;
  selectedFolder.value = null;
}

async function handleArchiveRepository(uuid: string) {
  try {
    await repositoryApiClient.archiveRepository(uuid);
    console.log('仓储已归档');
    loadRepositories();
  } catch (err: any) {
    console.error('归档仓储失败:', err);
  }
}

async function handleDeleteRepository(uuid: string) {
  if (!confirm('确定要删除此仓储吗？此操作不可撤销。')) return;

  try {
    await repositoryApiClient.deleteRepository(uuid);
    repositoryStore.removeRepository(uuid);
    folderStore.removeFoldersByRepositoryUuid(uuid);
    
    if (selectedRepository.value === uuid) {
      selectedRepository.value = repositories.value[0]?.uuid || null;
    }
  } catch (err: any) {
    console.error('删除仓储失败:', err);
  }
}

function handleRepositoryCreated(repository: Repository) {
  console.log('仓储已创建:', repository.name);
  // Store已经更新，刷新 UI
  selectedRepository.value = repository.uuid;
}

function handleCreateFolder(parentUuid?: string) {
  folderParentUuid.value = parentUuid;
  showCreateFolderDialog.value = true;
}

function handleFolderCreated(folder: Folder) {
  console.log('文件夹已创建:', folder.name);
  filesPanelRef.value?.refresh();
}

async function handleResourceCreated(resourceUuid: string) {
  console.log('笔记已创建:', resourceUuid);
  // 刷新文件树和资源列表
  filesPanelRef.value?.refresh();
  await resourceStore.loadResources(selectedRepository.value!);
  // 清除创建资源的目标文件夹
  resourceFolderUuid.value = null;
  // 查找并打开新创建的笔记
  const resource = resourceStore.resources.find((r: any) => r.uuid === resourceUuid);
  if (resource) {
    await resourceStore.openInTab(resource);
  }
}

// AI 知识文档生成
function handleAIGenerateKnowledge(parentFolderUuid?: string) {
  aiKnowledgeParentUuid.value = parentFolderUuid || null;
  showAIKnowledgeDialog.value = true;
}

function handleAIKnowledgeGenerated(data: { folderUuid?: string; resourceUuid: string }) {
  console.log('AI 知识文档已生成:', data);
  // 刷新文件树
  filesPanelRef.value?.refresh();
  // 清除状态
  aiKnowledgeParentUuid.value = null;
}

function handleRenameFolder(folder: Folder) {
  folderToRename.value = folder;
  newFolderName.value = folder.name;
  showRenameFolderDialog.value = true;
}

// 处理 TreeNode 类型的文件夹重命名
function handleRenameFolderNode(node: TreeNode) {
  // 转换为兼容 Folder 的格式
  folderToRename.value = { uuid: node.uuid, name: node.name } as Folder;
  newFolderName.value = node.name;
  showRenameFolderDialog.value = true;
}

async function handleSubmitRename() {
  if (!folderToRename.value || !newFolderName.value) return;

  isRenaming.value = true;

  try {
    const updatedFolderDTO = await repositoryApiClient.renameFolder(
      folderToRename.value.uuid,
      newFolderName.value
    );
    const updatedFolder = Folder.fromServerDTO(updatedFolderDTO);
    folderStore.updateFolder(updatedFolder.uuid, updatedFolder);
    showRenameFolderDialog.value = false;
    filesPanelRef.value?.refresh();
  } catch (err: any) {
    console.error('重命名文件夹失败:', err);
  } finally {
    isRenaming.value = false;
  }
}

function handleDeleteFolder(folder: Folder) {
  folderToDelete.value = folder;
  showDeleteFolderDialog.value = true;
}

// 处理 TreeNode 类型的文件夹删除
function handleDeleteFolderNode(node: TreeNode) {
  folderToDelete.value = { uuid: node.uuid, name: node.name } as Folder;
  showDeleteFolderDialog.value = true;
}

// 处理 TreeNode 类型的资源重命名
function handleRenameResourceNode(node: TreeNode) {
  const newName = prompt('请输入新名称:', node.name);
  if (newName && newName !== node.name) {
    // TODO: 实现资源重命名 API
    console.log('重命名资源:', node.uuid, newName);
    filesPanelRef.value?.refresh();
  }
}

// 处理 TreeNode 类型的资源删除
async function handleDeleteResourceNode(node: TreeNode) {
  if (!confirm(`确定要删除 "${node.name}" 吗？`)) return;
  try {
    await resourceStore.deleteResource(node.uuid);
    filesPanelRef.value?.refresh();
  } catch (error) {
    console.error('删除资源失败:', error);
    alert('删除失败，请稍后重试');
  }
}

async function handleSubmitDelete() {
  if (!folderToDelete.value) return;

  isDeleting.value = true;

  try {
    await repositoryApiClient.deleteFolder(folderToDelete.value.uuid);
    folderStore.removeFolder(folderToDelete.value.uuid);
    showDeleteFolderDialog.value = false;
    filesPanelRef.value?.refresh();
  } catch (err: any) {
    console.error('删除文件夹失败:', err);
  } finally {
    isDeleting.value = false;
  }
}

function handleSelectFolder(folder: Folder | null) {
  selectedFolder.value = folder;
}

// 创建资源时支持可选的 folderUuid
function handleCreateResource(folderUuid?: string) {
  // 设置目标文件夹
  resourceFolderUuid.value = folderUuid || null;
  console.log('创建资源，父文件夹:', folderUuid);
  showCreateResourceDialog.value = true;
}

// 搜索相关事件处理
async function handleSearchResultSelect(result: any) {
  console.log('选中搜索结果:', result);
  // 打开搜索结果对应的资源
  if (result.resourceUuid) {
    try {
      await resourceStore.loadResourceById(result.resourceUuid);
      const resource = resourceStore.resources.find(r => r.uuid === result.resourceUuid);
      if (resource) {
        await resourceStore.openInTab(resource);
      }
    } catch (error) {
      console.error('打开搜索结果失败:', error);
    }
  }
}

// 书签相关事件处理
async function handleBookmarkSelect(bookmark: any) {
  console.log('选中书签:', bookmark);
  
  if (bookmark.targetType === 'resource') {
    // 打开资源
    try {
      await resourceStore.loadResourceById(bookmark.targetUuid);
      const resource = resourceStore.resources.find(r => r.uuid === bookmark.targetUuid);
      if (resource) {
        await resourceStore.openInTab(resource);
      }
    } catch (error) {
      console.error('打开书签资源失败:', error);
    }
  } else if (bookmark.targetType === 'folder') {
    // TODO: 展开文件夹（需要 FilesPanel 支持）
    console.log('书签指向文件夹:', bookmark.name);
  }
}

// 标签相关事件处理 (Story 11.5)
function handleTagSelect(resource: any) {
  console.log('从标签打开资源:', resource);
  // TagsPanel 已经处理了资源打开，这里只需要记录
}

// Resource 相关 (Epic 10 Story 10-2)
watch(selectedRepository, async (newRepoUuid) => {
  if (newRepoUuid) {
    try {
      await resourceStore.loadResources(newRepoUuid);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  }
});

// Lifecycle
onMounted(async () => {
  await loadRepositories();
  
  // 如果没有仓储，自动打开欢迎对话框
  if (repositories.value.length === 0) {
    showCreateRepositoryDialog.value = true;
  }
});
</script>

<style scoped>
/* Obsidian 风格布局 */
.repository-view {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .repository-view {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: 768px) {
  .repository-view {
    grid-template-columns: 1fr;
    position: relative;
  }
}

/* 侧边栏 */
.sidebar {
  height: 100%;
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  background: rgb(var(--v-theme-surface));
  z-index: 10;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }
}

/* 侧边栏 Tabs - Obsidian 风格 */
.sidebar-tabs {
  padding: 4px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  flex-shrink: 0;
}

.sidebar-tabs .tab-group {
  width: 100%;
  justify-content: space-around;
}

.sidebar-tabs .v-btn {
  min-width: 36px !important;
  height: 32px !important;
  padding: 0 8px !important;
  border-radius: 4px !important;
  opacity: 0.6;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.sidebar-tabs .v-btn:hover {
  opacity: 1;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.sidebar-tabs .v-btn--active {
  opacity: 1;
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
}

/* 侧边栏内容区 */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* 仓储选择器 - Obsidian 风格 */
.repository-selector {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  padding: 4px;
  flex-shrink: 0;
}

.repository-selector-btn {
  justify-content: flex-start !important;
  text-transform: none !important;
  font-weight: normal !important;
  padding: 8px 12px !important;
  height: auto !important;
  min-height: 40px !important;
  border-radius: 4px !important;
}

.repository-selector-btn:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
}

/* 编辑器面板 */
.resource-editor-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
}

.resource-editor-panel > .v-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 空状态 - Obsidian 风格 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
  opacity: 0.6;
}

.empty-state .v-icon {
  opacity: 0.4;
}

.empty-state p {
  margin: 0;
}

.empty-state .text-h6 {
  font-weight: 400 !important;
  font-size: 1rem !important;
}

.empty-state .text-caption {
  margin-top: 4px;
  opacity: 0.7;
}
</style>
