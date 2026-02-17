<template>
  <RepoHeader
    :model-value="currentView"
    @update:model-value="handleViewChange"
    @search="handleSearch"
    @refresh="handleRefresh"
    @sync="handleSync"
    @export="handleExport"
    @import="handleImport"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RepoHeader } from '@dailyuse/ui-vue-shadcn';
import { useMessage } from '@dailyuse/ui-vuetify';

const props = defineProps<{
  modelValue: 'preview' | 'manage';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'preview' | 'manage'];
  search: [query: string];
  refresh: [];
  sync: [];
  export: [];
  import: [];
}>();

const message = useMessage();
const currentView = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    currentView.value = newValue;
  },
);

function handleViewChange(view: 'preview' | 'manage') {
  emit('update:modelValue', view);
}

function handleSearch(query: string) {
  emit('search', query);
}

function handleRefresh() {
  emit('refresh');
}

function handleSync() {
  emit('sync');
  message.info('同步功能开发中');
}

function handleExport() {
  emit('export');
  message.info('导出功能开发中');
}

function handleImport() {
  emit('import');
  message.info('导入功能开发中');
}
</script>
