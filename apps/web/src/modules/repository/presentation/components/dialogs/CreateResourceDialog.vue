<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-note-plus-outline" class="mr-2" />
        <span>创建笔记</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="笔记名称"
            placeholder="请输入笔记名称"
            :rules="nameRules"
            :error-messages="errorMessages"
            autofocus
            required
            variant="outlined"
            density="comfortable"
            hint="元数据可在笔记顶部使用 YAML frontmatter 格式添加"
            persistent-hint
          />
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
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useResourceStore } from '../../stores/resourceStore';
import { getRepositoryApiClient } from '@dailyuse/infrastructure-client';

const repositoryApiClient = getRepositoryApiClient();
import { apiClient } from '@/shared/api/instances';

// Props
interface Props {
  modelValue: boolean;
  repositoryUuid: string;
  folderUuid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  folderUuid: null,
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', resourceUuid: string): void;
}>();

// Store
const resourceStore = useResourceStore();

// Local state
const formRef = ref<any>(null);
const isSubmitting = ref(false);
const errorMessages = ref<string[]>([]);

const formData = ref({
  name: '',
});

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const nameRules = [
  (v: string) => !!v || '笔记名称不能为空',
  (v: string) => v.length <= 255 || '笔记名称不能超过255个字符',
  (v: string) => /^[^/\\:*?"<>|]+$/.test(v) || '笔记名称包含非法字符',
];

// Methods
async function handleSubmit() {
  errorMessages.value = [];

  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    // 创建带有默认 frontmatter 的 Markdown 内容
    const now = new Date().toISOString();
    const defaultContent = `---
title: ${formData.value.name}
created: ${now}
updated: ${now}
tags: []
---

# ${formData.value.name}

`;

    const resourceDTO = await repositoryApiClient.createResource({
      repositoryUuid: props.repositoryUuid,
      name: formData.value.name.endsWith('.md') ? formData.value.name : `${formData.value.name}.md`,
      type: 'MARKDOWN',
      path: `/${formData.value.name}.md`,
      folderUuid: props.folderUuid || undefined, // 使用传入的文件夹 UUID
      content: defaultContent,
    });

    console.log('创建的资源:', resourceDTO);

    // 刷新资源列表
    await resourceStore.loadResources(props.repositoryUuid);
    
    // 如果返回的是完整对象（有 uuid），直接使用
    // 如果是空的，从刷新后的列表中查找
    const resourceUuid = resourceDTO?.uuid || resourceStore.resources[resourceStore.resources.length - 1]?.uuid;
    
    if (resourceUuid) {
      emit('created', resourceUuid);
      handleClose();
    } else {
      throw new Error('无法获取创建的资源 UUID');
    }
  } catch (err: any) {
    errorMessages.value = [err.message || '创建笔记失败'];
    console.error('创建笔记失败:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  handleClose();
}

function handleClose() {
  formRef.value?.reset();
  formData.value = {
    name: '',
  };
  errorMessages.value = [];
  isOpen.value = false;
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      // Reset form when dialog closes
      handleClose();
    }
  }
);
</script>

<style scoped>
/* No custom styles needed */
</style>
