<template>
  <v-dialog v-model="isOpen" max-width="600">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-download</v-icon>
        导出 DAG 可视化
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="format"
              :items="formatOptions"
              label="导出格式"
              variant="outlined"
              density="comfortable"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon" />
                  </template>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col v-if="format === 'png'" cols="12">
            <v-select
              v-model="resolution"
              :items="resolutionOptions"
              label="分辨率"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="backgroundColor"
              :items="bgOptions"
              label="背景颜色"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col v-if="format === 'pdf'" cols="12">
            <v-checkbox
              v-model="includeMetadata"
              label="包含元数据（标题、日期、作者）"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <v-alert v-if="format === 'svg'" type="info" variant="tonal" class="mt-4">
          <v-alert-title>SVG 导出说明</v-alert-title>
          SVG 格式适合在设计工具中进一步编辑，支持无损缩放
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isExporting"
          :prepend-icon="isExporting ? undefined : 'mdi-download'"
          @click="handleExport"
        >
          {{ isExporting ? '导出中...' : '导出' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ExportOptions } from '../../../application/services/DAGExportService';

const emit = defineEmits<{
  export: [options: ExportOptions];
}>();

const isOpen = ref(false);
const isExporting = ref(false);
const format = ref<'png' | 'svg' | 'pdf'>('png');
const resolution = ref<1 | 2 | 3>(2);
const backgroundColor = ref('white');
const includeMetadata = ref(true);

const formatOptions = [
  {
    title: 'PNG 图片',
    value: 'png',
    icon: 'mdi-file-image',
    description: '适合分享和嵌入文档',
  },
  {
    title: 'SVG 矢量图',
    value: 'svg',
    icon: 'mdi-vector-square',
    description: '支持无损缩放，适合编辑',
  },
  {
    title: 'PDF 文档',
    value: 'pdf',
    icon: 'mdi-file-pdf-box',
    description: '包含元数据，适合存档',
  },
];

const resolutionOptions = [
  { title: '标准 (1x)', value: 1 },
  { title: '高清 (2x) 推荐', value: 2 },
  { title: '超高清 (3x)', value: 3 },
];

const bgOptions = [
  { title: '白色背景', value: 'white' },
  { title: '透明背景', value: 'transparent' },
];

async function handleExport() {
  isExporting.value = true;

  try {
    emit('export', {
      format: format.value,
      resolution: resolution.value,
      backgroundColor: backgroundColor.value,
      includeMetadata: includeMetadata.value,
    });
  } finally {
    // Keep loading state until parent confirms success/error
    setTimeout(() => {
      isExporting.value = false;
    }, 500);
  }
}

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
  isExporting.value = false;
}

defineExpose({ open, close });
</script>

<style scoped>
.v-card-title {
  font-weight: 600;
}
</style>
