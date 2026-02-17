<template>
  <v-dialog :model-value="visible" max-width="400" persistent>
    <v-card>
      <v-card-title class="pa-4">
        <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
        {{ isEditing ? '编辑目标节点' : '创建目标节点' }}
      </v-card-title>

      <v-form ref="formRef">
        <v-card-text class="pa-4">
          <v-text-field
            v-model="name"
            label="节点名称"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            @keyup.enter="handleSave"
          >
          </v-text-field>

          <v-select
            v-model="icon"
            :items="iconOptions"
            label="选择图标"
            variant="outlined"
            density="compact"
            item-title="text"
            item-value="value"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon>{{ item.raw.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
      </v-form>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          class="ml-2"
          @click="handleSave"
          variant="elevated"
          :disabled="!isFormValid"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { GoalFolder } from '@dailyuse/goal/domain-client';
import type { GoalFolderClient } from '@dailyuse/contracts/goal';
// composables
import { useGoalFolder } from '../../composables/useGoalFolder';

const goalFolderComposable = useGoalFolder();
const { createFolder, updateFolder } = goalFolderComposable;

const visible = ref(false);
const createDraftGoalFolder = () => GoalFolder.forCreate(''); // accountUuid 由后端注入，前端传空字符串

const propGoalFolder = ref<GoalFolder | null>(null);
const localGoalFolder = ref<GoalFolder>(createDraftGoalFolder());

const isEditing = computed(() => !!propGoalFolder.value);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

const name = computed({
  get: () => localGoalFolder.value.name,
  set: (val: string) => {
    localGoalFolder.value.updateName(val);
  },
});

const icon = computed({
  get: () => localGoalFolder.value.icon,
  set: (val: string) => {
    localGoalFolder.value.updateIcon(val);
  },
});

const iconOptions = [
  { text: '文件夹', value: 'mdi-folder' },
  { text: '目标', value: 'mdi-target' },
  { text: '学习', value: 'mdi-school' },
  { text: '工作', value: 'mdi-briefcase' },
  { text: '生活', value: 'mdi-home' },
  { text: '健康', value: 'mdi-heart' },
];

const nameRules = [
  (v: string) => !!v || '名称不能为空',
  (v: string) => (v && v.length >= 1) || '名称至少需要2个字符',
  (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
];

const handleSave = () => {
  if (!isFormValid.value) return;
  if (propGoalFolder.value) {
    // 编辑模式 - 转换为请求格式（null -> undefined）
    const updateRequest = {
      name: localGoalFolder.value.name,
      description: localGoalFolder.value.description || undefined,
      icon: localGoalFolder.value.icon || undefined,
      color: localGoalFolder.value.color || undefined,
      parentFolderUuid: localGoalFolder.value.parentFolderUuid || undefined,
      sortOrder: localGoalFolder.value.sortOrder,
    };
    updateFolder(localGoalFolder.value.uuid, updateRequest);
  } else {
    // 创建模式：accountUuid 由后端从 JWT token 注入（安全可靠）
    // 前端不需要传递 accountUuid
    
    // 转换为请求格式（null -> undefined）
    const createRequest = {
      name: localGoalFolder.value.name,
      description: localGoalFolder.value.description || undefined,
      icon: localGoalFolder.value.icon || undefined,
      color: localGoalFolder.value.color || undefined,
      parentFolderUuid: localGoalFolder.value.parentFolderUuid || undefined,
    };
    createFolder(createRequest);
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};

const openDialog = (goalFolder?: GoalFolder) => {
  visible.value = true;
  propGoalFolder.value = goalFolder || null;
};

const openForCreate = () => {
  openDialog();
};

const openForEdit = (goalFolder: GoalFolderClient) => {
  // Convert interface to entity for internal use
  openDialog(goalFolder as GoalFolder);
};

const closeDialog = () => {
  visible.value = false;
};

watch(
  [() => visible.value, () => propGoalFolder.value],
  ([show]) => {
    if (show) {
      localGoalFolder.value = propGoalFolder.value
        ? propGoalFolder.value.clone()
        : createDraftGoalFolder();
    } else {
      localGoalFolder.value = createDraftGoalFolder();
    }
  },
  { immediate: true },
);

defineExpose({
  openForCreate,
  openForEdit,
});
</script>
