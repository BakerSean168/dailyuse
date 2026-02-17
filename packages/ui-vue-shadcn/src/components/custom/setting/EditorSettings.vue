<template>
  <Card>
    <CardContent class="p-0">
      <!-- Edit Mode Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Pencil class="h-5 w-5" />
          <h3 class="text-base font-medium">编辑模式</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Default Mode -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">默认打开模式</Label>
              <p class="text-sm text-muted-foreground">打开笔记时的默认显示模式</p>
            </div>
            <ToggleGroup
              type="single"
              :model-value="modelValue.defaultMode"
              @update:model-value="(value) => emit('update:modelValue', { ...modelValue, defaultMode: value })"
              class="ml-4"
            >
              <ToggleGroupItem value="reading" aria-label="阅读模式">
                <BookOpen class="h-4 w-4 mr-1" />
                阅读
              </ToggleGroupItem>
              <ToggleGroupItem value="editing" aria-label="编辑模式">
                <Pencil class="h-4 w-4 mr-1" />
                编辑
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <!-- Auto Save Delay -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">自动保存延迟</Label>
              <p class="text-sm text-muted-foreground">停止输入后多久自动保存内容</p>
            </div>
            <Select
              :model-value="String(modelValue.autoSaveDelay)"
              @update:model-value="(value) => emit('update:modelValue', { ...modelValue, autoSaveDelay: Number(value) })"
              class="ml-4 w-[180px]"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择延迟" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in autoSaveDelayOptions"
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

      <!-- Media Embed Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Image class="h-5 w-5" />
          <h3 class="text-base font-medium">媒体嵌入</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Enable Link Preview -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">链接悬浮预览</Label>
              <p class="text-sm text-muted-foreground">鼠标悬停在链接上时显示预览卡片</p>
            </div>
            <Switch
              :checked="modelValue.enableLinkPreview"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, enableLinkPreview: value })"
            />
          </div>

          <!-- Enable Media Embed -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">启用媒体嵌入</Label>
              <p class="text-sm text-muted-foreground">在笔记中直接显示图片、音频、视频播放器</p>
            </div>
            <Switch
              :checked="modelValue.enableMediaEmbed"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, enableMediaEmbed: value })"
            />
          </div>

          <!-- Supported Video Sites -->
          <div v-if="modelValue.enableMediaEmbed" class="space-y-2">
            <Label class="text-sm font-medium">支持的视频网站</Label>
            <p class="text-sm text-muted-foreground">这些网站的链接将自动转换为嵌入式播放器</p>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="site in videoSiteOptions"
                :key="site"
                :variant="modelValue.supportedVideoSites?.includes(site) ? 'default' : 'outline'"
                class="cursor-pointer"
                @click="toggleVideoSite(site)"
              >
                {{ site }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Display Settings -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <Type class="h-5 w-5" />
          <h3 class="text-base font-medium">显示</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Font Size -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">字体大小</Label>
            <p class="text-sm text-muted-foreground">编辑器中的文字大小</p>
            <div class="flex items-center space-x-4">
              <Slider
                :model-value="[modelValue.fontSize || 16]"
                :min="12"
                :max="24"
                :step="1"
                class="flex-1"
                @update:model-value="(value) => emit('update:modelValue', { ...modelValue, fontSize: value[0] })"
              />
              <span class="text-sm w-12 text-right">{{ modelValue.fontSize }}px</span>
            </div>
          </div>

          <!-- Show Line Numbers -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">显示行号</Label>
              <p class="text-sm text-muted-foreground">在编辑模式下显示行号</p>
            </div>
            <Switch
              :checked="modelValue.showLineNumbers"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, showLineNumbers: value })"
            />
          </div>

          <!-- Show Word Count -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Label class="text-sm font-medium">显示字数统计</Label>
              <p class="text-sm text-muted-foreground">在状态栏显示当前文档的字数</p>
            </div>
            <Switch
              :checked="modelValue.showWordCount"
              @update:checked="(value) => emit('update:modelValue', { ...modelValue, showWordCount: value })"
            />
          </div>
        </div>
      </div>

      <Separator />

      <!-- Markdown Syntax Help -->
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-2">
          <FileText class="h-5 w-5" />
          <h3 class="text-base font-medium">媒体嵌入语法</h3>
        </div>
        
        <Alert>
          <Info class="h-4 w-4" />
          <AlertDescription class="space-y-1">
            <div class="flex items-center justify-between">
              <code class="text-xs bg-muted px-2 py-1 rounded">![[image.png]]</code>
              <span class="text-xs text-muted-foreground">嵌入仓储中的图片</span>
            </div>
            <div class="flex items-center justify-between">
              <code class="text-xs bg-muted px-2 py-1 rounded">![[audio.mp3]]</code>
              <span class="text-xs text-muted-foreground">嵌入音频播放器</span>
            </div>
            <div class="flex items-center justify-between">
              <code class="text-xs bg-muted px-2 py-1 rounded">![[video.mp4]]</code>
              <span class="text-xs text-muted-foreground">嵌入视频播放器</span>
            </div>
            <div class="flex items-center justify-between">
              <code class="text-xs bg-muted px-2 py-1 rounded">![](https://...)</code>
              <span class="text-xs text-muted-foreground">嵌入外部图片</span>
            </div>
            <div class="flex items-center justify-between">
              <code class="text-xs bg-muted px-2 py-1 rounded">&lt;iframe src="..."&gt;</code>
              <span class="text-xs text-muted-foreground">嵌入网页视频</span>
            </div>
          </AlertDescription>
        </Alert>
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
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { Pencil, BookOpen, Image, Type, FileText, Info } from 'lucide-vue-next';

interface EditorSettings {
  defaultMode?: 'reading' | 'editing';
  autoSaveDelay?: number;
  enableLinkPreview?: boolean;
  enableMediaEmbed?: boolean;
  supportedVideoSites?: string[];
  fontSize?: number;
  showLineNumbers?: boolean;
  showWordCount?: boolean;
}

interface Props {
  modelValue: EditorSettings;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: EditorSettings];
}>();

const autoSaveDelayOptions = [
  { value: 300, label: '300ms (快)' },
  { value: 500, label: '500ms (推荐)' },
  { value: 1000, label: '1秒' },
  { value: 2000, label: '2秒' },
  { value: 5000, label: '5秒' },
];

const videoSiteOptions = [
  'youtube.com',
  'bilibili.com',
  'youku.com',
  'vimeo.com',
  'dailymotion.com',
];

function toggleVideoSite(site: string) {
  const props = defineProps<Props>();
  const current = props.modelValue.supportedVideoSites || [];
  const newSites = current.includes(site)
    ? current.filter(s => s !== site)
    : [...current, site];
  emit('update:modelValue', { ...props.modelValue, supportedVideoSites: newSites });
}
</script>
