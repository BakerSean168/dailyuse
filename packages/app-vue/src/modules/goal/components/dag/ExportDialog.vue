<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 font-semibold">
          <Download class="h-5 w-5" />
          导出 DAG 可视化
        </DialogTitle>
      </DialogHeader>

      <Separator />

      <div class="space-y-4 pt-2">
        <div>
          <Label>导出格式</Label>
          <Select v-model="format">
            <SelectTrigger class="mt-1.5">
              <SelectValue placeholder="导出格式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in formatOptions" :key="option.value" :value="option.value">
                <div class="flex items-center gap-2">
                  <component :is="option.icon" class="h-4 w-4" />
                  <div>
                    <div>{{ option.title }}</div>
                    <div class="text-xs text-muted-foreground">{{ option.description }}</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="format === 'png'">
          <Label>分辨率</Label>
          <Select v-model="resolution">
            <SelectTrigger class="mt-1.5">
              <SelectValue placeholder="分辨率" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in resolutionOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>背景颜色</Label>
          <Select v-model="backgroundColor">
            <SelectTrigger class="mt-1.5">
              <SelectValue placeholder="背景颜色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in bgOptions" :key="option.value" :value="option.value">
                {{ option.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="format === 'pdf'" class="flex items-center space-x-2">
          <Checkbox id="include-metadata" v-model:checked="includeMetadata" />
          <Label for="include-metadata" class="text-sm font-normal cursor-pointer">
            包含元数据（标题、日期、作者）
          </Label>
        </div>

        <Alert v-if="format === 'svg'">
          <Info class="h-4 w-4" />
          <AlertTitle>SVG 导出说明</AlertTitle>
          <AlertDescription> SVG 格式适合在设计工具中进一步编辑，支持无损缩放 </AlertDescription>
        </Alert>
      </div>

      <Separator />

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
        <Button :disabled="isExporting" @click="handleExport">
          <Loader2 v-if="isExporting" class="mr-2 h-4 w-4 animate-spin" />
          <Download v-else class="mr-2 h-4 w-4" />
          {{ isExporting ? '导出中...' : '导出' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import type { ExportOptions } from '../../application/services/DAGExportService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Separator,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@dailyuse/ui-vue-shadcn';
import { Download, Image, SquareDashedKanban, FileText, Info, Loader2 } from 'lucide-vue-next';

const emit = defineEmits<{
  export: [options: ExportOptions];
}>();

const isOpen = ref(false);
const isExporting = ref(false);
const format = ref<'png' | 'svg' | 'pdf'>('png');
const resolution = ref<1 | 2 | 3>(2);
const backgroundColor = ref('white');
const includeMetadata = ref(true);

const formatOptions: { title: string; value: string; icon: Component; description: string }[] = [
  {
    title: 'PNG 图片',
    value: 'png',
    icon: Image,
    description: '适合分享和嵌入文档',
  },
  {
    title: 'SVG 矢量图',
    value: 'svg',
    icon: SquareDashedKanban,
    description: '支持无损缩放，适合编辑',
  },
  {
    title: 'PDF 文档',
    value: 'pdf',
    icon: FileText,
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
