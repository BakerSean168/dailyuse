<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-folder-plus-outline" class="mr-2" />
        <span>{{ parentUuid ? '创建子文件夹' : '创建文件夹' }}</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="文件夹名称"
            placeholder="请输入文件夹名称"
            :rules="nameRules"
            :error-messages="errorMessages"
            autofocus
            required
            variant="outlined"
            density="comfortable"
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
import { useFolderStore } from '../../stores';
import { getRepositoryApiClient } from '@dailyuse/repository/infrastructure-client';

const repositoryApiClient = getRepositoryApiClient();
import { Folder } from '@dailyuse/repository/domain-client';

// Props
interface Props {
  modelValue: boolean;
  repositoryUuid: string;
  parentUuid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  parentUuid: null,
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', folder: Folder): void;
}>();

// Store
const folderStore = useFolderStore();

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
  (v: string) => !!v || '文件夹名称不能为空',
  (v: string) => v.length <= 255 || '文件夹名称不能超过255个字符',
  (v: string) => /^[^/\\:*?"<>|]+$/.test(v) || '文件夹名称包含非法字符',
];

// Methods
async function handleSubmit() {
  errorMessages.value = [];

  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    const folderDTO = await repositoryApiClient.createFolder(props.repositoryUuid, {
      name: formData.value.name,
      parentUuid: props.parentUuid || null,
    });

    const folder = Folder.fromClientDTO(folderDTO);
    folderStore.addFolder(folder);
    emit('created', folder);
    handleClose();
  } catch (err: any) {
    errorMessages.value = [err.message || '创建文件夹失败'];
    console.error('创建文件夹失败:', err);
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
