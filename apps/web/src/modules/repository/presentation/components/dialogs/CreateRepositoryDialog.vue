<template>
  <!-- Obsidian 风格的欢迎对话框 -->
  <v-dialog 
    v-model="isOpen" 
    max-width="600" 
    :scrim="true"
    class="obsidian-welcome-dialog"
  >
    <v-card class="welcome-card">
      <!-- 关闭按钮 -->
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="close-btn"
        @click="handleClose"
      />

      <!-- Logo 和标题 -->
      <div class="welcome-header">
        <v-icon icon="mdi-book-open-variant" size="64" color="primary" class="mb-4" />
        <h2 class="text-h5 mb-2">知识仓库</h2>
        <p class="text-caption text-medium-emphasis">开始你的知识管理之旅</p>
      </div>

      <v-divider class="my-4" />

      <!-- 选项列表 - Obsidian 风格 -->
      <div class="welcome-options">
        <!-- 创建新仓储 -->
        <v-card
          class="option-card mb-3"
          variant="outlined"
          hover
          @click="handleCreateNew"
        >
          <v-card-text class="d-flex align-center">
            <div class="flex-1">
              <div class="d-flex align-center mb-1">
                <v-icon icon="mdi-folder-plus-outline" class="mr-2" />
                <span class="text-subtitle-1 font-weight-medium">创建新仓储</span>
              </div>
              <p class="text-caption text-medium-emphasis ml-8 mb-0">
                在本地文件夹创建新的知识仓储
              </p>
            </div>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
            />
          </v-card-text>
        </v-card>

        <!-- 打开已有文件夹 -->
        <v-card
          class="option-card mb-3"
          variant="outlined"
          hover
          @click="handleOpenExisting"
        >
          <v-card-text class="d-flex align-center">
            <div class="flex-1">
              <div class="d-flex align-center mb-1">
                <v-icon icon="mdi-folder-open-outline" class="mr-2" />
                <span class="text-subtitle-1 font-weight-medium">打开已有文件夹</span>
              </div>
              <p class="text-caption text-medium-emphasis ml-8 mb-0">
                打开包含 Markdown 文件的现有文件夹
              </p>
            </div>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
            />
          </v-card-text>
        </v-card>

        <!-- 从云端同步 -->
        <v-card
          class="option-card"
          variant="outlined"
          hover
          disabled
        >
          <v-card-text class="d-flex align-center">
            <div class="flex-1">
              <div class="d-flex align-center mb-1">
                <v-icon icon="mdi-cloud-sync-outline" class="mr-2" />
                <span class="text-subtitle-1 font-weight-medium">从云端同步</span>
                <v-chip size="x-small" class="ml-2" color="info">即将推出</v-chip>
              </div>
              <p class="text-caption text-medium-emphasis ml-8 mb-0">
                从 Obsidian Sync 或其他云服务同步
              </p>
            </div>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              disabled
            />
          </v-card-text>
        </v-card>
      </div>

      <!-- 底部语言选择 -->
      <div class="welcome-footer">
        <v-select
          v-model="selectedLanguage"
          :items="languages"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-web"
        />
      </div>
    </v-card>

    <!-- 创建仓储表单对话框 -->
    <v-dialog v-model="showCreateForm" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-database-plus-outline" class="mr-2" />
          <span>创建新仓储</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" @submit.prevent="handleSubmit">
            <v-text-field
              v-model="formData.name"
              label="仓储名称"
              placeholder="我的知识库"
              :rules="nameRules"
              :error-messages="errorMessages"
              autofocus
              required
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-textarea
              v-model="formData.description"
              label="描述（可选）"
              placeholder="描述这个知识仓储的用途..."
              rows="3"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
              <template #text>
                <div class="text-caption">
                  <v-icon icon="mdi-information-outline" size="small" class="mr-1" />
                  Web 端仓储数据存储在浏览器本地，定期自动同步到云端
                </div>
              </template>
            </v-alert>

            <v-expansion-panels v-model="expandedPanel" class="mb-3">
              <v-expansion-panel value="config">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-cog-outline" class="mr-2" />
                  高级配置（可选）
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-switch
                    v-model="formData.autoSync"
                    label="自动同步到云端"
                    hint="自动将更改同步到云端存储"
                    persistent-hint
                    color="primary"
                    class="mb-3"
                  />

                  <v-text-field
                    v-model.number="formData.maxFileSize"
                    label="单个文件最大大小（MB）"
                    placeholder="10"
                    type="number"
                    min="1"
                    max="100"
                    hint="Web 端建议不超过 10MB"
                    persistent-hint
                    variant="outlined"
                    density="comfortable"
                    class="mb-3"
                  />

                  <v-select
                    v-model="formData.syncInterval"
                    label="同步频率"
                    :items="syncIntervals"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="handleCancel">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRepositoryStore } from '../../stores';
import { getRepositoryApiClient } from '@dailyuse/infrastructure-client';

const repositoryApiClient = getRepositoryApiClient();
import { Repository } from '@dailyuse/domain-client/repository';
import { RepositoryStatus, RepositoryType, type RepositoryClientDTO, type ResourceClientDTO, type FolderClientDTO } from '@dailyuse/contracts/repository';

// Props
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', repository: Repository): void;
}>();

// Store
const repositoryStore = useRepositoryStore();

// Local state
const formRef = ref<any>(null);
const isSubmitting = ref(false);
const errorMessages = ref<string[]>([]);
const expandedPanel = ref<string | undefined>(undefined);
const showCreateForm = ref(false);
const selectedLanguage = ref('简体中文');

const languages = [
  '简体中文',
  'English',
  '繁體中文',
  '日本語',
];

const formData = ref({
  name: '',
  type: 'LOCAL' as RepositoryType,
  path: '', // Web 端留空，桌面端使用实际路径
  description: '',
  autoSync: true,
  maxFileSize: 10, // Web 端默认 10MB
  syncInterval: 'auto', // 同步频率
});

const syncIntervals = [
  { value: 'auto', title: '自动（实时）' },
  { value: '5min', title: '每 5 分钟' },
  { value: '15min', title: '每 15 分钟' },
  { value: '30min', title: '每 30 分钟' },
  { value: 'manual', title: '仅手动同步' },
];

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!value) {
      showCreateForm.value = false;
    }
    emit('update:modelValue', value);
  },
});

const repositoryTypes = [
  {
    value: 'LOCAL',
    label: '本地仓储',
    description: '存储在本地文件系统',
    icon: 'mdi-folder-outline',
  },
  {
    value: 'GIT',
    label: 'Git 仓储',
    description: '支持 Git 版本控制',
    icon: 'mdi-git',
  },
  {
    value: 'CLOUD',
    label: '云端仓储',
    description: '存储在云端服务',
    icon: 'mdi-cloud-outline',
  },
];

const nameRules = [
  (v: string) => !!v || '仓储名称不能为空',
  (v: string) => v.length <= 100 || '仓储名称不能超过100个字符',
];

const typeRules = [(v: string) => !!v || '请选择仓储类型'];

const pathRules = [
  (v: string) => !!v || '存储路径不能为空',
  (v: string) => v.length <= 500 || '存储路径不能超过500个字符',
];

// Methods - 欢迎界面选项
function handleCreateNew() {
  showCreateForm.value = true;
  // 清空表单，准备创建新仓储
  formData.value.name = '';
  formData.value.description = '';
}

function handleOpenExisting() {
  // Web 端：导入已有数据
  // 桌面端：选择文件夹
  showCreateForm.value = true;
  formData.value.name = '导入的知识库';
  console.log('打开已有文件夹（Web端为导入功能）');
}

async function handleSubmit() {
  errorMessages.value = [];

  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    // Web 端创建虚拟仓储
    const payload = {
      name: formData.value.name,
      type: 'LOCAL' as RepositoryType, // Web 端统一使用 LOCAL 类型
      path: `/repositories/${formData.value.name}`, // 虚拟路径
      description: formData.value.description || undefined,
      config: {
        autoSync: formData.value.autoSync,
        maxFileSize: formData.value.maxFileSize,
        // Web 端特有配置
        storageType: 'indexeddb', // 使用 IndexedDB 存储
        cloudSyncEnabled: formData.value.autoSync,
      } as any, // 临时使用 any，后续需要更新 contracts 类型定义
    };

    const response = await repositoryApiClient.createRepository(payload);
    const repository = Repository.fromClientDTO(response);
    repositoryStore.addRepository(repository);
    emit('created', repository);
    handleClose();
  } catch (err: any) {
    errorMessages.value = [err.message || '创建仓储失败'];
    console.error('创建仓储失败:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  if (showCreateForm.value) {
    showCreateForm.value = false;
  } else {
    handleClose();
  }
}

function handleBrowsePath() {
  // TODO: 实现文件夹选择器（可能需要 Electron API）
  console.log('浏览路径');
}

function handleClose() {
  formRef.value?.reset();
  formData.value = {
    name: '',
    type: 'LOCAL' as RepositoryType,
    path: '',
    description: '',
    autoSync: true,
    maxFileSize: 10,
    syncInterval: 'auto',
  };
  errorMessages.value = [];
  expandedPanel.value = undefined;
  showCreateForm.value = false;
  isOpen.value = false;
}
</script>

<style scoped>
/* Obsidian 风格欢迎卡片 */
.welcome-card {
  padding: 32px 24px;
  position: relative;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.welcome-header {
  text-align: center;
  padding: 16px 0;
}

.welcome-options {
  padding: 16px 0;
}

.option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px !important;
}

.option-card:hover:not([disabled]) {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgb(var(--v-theme-primary)) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.option-card[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.welcome-footer {
  padding-top: 16px;
  max-width: 200px;
}

/* 表单样式 */
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>

