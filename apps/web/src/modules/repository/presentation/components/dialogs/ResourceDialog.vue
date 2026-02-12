<template>
  <v-dialog :model-value="visible" height="500" width="700" class="resource-dialog" persistent>
    <v-card
      :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }"
      class="px-2 pb-2 d-flex flex-column"
      style="height: 500px"
    >
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4 flex-shrink-0">
        <v-btn variant="elevated" color="red-darken-3" @click="handleCancel">取消</v-btn>
        <span class="text-h5">{{ isEditing ? '编辑资源' : '新建资源' }}</span>
        <v-btn
          color="primary"
          @click="handleSave"
          :disabled="!isFormValid || loading"
          :loading="loading"
        >
          完成
        </v-btn>
      </v-card-title>

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        class="d-flex justify-center align-center flex-shrink-0 mb-2 pa-2"
        :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }"
      >
        <v-tab
          v-for="(tab, index) in tabs"
          :key="index"
          :value="index"
          class="flex-grow-1"
          :style="
            activeTab === index
              ? { backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }
              : {}
          "
        >
          <v-icon :icon="tab.icon" :color="tab.color" class="mr-2" />
          {{ tab.name }}
        </v-tab>
      </v-tabs>

      <v-card-text
        :style="{ backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }"
        class="pa-0 scroll-area"
      >
        <v-window v-model="activeTab" class="h-100 w-90">
          <!-- 基本信息 -->
          <v-window-item :value="0">
            <v-form @submit.prevent class="px-4 py-2">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="resourceName"
                    :rules="nameRules"
                    label="资源名称"
                    placeholder="输入资源名称"
                    required
                  />
                </v-col>
              </v-row>

              <v-select
                v-model="resourceType"
                :items="resourceTypeOptions"
                item-title="text"
                item-value="value"
                label="资源类型"
                required
              >
                <template v-slot:prepend-inner>
                  <v-icon>{{ getResourceTypeIcon(resourceType) }}</v-icon>
                </template>
              </v-select>

              <v-textarea
                v-model="resourceDescription"
                label="资源描述"
                rows="3"
                placeholder="描述这个资源的内容和用途"
              />

              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="resourceFormat"
                    label="文件格式"
                    placeholder="如: PDF, DOCX, MP4"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon>mdi-format-text</v-icon>
                    </template>
                  </v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="resourceSizeDisplay"
                    label="文件大小"
                    placeholder="如: 10MB, 500KB"
                    @update:model-value="parseFileSize"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon>mdi-file</v-icon>
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>

              <v-text-field v-model="resourceUrl" label="资源链接" placeholder="文件路径或网络链接">
                <template v-slot:prepend-inner>
                  <v-icon>mdi-link</v-icon>
                </template>
                <template v-slot:append>
                  <v-btn icon="mdi-folder-open" variant="text" size="small" @click="selectFile" />
                </template>
              </v-text-field>
            </v-form>
          </v-window-item>

          <!-- 标签和分类 -->
          <v-window-item :value="1">
            <div class="tags-section">
              <div class="mb-6">
                <h4 class="text-h6 mb-3">资源标签</h4>
                <v-combobox
                  v-model="resourceTags"
                  label="添加标签"
                  multiple
                  chips
                  clearable
                  hide-details
                  placeholder="输入标签并按回车添加..."
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      closable
                      size="small"
                      :color="getTagColor(item.raw)"
                      variant="tonal"
                    >
                      {{ item.raw }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>

              <div class="mb-6">
                <h4 class="text-h6 mb-3">访问设置</h4>
                <v-row>
                  <v-col cols="6">
                    <v-switch
                      v-model="resourceSettings.isPublic"
                      label="公开访问"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-switch
                      v-model="resourceSettings.allowDownload"
                      label="允许下载"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </div>

              <div class="mb-6">
                <h4 class="text-h6 mb-3">优先级</h4>
                <v-rating
                  v-model="resourcePriority"
                  color="orange"
                  size="large"
                  :length="5"
                  hover
                  half-increments
                />
                <p class="text-caption text-medium-emphasis mt-2">设置资源的重要程度（1-5星）</p>
              </div>

              <v-alert type="info" variant="tonal" class="mt-4" density="compact">
                <template v-slot:prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                使用标签来组织和快速找到你的资源
              </v-alert>
            </div>
          </v-window-item>

          <!-- 高级设置 -->
          <v-window-item :value="2">
            <div class="advanced-section">
              <v-row>
                <v-col cols="12">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="pb-2">
                      <v-icon color="primary" class="mr-2">mdi-link</v-icon>
                      链接设置
                    </v-card-title>
                    <v-card-text>
                      <v-text-field
                        v-model="resourceViewUrl"
                        label="查看链接"
                        placeholder="用于在线查看的URL"
                        density="comfortable"
                      />

                      <v-text-field
                        v-model="resourceDownloadUrl"
                        label="下载链接"
                        placeholder="用于下载的URL"
                        density="comfortable"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <v-card variant="outlined">
                    <v-card-title class="pb-2">
                      <v-icon color="success" class="mr-2">mdi-note</v-icon>
                      备注信息
                    </v-card-title>
                    <v-card-text>
                      <v-textarea
                        v-model="resourceNote"
                        label="备注"
                        placeholder="其他说明信息或使用注意事项"
                        rows="4"
                        density="comfortable"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Resource } from '@dailyuse/repository/domain-client';
import { ResourceType, ResourceStatus, type RepositoryClientDTO, type ResourceClientDTO, type FolderClientDTO } from '@dailyuse/contracts/repository';
// composables
import { useRepository } from '../../composables/useRepository';

const { createResource, updateResource, deleteResource } = useRepository();

// Props and Events
const visible = ref(false);
const propResource = ref<Resource | null>(null);
const loading = ref(false);

// 使用一个可变的数据对象，而不是直接使用 Resource 实体
const resourceData = ref<{
  uuid?: string;
  repositoryUuid: string;
  name: string;
  description?: string;
  type: ResourceType;
  path: string;
  size: number;
  author?: string;
  version?: string;
  tags: string[];
  category?: string;
  status: ResourceStatus;
  metadata: {
    mimeType?: string;
    encoding?: string;
    thumbnailPath?: string;
    isFavorite?: boolean;
    accessCount?: number;
    lastAccessedAt?: Date;
    [key: string]: any;
  };
}>({
  repositoryUuid: '',
  name: '',
  description: '',
  type: ResourceType.MARKDOWN,
  path: '',
  size: 0,
  author: '',
  version: '',
  tags: [],
  category: '',
  status: ResourceStatus.ACTIVE,
  metadata: {
    isFavorite: false,
    accessCount: 0,
  },
});

const isEditing = computed(() => !!propResource.value);

// 监听弹窗和传入对象，初始化本地对象
watch(
  [() => visible.value, () => propResource.value],
  ([visible, resource]) => {
    if (visible) {
      if (resource) {
        resourceData.value = {
          uuid: resource.uuid,
          repositoryUuid: resource.repositoryUuid,
          name: resource.name,
          description: '',
          type: resource.type,
          path: resource.path,
          size: resource.size,
          author: '',
          version: '',
          tags: [],
          category: '',
          status: resource.status,
          metadata: { ...(resource.metadata as Record<string, any>) },
        };
      } else {
        resourceData.value = {
          repositoryUuid: '',
          name: '',
          description: '',
          type: ResourceType.MARKDOWN,
          path: '',
          size: 0,
          author: '',
          version: '',
          tags: [],
          category: '',
          status: ResourceStatus.ACTIVE,
          metadata: {
            isFavorite: false,
            accessCount: 0,
          },
        };
      }
    }
  },
  { immediate: true },
);

// Tabs
const activeTab = ref(0);
const tabs = [
  { name: '基本信息', icon: 'mdi-information', color: 'primary' },
  { name: '标签分类', icon: 'mdi-tag', color: 'success' },
  { name: '高级设置', icon: 'mdi-cog', color: 'warning' },
];

// 表单选项
const resourceTypeOptions = [
  { text: 'Markdown文档', value: ResourceType.MARKDOWN },
  { text: 'PDF文档', value: ResourceType.PDF },
  { text: '图片', value: ResourceType.IMAGE },
  { text: '视频', value: ResourceType.VIDEO },
  { text: '音频', value: ResourceType.AUDIO },
  { text: '代码', value: ResourceType.CODE },
  { text: '链接', value: ResourceType.LINK },
  { text: '其他', value: ResourceType.OTHER },
];

// 校验规则
const nameRules = [(value: string) => !!value || '资源名称不能为空'];

// 表单字段的 getter/setter
const resourceName = computed({
  get: () => resourceData.value.name,
  set: (val: string) => {
    resourceData.value.name = val;
  },
});

const resourceDescription = computed({
  get: () => resourceData.value.description || '',
  set: (val: string) => {
    resourceData.value.description = val;
  },
});

const resourceType = computed({
  get: () => resourceData.value.type,
  set: (val: ResourceType) => {
    resourceData.value.type = val;
  },
});

const resourceFormat = computed({
  get: () => resourceData.value.metadata.mimeType || '',
  set: (val: string) => {
    resourceData.value.metadata.mimeType = val;
  },
});

const resourceSizeDisplay = ref('');

const resourceUrl = computed({
  get: () => resourceData.value.path,
  set: (val: string) => {
    resourceData.value.path = val;
  },
});

const resourceViewUrl = computed({
  get: () => resourceData.value.metadata.viewUrl || '',
  set: (val: string) => {
    resourceData.value.metadata.viewUrl = val;
  },
});

const resourceDownloadUrl = computed({
  get: () => resourceData.value.metadata.downloadUrl || '',
  set: (val: string) => {
    resourceData.value.metadata.downloadUrl = val;
  },
});

const resourceTags = computed({
  get: () => resourceData.value.tags,
  set: (val: string[]) => {
    resourceData.value.tags = val;
  },
});

const resourceSettings = computed({
  get: () => ({
    isPublic: resourceData.value.metadata.isPublic || false,
    allowDownload: resourceData.value.metadata.allowDownload || true,
  }),
  set: (val: any) => {
    resourceData.value.metadata = {
      ...resourceData.value.metadata,
      isPublic: val.isPublic,
      allowDownload: val.allowDownload,
    };
  },
});

const resourcePriority = computed({
  get: () => resourceData.value.metadata.priority || 3,
  set: (val: number) => {
    resourceData.value.metadata.priority = val;
  },
});

const resourceNote = computed({
  get: () => resourceData.value.metadata.note || '',
  set: (val: string) => {
    resourceData.value.metadata.note = val;
  },
});

// 工具方法
const getResourceTypeIcon = (type: ResourceType) => {
  switch (type) {
    case ResourceType.MARKDOWN:
      return 'mdi-file-document';
    case ResourceType.PDF:
      return 'mdi-file-pdf-box';
    case ResourceType.IMAGE:
      return 'mdi-image';
    case ResourceType.VIDEO:
      return 'mdi-video';
    case ResourceType.AUDIO:
      return 'mdi-music';
    case ResourceType.CODE:
      return 'mdi-code-tags';
    case ResourceType.LINK:
      return 'mdi-link';
    default:
      return 'mdi-file';
  }
};

const getTagColor = (tag: string) => {
  // 简单的颜色分配算法
  const colors = ['primary', 'success', 'info', 'warning', 'error', 'purple', 'indigo', 'teal'];
  const index = tag.length % colors.length;
  return colors[index];
};

const parseFileSize = (sizeStr: string) => {
  if (!sizeStr) {
    resourceData.value.size = 0;
    return;
  }

  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toLowerCase();

    const multipliers: { [key: string]: number } = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
      tb: 1024 * 1024 * 1024 * 1024,
    };

    resourceData.value.size = value * (multipliers[unit] || 1);
  }
};

const selectFile = async () => {
  // TODO: 实现文件选择逻辑
  console.log('选择文件');
};

// 表单有效性
const isFormValid = computed(() => {
  return !!resourceName.value?.trim() && !!resourceData.value.repositoryUuid;
});

// 保存和取消
const handleSave = async () => {
  if (!isFormValid.value) return;

  try {
    loading.value = true;

    if (isEditing.value && resourceData.value.uuid) {
      // 更新资源
      await updateResource(resourceData.value.uuid, {
        uuid: resourceData.value.uuid,
        name: resourceData.value.name,
        description: resourceData.value.description,
        tags: resourceData.value.tags,
        category: resourceData.value.category,
        status: resourceData.value.status,
      });
    } else {
      // 创建资源
      await createResource({
        repositoryUuid: resourceData.value.repositoryUuid,
        name: resourceData.value.name,
        description: resourceData.value.description,
        type: resourceData.value.type,
        path: resourceData.value.path,
        tags: resourceData.value.tags,
        category: resourceData.value.category,
      });
    }

    closeDialog();
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  closeDialog();
};

const closeDialog = () => {
  visible.value = false;
};

const openDialog = (resource?: Resource, repositoryUuid?: string) => {
  propResource.value = resource || null;
  if (repositoryUuid && !resource) {
    resourceData.value.repositoryUuid = repositoryUuid;
  }
  visible.value = true;
};

watch(
  () => visible.value,
  (newVal) => {
    if (!newVal) {
      // 重置表单
      propResource.value = null;
      activeTab.value = 0;
      loading.value = false;
      resourceSizeDisplay.value = '';
    }
  },
);

defineExpose({
  openDialog,
});
</script>

<style scoped>
.resource-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
}

.v-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
  overflow-y: auto;
}

.v-tab {
  text-transform: none;
  font-weight: 500;
  border-radius: 12px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.v-tab:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-text-field,
.v-textarea,
.v-select {
  margin-bottom: 8px;
}

.v-card[variant='outlined'] {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.v-card[variant='outlined']:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tags-section,
.advanced-section {
  padding: 16px 0;
}

@media (max-width: 768px) {
  .v-dialog {
    width: 95vw !important;
    height: 90vh !important;
    max-width: none !important;
  }
}
</style>

