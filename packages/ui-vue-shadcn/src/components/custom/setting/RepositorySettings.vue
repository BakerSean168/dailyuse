<template>
  <Card>
    <CardContent class="p-0">
      <!-- Image Embed Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <ImageIcon class="h-5 w-5" />
          <h3 class="text-base font-medium">图片嵌入</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Embed Mode -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">嵌入模式</Label>
              <p class="text-sm text-muted-foreground">设置在笔记中插入图片时的默认处理方式</p>
            </div>
            <Select
              :model-value="modelValue.imageEmbedMode"
              @update:model-value="(value) => emit('update:modelValue', { ...modelValue, imageEmbedMode: value })"
              class="ml-4 w-[200px]"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in embedModeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Auto Embed Threshold -->
          <div v-if="modelValue.imageEmbedMode === 'auto'" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">自动嵌入阈值</Label>
              <p class="text-sm text-muted-foreground">小于此大小的图片将自动转换为 Base64 嵌入</p>
            </div>
            <div class="ml-4 w-[120px]">
              <Input
                type="number"
                :model-value="modelValue.autoEmbedThreshold"
                @update:model-value="(value) => emit('update:modelValue', { ...modelValue, autoEmbedThreshold: Number(value) })"
                suffix="KB"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Image Compression Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Minimize2 class="h-5 w-5" />
          <h3 class="text-base font-medium">图片压缩</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Enable Compression -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">启用图片压缩</Label>
              <p class="text-sm text-muted-foreground">在嵌入或上传图片时自动压缩以减小文件大小</p>
            </div>
            <Switch
              :checked="modelValue.imageCompression"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, imageCompression: value })"
            />
          </div>

          <!-- Compression Quality -->
          <div v-if="modelValue.imageCompression" class="space-y-2">
            <Label class="text-sm font-medium">压缩质量</Label>
            <p class="text-sm text-muted-foreground">较低的值会产生更小的文件，但图片质量会下降</p>
            <div class="flex items-center space-x-4">
              <Slider
                :model-value="[modelValue.compressionQuality || 80]"
                :min="10"
                :max="100"
                :step="5"
                class="flex-1"
                @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, compressionQuality: value?.[0] ?? 80 })"
              />
              <span class="text-sm w-12 text-right">{{ modelValue.compressionQuality }}%</span>
            </div>
          </div>

          <!-- Auto Convert to WebP -->
          <div v-if="modelValue.imageCompression" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">自动转换为 WebP</Label>
              <p class="text-sm text-muted-foreground">WebP 格式通常比 PNG/JPEG 更小，且支持透明度</p>
            </div>
            <Switch
              :checked="modelValue.autoConvertToWebP"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, autoConvertToWebP: value })"
            />
          </div>

          <!-- Max Image Width -->
          <div v-if="modelValue.imageCompression" class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">最大图片宽度</Label>
              <p class="text-sm text-muted-foreground">超过此宽度的图片将自动缩放</p>
            </div>
            <Select
              :model-value="String(modelValue.maxImageWidth)"
              @update:model-value="(value) => emit('update:modelValue', { ...modelValue, maxImageWidth: Number(value) })"
              class="ml-4 w-[200px]"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择宽度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in maxWidthOptions"
                  :key="option.value"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Resource Management Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Folder class="h-5 w-5" />
          <h3 class="text-base font-medium">资源管理</h3>
        </div>
        
        <Alert>
          <Info class="h-4 w-4" />
          <AlertDescription>
            资源（图片、音频、视频等）存储在仓储的 <code class="text-xs bg-muted px-2 py-1 rounded">assets/</code> 目录下
          </AlertDescription>
        </Alert>

        <!-- Default View Mode -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <Label class="text-sm font-medium">默认视图模式</Label>
            <p class="text-sm text-muted-foreground">打开仓储时的默认显示模式</p>
          </div>
          <ToggleGroup
            type="single"
            :model-value="modelValue.defaultViewMode"
            @update:model-value="(value: any) => emit('update:modelValue', { ...modelValue, defaultViewMode: value as string })"
            class="ml-4"
          >
            <ToggleGroupItem value="notes" aria-label="笔记视图">
              <FileText class="h-4 w-4 mr-1" />
              笔记
            </ToggleGroupItem>
            <ToggleGroupItem value="resources" aria-label="资源视图">
              <Images class="h-4 w-4 mr-1" />
              资源
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { ImageIcon, Minimize2, Folder, FileText, Images, Info } from 'lucide-vue-next';

interface RepositorySettings {
  imageEmbedMode?: string;
  autoEmbedThreshold?: number;
  imageCompression?: boolean;
  compressionQuality?: number;
  autoConvertToWebP?: boolean;
  maxImageWidth?: number;
  defaultViewMode?: string;
}

interface Props {
  modelValue: RepositorySettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: RepositorySettings];
}>();

const embedModeOptions = [
  { value: 'link', label: '链接引用 (推荐)' },
  { value: 'base64', label: 'Base64 嵌入' },
  { value: 'auto', label: '自动 (小图片嵌入)' },
];

const maxWidthOptions = [
  { value: 800, label: '800px (小)' },
  { value: 1280, label: '1280px (中)' },
  { value: 1920, label: '1920px (大)' },
  { value: 2560, label: '2560px (超大)' },
  { value: 0, label: '不限制' },
];
</script>
