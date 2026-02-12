<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h5">
          <v-icon icon="mdi-folder-multiple" class="mr-2" />
          仓库管理
        </span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="px-0">
        <!-- 操作按钮 -->
        <div class="px-4 py-2">
          <v-btn prepend-icon="mdi-plus" color="primary" @click="showCreateDialog">
            新建仓库
          </v-btn>
        </div>

        <v-divider />

        <!-- 仓库列表 -->
        <v-list lines="two">
          <v-list-item
            v-for="repo in repositories"
            :key="repo.uuid"
            :class="{ 'bg-primary-lighten-5': currentRepositoryUuid === repo.uuid }"
            @click="selectRepository(repo.uuid)"
          >
            <template #prepend>
              <v-avatar :color="getRepositoryColor(repo.type)">
                <v-icon :icon="getRepositoryIcon(repo.type)" />
              </v-avatar>
            </template>

            <v-list-item-title>
              {{ repo.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              <div class="d-flex align-center">
                <v-chip :color="getStatusColor(repo.status)" size="x-small" class="mr-2">
                  {{ getStatusText(repo.status) }}
                </v-chip>
                <span class="text-caption">{{ repo.path }}</span>
              </div>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-cog"
                  variant="text"
                  size="small"
                  @click.stop="openSettings(repo.uuid)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click.stop="deleteRepository(repo.uuid)"
                />
              </div>
            </template>
          </v-list-item>

          <v-list-item v-if="repositories.length === 0">
            <v-list-item-title class="text-center text-medium-emphasis">
              暂无仓库，点击上方按钮创建
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close"> 关闭 </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 创建仓库对话框 -->
    <v-dialog v-model="createDialogOpen" max-width="600" persistent>
      <v-card>
        <v-card-title>新建仓库</v-card-title>
        <v-divider />

        <v-card-text>
          <v-form ref="createForm" v-model="isValid">
            <v-text-field
              v-model="newRepository.name"
              label="仓库名称"
              :rules="[rules.required, rules.nameLength]"
              counter="50"
              required
            />

            <v-text-field
              v-model="newRepository.path"
              label="仓库路径"
              :rules="[rules.required]"
              hint="本地文件系统路径"
              persistent-hint
              required
            />

            <v-select
              v-model="newRepository.type"
              :items="repositoryTypes"
              label="仓库类型"
              :rules="[rules.required]"
              required
            />

            <v-textarea v-model="newRepository.description" label="描述" rows="3" counter="200" />
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCreateDialog"> 取消 </v-btn>
          <v-btn color="primary" :disabled="!isValid" :loading="creating" @click="createRepository">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryStore } from '../../stores/repositoryStore';
import { useMessage } from '@dailyuse/ui-vuetify';
import { RepositoryStatus, RepositoryType, type RepositoryClientDTO, type ResourceClientDTO, type FolderClientDTO } from '@dailyuse/contracts/repository';
import { repositoryApplicationService } from '@dailyuse/repository/application-client';

const repositoryManagementService = repositoryApplicationService;

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'repository-selected': [uuid: string];
}>();

const message = useMessage();
const repositoryStore = useRepositoryStore();
const { repositories } = storeToRefs(repositoryStore);

// 对话框状态
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// 创建仓库对话框
const createDialogOpen = ref(false);
const isValid = ref(false);
const creating = ref(false);
const createForm = ref<any>(null);

// 当前选中的仓库
const currentRepositoryUuid = ref<string | null>(repositoryStore.selectedRepository);

// 新建仓库数据
const newRepository = ref({
  name: '',
  path: '',
  type: RepositoryType.MARKDOWN,
  description: '',
});

// 仓库类型选项
const repositoryTypes = [
  { title: 'Markdown 仓库', value: RepositoryType.MARKDOWN },
  { title: '代码仓库', value: RepositoryType.CODE },
  { title: '混合仓库', value: RepositoryType.MIXED },
];

// 表单验证规则
const rules = {
  required: (v: string) => !!v || '此字段必填',
  nameLength: (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
};

// 获取仓库图标
function getRepositoryIcon(type: RepositoryType): string {
  switch (type) {
    case RepositoryType.MARKDOWN:
      return 'mdi-language-markdown';
    case RepositoryType.CODE:
      return 'mdi-code-tags';
    case RepositoryType.MIXED:
      return 'mdi-folder-multiple';
    default:
      return 'mdi-folder';
  }
}

// 获取仓库颜色
function getRepositoryColor(type: RepositoryType): string {
  switch (type) {
    case RepositoryType.MARKDOWN:
      return 'blue';
    case RepositoryType.CODE:
      return 'orange';
    case RepositoryType.MIXED:
      return 'purple';
    default:
      return 'grey';
  }
}

// 获取状态颜色
function getStatusColor(status: RepositoryStatus): string {
  switch (status) {
    case RepositoryStatus.ACTIVE:
      return 'success';
    case RepositoryStatus.ARCHIVED:
      return 'grey';
    case RepositoryStatus.DELETED:
      return 'warning';
    default:
      return 'grey';
  }
}

// 获取状态文本
function getStatusText(status: RepositoryStatus): string {
  switch (status) {
    case RepositoryStatus.ACTIVE:
      return '活跃';
    case RepositoryStatus.ARCHIVED:
      return '已归档';
    case RepositoryStatus.DELETED:
      return '已删除';
    default:
      return '未知';
  }
}

// 选择仓库
function selectRepository(uuid: string) {
  currentRepositoryUuid.value = uuid;
  repositoryStore.setSelectedRepository(uuid);
  emit('repository-selected', uuid);
}

// 显示创建对话框
function showCreateDialog() {
  createDialogOpen.value = true;
}

// 关闭创建对话框
function closeCreateDialog() {
  createDialogOpen.value = false;
  newRepository.value = {
    name: '',
    path: '',
    type: RepositoryType.MARKDOWN,
    description: '',
  };
  createForm.value?.reset();
}

// 创建仓库
async function createRepository() {
  if (!isValid.value) return;

  try {
    creating.value = true;

    await repositoryManagementService.createRepository({
      name: newRepository.value.name,
      path: newRepository.value.path,
      type: newRepository.value.type,
      description: newRepository.value.description,
    });

    message.success('仓库创建成功');
    closeCreateDialog();
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    creating.value = false;
  }
}

// 打开设置
function openSettings(uuid: string) {
  message.info('设置功能开发中');
  // TODO: 实现设置功能
}

// 删除仓库
async function deleteRepository(uuid: string) {
  try {
    await message.delConfirm('确定要删除此仓库吗？此操作不可撤销。');

    await repositoryManagementService.deleteRepository(uuid);
    message.success('删除成功');

    // 如果删除的是当前选中的仓库，清除选中状态
    if (currentRepositoryUuid.value === uuid) {
      currentRepositoryUuid.value = null;
    }
  } catch {
    // 用户取消
  }
}

// 关闭主对话框
function close() {
  isOpen.value = false;
}
</script>

<style scoped>
.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>

