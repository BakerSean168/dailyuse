<template>
  <v-dialog :model-value="visible" height="550" width="800" class="repo-dialog" persistent>
    <v-card
      :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }"
      class="px-2 pb-2 d-flex flex-column"
      style="height: 550px"
    >
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4 flex-shrink-0">
        <v-btn variant="elevated" color="red-darken-3" @click="handleCancel">取消</v-btn>
        <span class="text-h5">{{ isEditing ? '编辑仓库' : '新建仓库' }}</span>
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
                    v-model="repositoryName"
                    :rules="nameRules"
                    label="仓库名称"
                    placeholder="输入仓库名称"
                    required
                  />
                </v-col>
              </v-row>

              <v-select
                v-model="repositoryType"
                :items="repositoryTypeOptions"
                item-title="text"
                item-value="value"
                label="仓库类型"
                required
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-folder-outline</v-icon>
                </template>
              </v-select>

              <v-textarea
                v-model="repositoryDescription"
                label="仓库描述"
                rows="3"
                placeholder="描述这个仓库的用途和内容"
              />

              <v-text-field
                v-model="repositoryLocation"
                label="存储位置"
                placeholder="文件系统路径或远程URL"
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-folder</v-icon>
                </template>
                <template v-slot:append>
                  <v-btn icon="mdi-folder-open" variant="text" size="small" @click="selectFolder" />
                </template>
              </v-text-field>

              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="repositoryStatus"
                    :items="statusOptions"
                    item-title="text"
                    item-value="value"
                    label="状态"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon>mdi-circle</v-icon>
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- 关联目标 -->
          <v-window-item :value="1">
            <div class="related-goals-section">
              <div
                v-if="repositoryData.relatedGoals && repositoryData.relatedGoals.length > 0"
                class="mb-4"
              >
                <h4 class="text-h6 mb-3">
                  已关联的目标 ({{ repositoryData.relatedGoals.length }})
                </h4>
                <v-list>
                  <v-list-item
                    v-for="(goalUuid, index) in repositoryData.relatedGoals"
                    :key="`goal-${index}`"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-target</v-icon>
                    </template>
                    <v-list-item-title>{{ getGoalTitle(goalUuid) }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        size="small"
                        @click="removeRelatedGoal(goalUuid)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-target-variant</v-icon>
                <h4 class="text-h6 text-medium-emphasis mb-2">还没有关联目标</h4>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  关联目标可以帮助跟踪仓库与项目目标的关系
                </p>
              </div>

              <v-select
                v-model="selectedGoalToAdd"
                :items="availableGoals"
                item-title="name"
                item-value="uuid"
                label="选择要关联的目标"
                clearable
                @update:model-value="addRelatedGoal"
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-target</v-icon>
                </template>
              </v-select>

              <v-alert type="info" variant="tonal" class="mt-4" density="compact">
                <template v-slot:prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                建议关联相关的项目目标，便于统一管理和追踪进度
              </v-alert>
            </div>
          </v-window-item>

          <!-- 设置与权限 -->
          <v-window-item :value="2">
            <div class="settings-section">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="primary" class="mr-2">mdi-cog</v-icon>
                      访问设置
                    </v-card-title>
                    <v-card-text>
                      <v-switch
                        v-model="repositorySettings.autoSync"
                        label="自动同步"
                        color="primary"
                        hide-details
                        class="mb-4"
                      />

                      <v-switch
                        v-model="repositorySettings.enableGit"
                        label="启用 Git"
                        color="primary"
                        hide-details
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="success" class="mr-2">mdi-tag</v-icon>
                      标签管理
                    </v-card-title>
                    <v-card-text>
                      <v-combobox
                        v-model="repositoryTags"
                        label="标签"
                        multiple
                        chips
                        clearable
                        hide-details
                        placeholder="添加标签..."
                      >
                        <template v-slot:chip="{ props, item }">
                          <v-chip
                            v-bind="props"
                            closable
                            size="small"
                            color="primary"
                            variant="tonal"
                          >
                            {{ item.raw }}
                          </v-chip>
                        </template>
                      </v-combobox>
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
import { ref, computed, watch, onMounted } from 'vue';
import { Repository } from '@dailyuse/repository/domain-client';
import { RepositoryStatus, RepositoryType, type RepositoryClientDTO, type ResourceClientDTO, type FolderClientDTO } from '@dailyuse/contracts/repository';
// composables
import { useRepository } from '../../composables/useRepository';

const { createRepository, updateRepository } = useRepository();

// Events
const emit = defineEmits<{
  success: [];
}>();

// Props and Events
const visible = ref(false);
const propRepository = ref<Repository | null>(null);
const loading = ref(false);

// 使用一个可变的数据对象，而不是直接使用 Repository 实体
const repositoryData = ref<{
  uuid?: string;
  name: string;
  description?: string;
  type: RepositoryType;
  path: string;
  status: RepositoryStatus;
  relatedGoals: string[];
  config: {
    enableGit: boolean;
    autoSync: boolean;
  };
  tags: string[];
}>({
  name: '',
  description: '',
  type: RepositoryType.MARKDOWN,
  path: '',
  status: RepositoryStatus.ACTIVE,
  relatedGoals: [],
  config: {
    enableGit: false,
    autoSync: false,
  },
  tags: [],
});

const isEditing = computed(() => !!propRepository.value);

// 监听弹窗和传入对象，初始化本地对象
watch(
  [() => visible.value, () => propRepository.value],
  ([visible, repository]) => {
    if (visible) {
      if (repository) {
        repositoryData.value = {
          uuid: repository.uuid,
          name: repository.name,
          description: repository.description ?? '',
          type: repository.type,
          path: repository.path,
          status: repository.status,
          relatedGoals: [],
          config: {
            enableGit: repository.config?.enableGit ?? false,
            autoSync: repository.config?.autoSync ?? false,
          },
          tags: [], // TODO: 从 Repository 实体中获取 tags
        };
      } else {
        repositoryData.value = {
          name: '',
          description: '',
          type: RepositoryType.MARKDOWN,
          path: '',
          status: RepositoryStatus.ACTIVE,
          relatedGoals: [],
          config: {
            enableGit: false,
            autoSync: false,
          },
          tags: [],
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
  { name: '关联目标', icon: 'mdi-target', color: 'success' },
  { name: '设置标签', icon: 'mdi-cog', color: 'warning' },
];

// 表单选项
const repositoryTypeOptions = [
  { text: 'Markdown 仓库', value: RepositoryType.MARKDOWN },
  { text: '代码仓库', value: RepositoryType.CODE },
  { text: '混合仓库', value: RepositoryType.MIXED },
];

const statusOptions = [
  { text: '活跃', value: RepositoryStatus.ACTIVE },
  { text: '已删除', value: RepositoryStatus.DELETED },
  { text: '已归档', value: RepositoryStatus.ARCHIVED },
];

// 校验规则
const nameRules = [(value: string) => !!value || '仓库名称不能为空'];

// 表单字段的 getter/setter
const repositoryName = computed({
  get: () => repositoryData.value.name,
  set: (val: string) => {
    repositoryData.value.name = val;
  },
});

const repositoryDescription = computed({
  get: () => repositoryData.value.description || '',
  set: (val: string) => {
    repositoryData.value.description = val;
  },
});

const repositoryType = computed({
  get: () => repositoryData.value.type,
  set: (val: RepositoryType) => {
    repositoryData.value.type = val;
  },
});

const repositoryLocation = computed({
  get: () => repositoryData.value.path,
  set: (val: string) => {
    repositoryData.value.path = val;
  },
});

const repositoryStatus = computed({
  get: () => repositoryData.value.status,
  set: (val: RepositoryStatus) => {
    repositoryData.value.status = val;
  },
});

const repositorySettings = computed({
  get: () => repositoryData.value.config,
  set: (val: any) => {
    repositoryData.value.config = { ...repositoryData.value.config, ...val };
  },
});

const repositoryTags = computed({
  get: () => repositoryData.value.tags,
  set: (val: string[]) => {
    repositoryData.value.tags = val;
  },
});

// 关联目标相关
const selectedGoalToAdd = ref<string | null>(null);

// TODO: 这里应该从目标服务获取可用目标列表
const availableGoals = ref<{ uuid: string; name: string }[]>([
  { uuid: 'goal-1', name: '学习Vue 3' },
  { uuid: 'goal-2', name: '完成项目开发' },
  { uuid: 'goal-3', name: '提升编程技能' },
]);

const addRelatedGoal = (goalUuid: string | null) => {
  if (goalUuid && !repositoryData.value.relatedGoals?.includes(goalUuid)) {
    repositoryData.value.relatedGoals.push(goalUuid);
    selectedGoalToAdd.value = null;
  }
};

const removeRelatedGoal = (goalUuid: string) => {
  repositoryData.value.relatedGoals = repositoryData.value.relatedGoals.filter(
    (id) => id !== goalUuid,
  );
};

const getGoalTitle = (goalUuid: string) => {
  const goal = availableGoals.value.find((g) => g.uuid === goalUuid);
  return goal ? goal.name : `目标-${goalUuid.slice(0, 8)}`;
};

// 其他方法
const selectFolder = async () => {
  // TODO: 实现文件夹选择逻辑
  console.log('选择文件夹');
};

// 表单有效性
const isFormValid = computed(() => {
  return !!repositoryName.value?.trim() && !!repositoryLocation.value?.trim();
});

// 保存和取消
const handleSave = async () => {
  if (!isFormValid.value) return;

  try {
    loading.value = true;

    if (isEditing.value && repositoryData.value.uuid) {
      // 更新仓库
      await updateRepository(repositoryData.value.uuid, {
        uuid: repositoryData.value.uuid,
        name: repositoryData.value.name,
        path: repositoryData.value.path,
        type: repositoryData.value.type,
        description: repositoryData.value.description,
        relatedGoals: repositoryData.value.relatedGoals,
        status: repositoryData.value.status,
      });
    } else {
      // 创建仓库
      await createRepository({
        name: repositoryData.value.name,
        path: repositoryData.value.path,
        type: repositoryData.value.type,
        description: repositoryData.value.description,
        relatedGoals: repositoryData.value.relatedGoals,
      });
    }

    closeDialog();
    // 发射成功事件，通知父组件刷新数据
    emit('success');
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

const openDialog = (repository?: Repository) => {
  propRepository.value = repository || null;
  visible.value = true;
};

watch(
  () => visible.value,
  (newVal) => {
    if (!newVal) {
      // 重置表单
      propRepository.value = null;
      activeTab.value = 0;
      loading.value = false;
      selectedGoalToAdd.value = null;
    }
  },
);

defineExpose({
  openDialog,
});
</script>

<style scoped>
.repo-dialog {
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

.v-list-item {
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.related-goals-section,
.settings-section {
  padding: 16px 0;
}

@media (max-width: 768px) {
  .v-dialog {
    width: 95vw !important;
    height: 90vh !important;
    max-width: none !important;
  }

  .settings-section .v-row {
    flex-direction: column;
  }

  .settings-section .v-col {
    max-width: 100%;
  }
}
</style>

