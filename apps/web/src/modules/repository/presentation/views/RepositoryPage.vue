<template>
  <div class="repository-page">
    <!-- 仓库管理 Dialog -->
    <RepositoryManagementDialog
      v-model="managementDialogOpen"
      @repository-selected="handleRepositorySelected"
    />

    <div class="repo-container">
      <!-- 左侧边栏 -->
      <div class="repo-sidebar">
        <!-- 顶部：搜索 -->
        <div class="sidebar-search">
          <v-text-field
            v-model="sidebarSearch"
            density="compact"
            placeholder="搜索文件..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            clearable
          />
        </div>

        <!-- 文件树列表 -->
        <div class="sidebar-content">
          <v-list density="compact">
            <v-list-item
              v-for="folder in folders"
              :key="folder.id"
              :prepend-icon="folder.icon"
              :title="folder.name"
              @click="selectFolder(folder.id)"
            />
          </v-list>

          <v-divider class="my-2" />

          <div class="px-2 text-caption text-medium-emphasis">
            文件 ({{ filteredResources.length }})
          </div>

          <v-list density="compact">
            <v-list-item
              v-for="resource in filteredResources"
              :key="resource.uuid"
              :title="resource.name"
              :subtitle="resource.path"
              @click="selectResource(resource.uuid)"
            >
              <template #prepend>
                <v-icon size="small">mdi-file-document</v-icon>
              </template>
            </v-list-item>

            <v-list-item v-if="filteredResources.length === 0">
              <v-list-item-title class="text-center text-caption text-medium-emphasis">
                暂无文件
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <!-- 底部：切换仓库 -->
        <div class="sidebar-footer">
          <v-divider />
          <v-list-item
            :title="currentRepositoryName"
            :subtitle="currentRepositoryPath"
            density="compact"
            @click="openRepositoryManagement"
          >
            <template #prepend>
              <v-icon>mdi-folder</v-icon>
            </template>
            <template #append>
              <v-icon size="small">mdi-cog</v-icon>
            </template>
          </v-list-item>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="repo-main">
        <!-- 顶部工具栏 -->
        <RepoHeader
          v-model="currentView"
          @search="handleSearch"
          @refresh="handleRefresh"
          @sync="handleSync"
          @export="handleExport"
          @import="handleImport"
        />

        <!-- 内容区域 -->
        <div class="main-content">
          <!-- 预览编辑视图 -->
          <div v-if="currentView === 'preview'" class="preview-view">
            <div class="empty-state">
              <v-icon size="64" color="grey-lighten-1">mdi-file-document-edit-outline</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">编辑器预览</p>
              <p class="text-caption text-medium-emphasis">此功能将在 Editor 模块中实现</p>
            </div>
          </div>

          <!-- 管理视图 -->
          <div v-else class="manage-view">
            <div class="manage-header">
              <h3 class="text-h6">{{ currentFolderName }}</h3>
              <div class="manage-actions">
                <v-btn prepend-icon="mdi-plus" size="small" @click="handleCreateResource">
                  新建
                </v-btn>
                <v-btn
                  prepend-icon="mdi-upload"
                  size="small"
                  variant="outlined"
                  @click="handleImport"
                >
                  导入
                </v-btn>
              </div>
            </div>

            <!-- 卡片网格 -->
            <div class="resource-grid">
              <v-card
                v-for="resource in filteredResources"
                :key="resource.uuid"
                class="resource-card"
                @click="selectResource(resource.uuid)"
              >
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-icon size="32" color="primary">mdi-file-document</v-icon>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          variant="text"
                          size="x-small"
                          v-bind="props"
                        />
                      </template>
                      <v-list density="compact">
                        <v-list-item @click="editResource(resource.uuid)">
                          <v-list-item-title>编辑</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteResource(resource.uuid)">
                          <v-list-item-title>删除</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>

                  <div class="text-subtitle-2 font-weight-bold mb-1">
                    {{ resource.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ resource.path }}
                  </div>
                </v-card-text>
              </v-card>

              <!-- 空状态 -->
              <div v-if="filteredResources.length === 0" class="empty-state">
                <v-icon size="64" color="grey-lighten-1">mdi-folder-open</v-icon>
                <p class="text-body-1 mt-4 text-medium-emphasis">暂无文件</p>
                <v-btn prepend-icon="mdi-plus" class="mt-2" @click="handleCreateResource">
                  创建第一个文件
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryStore } from '../stores/repositoryStore';
import { useMessage, useGlobalLoading } from '@dailyuse/ui-vuetify';
import { repositoryApplicationService } from '@dailyuse/application-client/repository';

const repositoryManagementService = repositoryApplicationService;
const resourceManagementService = repositoryApplicationService;
import RepositoryManagementDialog from '../components/dialogs/RepositoryManagementDialog.vue';
import RepoHeader from '../components/RepoHeader.vue';

const message = useMessage();
const globalLoading = useGlobalLoading();
const repositoryStore = useRepositoryStore();

const { repositories, resources } = storeToRefs(repositoryStore);

// 对话框状态
const managementDialogOpen = ref(false);

// 视图状态
const currentView = ref<'preview' | 'manage'>('preview');
const sidebarSearch = ref('');
const currentFolderId = ref<string | null>(null);

// 模拟文件夹数据
const folders = ref([
  { id: 'all', name: '全部文件', icon: 'mdi-folder-multiple' },
  { id: 'recent', name: '最近使用', icon: 'mdi-clock-outline' },
  { id: 'favorites', name: '收藏夹', icon: 'mdi-star' },
]);

// 当前仓库信息
const currentRepository = computed(() => {
  return repositories.value.find((r) => r.uuid === repositoryStore.selectedRepository);
});

const currentRepositoryName = computed(() => {
  return currentRepository.value?.name || '选择仓库';
});

const currentRepositoryPath = computed(() => {
  return currentRepository.value?.path || '未选择';
});

const currentFolderName = computed(() => {
  const folder = folders.value.find((f) => f.id === currentFolderId.value);
  return folder?.name || '全部文件';
});

// 过滤后的资源
const filteredResources = computed(() => {
  if (!repositoryStore.selectedRepository) return [];

  let filtered = resources.value.filter(
    (r) => r.repositoryUuid === repositoryStore.selectedRepository,
  );

  if (sidebarSearch.value) {
    const query = sidebarSearch.value.toLowerCase();
    filtered = filtered.filter(
      (r) => r.name?.toLowerCase().includes(query) || r.path?.toLowerCase().includes(query),
    );
  }

  return filtered;
});

// 打开仓库管理
function openRepositoryManagement() {
  managementDialogOpen.value = true;
}

// 仓库选中
async function handleRepositorySelected(uuid: string) {
  await loadRepositoryResources(uuid);
}

// 加载仓库资源
async function loadRepositoryResources(repositoryUuid: string) {
  await globalLoading.withLoading(async () => {
    try {
      await resourceManagementService.getRepositoryResources(repositoryUuid);
      message.success('资源加载成功');
    } catch (error: any) {
      message.error(error.message || '加载失败');
    }
  }, '正在加载资源...');
}

// 选择文件夹
function selectFolder(folderId: string) {
  currentFolderId.value = folderId;
}

// 选择资源
function selectResource(uuid: string) {
  repositoryStore.setSelectedResource(uuid);
  if (currentView.value === 'preview') {
    message.info('预览功能在 Editor 模块中实现');
  }
}

// 搜索
function handleSearch(query: string) {
  sidebarSearch.value = query;
}

// 刷新
async function handleRefresh() {
  if (!repositoryStore.selectedRepository) {
    message.warning('请先选择一个仓库');
    return;
  }
  await loadRepositoryResources(repositoryStore.selectedRepository);
}

// 同步
function handleSync() {
  message.info('同步功能开发中');
}

// 导出
function handleExport() {
  message.info('导出功能开发中');
}

// 导入
function handleImport() {
  message.info('导入功能开发中');
}

// 创建资源
function handleCreateResource() {
  message.info('创建资源功能开发中');
}

// 编辑资源
function editResource(uuid: string) {
  message.info('编辑功能开发中');
}

// 删除资源
async function deleteResource(uuid: string) {
  try {
    await message.delConfirm('确定要删除此文件吗？');
    await resourceManagementService.deleteResource(uuid);
    message.success('删除成功');
  } catch {
    // 用户取消
  }
}

// 初始化
onMounted(async () => {
  await globalLoading.withLoading(async () => {
    try {
      await repositoryManagementService.getRepositories();

      // 如果有仓库，自动选择第一个
      if (repositories.value.length > 0 && !repositoryStore.selectedRepository) {
        const firstRepo = repositories.value[0];
        repositoryStore.setSelectedRepository(firstRepo.uuid);
        await loadRepositoryResources(firstRepo.uuid);
      }
    } catch (error: any) {
      message.error(error.message || '初始化失败');
    }
  }, '正在初始化...');
});
</script>

<style scoped>
.repository-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.repo-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.repo-sidebar {
  width: 300px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-surface));
}

.sidebar-search {
  padding: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-footer {
  margin-top: auto;
}

.repo-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.preview-view,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.manage-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.manage-actions {
  display: flex;
  gap: 8px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.resource-card {
  cursor: pointer;
  transition: all 0.2s;
}

.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
