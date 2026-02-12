<template>
  <v-container fluid class="repo-detail-container pa-0">
    <!-- 头部导航栏 -->
    <v-toolbar
      :color="`rgba(var(--v-theme-surface))`"
      elevation="2"
      class="repo-detail-header flex-shrink-0 mb-4"
    >
      <v-btn icon @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="text-h6 font-weight-medium">
        {{ repository?.name || '仓库详情' }}
      </v-toolbar-title>

      <v-spacer />

      <!-- 编辑按钮 -->
      <v-btn icon @click="repoDialogRef?.openDialog(repository as Repository)">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

      <!-- 更多功能菜单 -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openInBrowser">
            <template v-slot:prepend>
              <v-icon>mdi-open-in-new</v-icon>
            </template>
            <v-list-item-title>在浏览器中查看</v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportRepository">
            <template v-slot:prepend>
              <v-icon>mdi-export</v-icon>
            </template>
            <v-list-item-title>导出</v-list-item-title>
          </v-list-item>
          <v-list-item @click="startArchiveRepository">
            <template v-slot:prepend>
              <v-icon>mdi-archive</v-icon>
            </template>
            <v-list-item-title>{{ isArchived ? '取消归档' : '归档' }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="startDeleteRepository" class="text-error">
            <template v-slot:prepend>
              <v-icon>mdi-delete</v-icon>
            </template>
            <v-list-item-title>删除</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

    <!-- 主要内容区域 -->
    <div class="main-content flex-grow-1 px-10">
      <div class="content-wrapper">
        <!-- 仓库状态提示卡片 -->
        <v-alert v-if="isArchived" type="warning" variant="tonal" class="mb-6" icon="mdi-archive">
          <template v-slot:title> 仓库已归档 </template>
          <div class="d-flex align-center justify-space-between">
            <span>该仓库当前处于归档状态</span>
            <v-btn color="warning" variant="elevated" size="small" @click="startArchiveRepository">
              取消归档
            </v-btn>
          </div>
        </v-alert>

        <!-- 仓库基本信息卡片 -->
        <v-card class="mb-6 flex-shrink-0" elevation="2">
          <v-card-text class="pa-6">
            <v-row>
              <!-- 仓库图标和基本信息 -->
              <v-col cols="12" md="8">
                <div class="repo-info">
                  <div class="d-flex align-center mb-4">
                    <v-avatar color="primary" size="60" class="mr-4" variant="tonal">
                      <v-icon color="primary" size="30">mdi-folder</v-icon>
                    </v-avatar>
                    <div>
                      <h1 class="text-h4 font-weight-bold mb-2">{{ repository?.name }}</h1>
                      <v-chip :color="getStatusColor()" size="small" variant="tonal" class="mr-2">
                        <v-icon start size="12">{{ getStatusIcon() }}</v-icon>
                        {{ getStatusText() }}
                      </v-chip>
                      <v-chip size="small" variant="outlined">
                        <v-icon start size="12">mdi-tag</v-icon>
                        {{ repository?.type }}
                      </v-chip>
                    </div>
                  </div>

                  <p v-if="repository?.description" class="text-body-1 text-medium-emphasis mb-4">
                    {{ repository.description }}
                  </p>
                </div>
              </v-col>

              <!-- 统计信息 -->
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="stats-card">
                  <v-card-text class="text-center">
                    <div class="mb-4">
                      <div class="text-h3 font-weight-bold primary--text">{{ resourceCount }}</div>
                      <div class="text-caption text-medium-emphasis">资源总数</div>
                    </div>

                    <v-divider class="my-3" />

                    <div class="d-flex justify-space-between text-body-2">
                      <span>创建时间</span>
                      <span>{{ formatDate(repository?.createdAt) }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-body-2 mt-2">
                      <span>更新时间</span>
                      <span>{{ formatDate(repository?.updatedAt) }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 标签页内容 -->
        <v-card class="tabs-card flex-grow-1" elevation="2">
          <v-tabs v-model="activeTab" class="flex-shrink-0">
            <v-tab value="resources">
              <v-icon start>mdi-file-multiple</v-icon>
              资源列表
            </v-tab>
            <v-tab value="editor">
              <v-icon start>mdi-file-document-edit</v-icon>
              编辑器
            </v-tab>
            <v-tab value="settings">
              <v-icon start>mdi-cog</v-icon>
              设置
            </v-tab>
            <v-tab value="activity">
              <v-icon start>mdi-history</v-icon>
              活动记录
            </v-tab>
          </v-tabs>

          <v-divider />

          <div class="tab-content">
            <v-window v-model="activeTab" class="h-100">
              <!-- 资源列表 -->
              <v-window-item value="resources" class="h-100">
                <div class="scrollable-content pa-6">
                  <div class="d-flex justify-space-between align-center mb-4">
                    <h3 class="text-h6 font-weight-medium">资源列表</h3>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="resourceDialogRef?.openDialog()"
                    >
                      添加资源
                    </v-btn>
                  </div>

                  <div v-if="resources.length > 0">
                    <v-row>
                      <v-col
                        v-for="resource in resources"
                        :key="resource.uuid"
                        cols="12"
                        lg="6"
                        xl="4"
                      >
                        <ResourceCard :resource="resource as Resource" />
                      </v-col>
                    </v-row>
                  </div>
                  <v-empty-state
                    v-else
                    icon="mdi-file-multiple-outline"
                    title="暂无资源"
                    text="开始添加资源来组织您的内容"
                  >
                    <template v-slot:actions>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="resourceDialogRef?.openDialog()"
                      >
                        添加第一个资源
                      </v-btn>
                    </template>
                  </v-empty-state>
                </div>
              </v-window-item>

              <!-- 编辑器 -->
              <v-window-item value="editor" class="h-100">
                <div class="editor-wrapper">
                  <EditorContainer
                    ref="editorRef"
                    @content-change="handleContentChange"
                    @save-request="handleSaveRequest"
                  />
                </div>
              </v-window-item>

              <!-- 设置页面 -->
              <v-window-item value="settings" class="h-100">
                <div class="scrollable-content pa-6">
                  <h3 class="text-h6 font-weight-medium mb-4">仓库设置</h3>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined">
                        <v-card-title>访问权限</v-card-title>
                        <!-- <v-card-text>
                                                    <v-switch v-model="repositorySettings.autoSync" label="自动同步"
                                                        color="primary" hide-details class="mb-4" />
                                                    <v-switch v-model="repositorySettings.allowDownload" label="允许下载"
                                                        color="primary" hide-details />
                                                </v-card-text> -->
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-card variant="outlined">
                        <v-card-title>版本控制</v-card-title>
                        <!-- <v-card-text>
                                                    <v-switch v-model="repositorySettings.enableVersionControl"
                                                        label="启用版本控制" color="primary" hide-details />
                                                </v-card-text> -->
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>

              <!-- 活动记录 -->
              <v-window-item value="activity" class="h-100">
                <div class="scrollable-content pa-6">
                  <h3 class="text-h6 font-weight-medium mb-4">活动记录</h3>

                  <v-timeline density="compact" align="start">
                    <v-timeline-item
                      v-for="(activity, index) in activityLog"
                      :key="index"
                      :dot-color="activity.color"
                      size="small"
                    >
                      <template v-slot:icon>
                        <v-icon size="small">{{ activity.icon }}</v-icon>
                      </template>
                      <div>
                        <div class="text-body-2 font-weight-medium">{{ activity.title }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ activity.description }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ formatDate(activity.timestamp) }}
                        </div>
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </div>
              </v-window-item>
            </v-window>
          </div>
        </v-card>
      </div>
    </div>

    <!-- 对话框 -->
    <RepoDialog ref="repoDialogRef" />
    <ResourceDialog ref="resourceDialogRef" />

    <!-- 确认对话框 -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="confirmDialog.show = false"> 取消 </v-btn>
          <v-btn color="error" variant="text" @click="confirmDialog.onConfirm"> 确认 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import { Repository, Resource } from '@dailyuse/repository/domain-client';
import { RepositoryStatus } from '@dailyuse/contracts/repository';
// 组件导入
import RepoDialog from '../components/dialogs/RepoDialog.vue';
import ResourceDialog from '../components/dialogs/ResourceDialog.vue';
import ResourceCard from '../components/cards/ResourceCard.vue';
import { EditorContainer, useEditor, type EditorTab } from '@/modules/editor/presentation';
// composables
import { useRepository } from '../composables/useRepository';
// stores
import { useRepositoryStore } from '../stores/repositoryStore';

const repositoryStore = useRepositoryStore();

interface ActivityItem {
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

const route = useRoute();
const router = useRouter();

// 组件引用
const repoDialogRef = ref<InstanceType<typeof RepoDialog> | null>(null);
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog> | null>(null);
const editorRef = ref<InstanceType<typeof EditorContainer> | null>(null);

// 本地状态
const activeTab = ref('resources');
const repository = ref<Repository | null>(null);
const resources = ref<Resource[]>([]);

// Editor composable
const { setEditorInstance } = useEditor();

// 确认对话框
const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

// 计算属性
const resourceCount = computed(() => resources.value.length);

const isArchived = computed(() => repository.value?.status === RepositoryStatus.ARCHIVED);

const repositorySettings = computed({
  get: () =>
    repository.value?.config || {
      isPublic: false,
      allowDownload: true,
      enableVersioning: false,
    },
  set: (val: any) => {
    // TODO: 实现配置更新
    console.log('Update repository config:', val);
  },
});

// 活动记录（模拟数据）
const activityLog = ref<ActivityItem[]>([
  {
    title: '添加新资源',
    description: '添加了项目需求文档.pdf',
    timestamp: new Date('2024-01-20'),
    icon: 'mdi-file-plus',
    color: 'success',
  },
  {
    title: '编辑仓库信息',
    description: '更新了仓库描述',
    timestamp: new Date('2024-01-18'),
    icon: 'mdi-pencil',
    color: 'info',
  },
  {
    title: '创建仓库',
    description: '创建了项目文档库',
    timestamp: new Date('2024-01-01'),
    icon: 'mdi-plus',
    color: 'primary',
  },
]);

// 方法
const formatDate = (date?: Date | number) => {
  if (!date) return '-';
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm');
};

const getStatusColor = () => {
  switch (repository.value?.status) {
    case RepositoryStatus.ACTIVE:
      return 'success';
    case RepositoryStatus.ARCHIVED:
      return 'warning';
    case RepositoryStatus.DELETED:
      return 'error';
    default:
      return 'primary';
  }
};

const getStatusIcon = () => {
  switch (repository.value?.status) {
    case RepositoryStatus.ACTIVE:
      return 'mdi-check-circle';
    case RepositoryStatus.ARCHIVED:
      return 'mdi-archive';
    case RepositoryStatus.DELETED:
      return 'mdi-delete';
    default:
      return 'mdi-circle';
  }
};

const getStatusText = () => {
  switch (repository.value?.status) {
    case RepositoryStatus.ACTIVE:
      return '活跃';
    case RepositoryStatus.ARCHIVED:
      return '已归档';
    case RepositoryStatus.DELETED:
      return '已删除';
    default:
      return repository.value?.status;
  }
};

const openInBrowser = () => {
  // TODO: 实现在浏览器中打开仓库
  console.log('在浏览器中打开仓库');
};

const exportRepository = () => {
  // TODO: 实现导出仓库功能
  console.log('导出仓库');
};

const startArchiveRepository = () => {
  const action = isArchived.value ? '取消归档' : '归档';
  confirmDialog.title = `确认${action}`;
  confirmDialog.message = `您确定要${action}这个仓库吗？`;
  confirmDialog.onConfirm = () => {
    // TODO: 实现归档/取消归档逻辑
    console.log(`${action}仓库`, repository.value?.uuid);
    confirmDialog.show = false;
  };
  confirmDialog.show = true;
};

const startDeleteRepository = () => {
  confirmDialog.title = '确认删除';
  confirmDialog.message = '您确定要删除这个仓库吗？此操作无法撤销。';
  confirmDialog.onConfirm = () => {
    // TODO: 实现删除逻辑
    console.log('删除仓库', repository.value?.uuid);
    router.push({ name: 'repository' });
    confirmDialog.show = false;
  };
  confirmDialog.show = true;
};

/**
 * 处理编辑器内容变化
 */
const handleContentChange = (tab: EditorTab) => {
  console.log('Content changed:', tab.title);
  // TODO: 可以在这里添加自动保存逻辑
};

/**
 * 处理保存请求
 */
const handleSaveRequest = async (tab: EditorTab) => {
  console.log('Save requested for:', tab.title);
  // TODO: 实现保存到后端的逻辑
  try {
    // await repositoryApiClient.updateResource({
    //     uuid: tab.uuid,
    //     content: tab.content,
    // });
    console.log('File saved successfully');
  } catch (error) {
    console.error('Failed to save file:', error);
  }
};

/**
 * 打开资源进行编辑
 */
const openResourceInEditor = (resource: Resource) => {
  activeTab.value = 'editor';

  // 延迟一下确保编辑器已经渲染
  setTimeout(() => {
    if (editorRef.value) {
      editorRef.value.openFile({
        uuid: resource.uuid,
        title: resource.name,
        fileType: getFileType(resource.type),
        filePath: resource.path,
        content: '', // TODO: 从后端加载内容
      });
    }
  }, 100);
};

/**
 * 根据资源类型获取文件类型
 */
const getFileType = (resourceType: string): 'markdown' | 'image' | 'video' | 'audio' => {
  if (resourceType.includes('markdown') || resourceType.includes('md')) {
    return 'markdown';
  }
  if (resourceType.includes('image') || resourceType.includes('img')) {
    return 'image';
  }
  if (resourceType.includes('video')) {
    return 'video';
  }
  if (resourceType.includes('audio')) {
    return 'audio';
  }
  return 'markdown'; // 默认
};

// 生命周期
onMounted(() => {
  repository.value = repositoryStore.getRepositoryByUuid(route.params.id as string);

  // 设置编辑器实例
  if (editorRef.value) {
    setEditorInstance(editorRef.value);
  }
});
</script>

<style scoped>
.repo-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 0.91) 100%
  );
}

.main-content {
  min-height: 0;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tabs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
}

.stats-card {
  border-radius: 16px;
  transition: all 0.3s ease;
}

.stats-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.repo-info .v-chip {
  transition: all 0.2s ease;
}

.repo-info .v-chip.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.v-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
}

.editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem;
  }

  .content-wrapper {
    padding: 8px;
  }
}
</style>
