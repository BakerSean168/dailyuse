<!--
  ObsidianEditor - Obsidian-style note editor - shadcn/ui version
  Features: YAML frontmatter, edit/reading mode, auto-save, drag-drop upload
-->

<template>
  <div class="flex flex-col h-full bg-background" :class="{ 'drag-over': isDragOver }">
    <!-- Drag Upload Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isDragOver" class="absolute inset-0 bg-background/95 z-50 flex items-center justify-center">
        <div class="text-center">
          <Upload class="w-16 h-16 mb-4 text-primary mx-auto" />
          <p class="text-lg font-medium text-primary">释放以上传文件</p>
          <span class="text-sm text-muted-foreground">支持图片、音频、视频、PDF 等</span>
        </div>
      </div>
    </Transition>

    <!-- Upload Progress -->
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="isUploading" class="border-b bg-muted/50 z-10">
        <Progress :model-value="uploadProgress" class="h-1" />
        <div class="px-3 py-1 text-xs text-muted-foreground">{{ uploadStatusText }}</div>
      </div>
    </Transition>

    <!-- Toolbar -->
    <div class="flex items-center justify-between h-10 px-2 border-b">
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-8 w-8" disabled>
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" disabled>
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>

      <div class="flex items-center gap-1 text-sm text-muted-foreground">
        <span v-if="folderPath" class="opacity-60">{{ folderPath }} /</span>
        <span class="font-medium">{{ displayFileName }}</span>
      </div>

      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleBookmark">
          <component :is="isBookmarked ? Bookmark : BookmarkIcon" class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleMode">
          <component :is="isReadingMode ? Edit3 : BookOpen" class="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="copyLink">
              <Link2 class="mr-2 h-4 w-4" />
              复制链接
            </DropdownMenuItem>
            <DropdownMenuItem @click="openInNewTab">
              <ExternalLink class="mr-2 h-4 w-4" />
              在新标签页打开
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="showFileInfo">
              <Info class="mr-2 h-4 w-4" />
              文件信息
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto px-16 py-8 pb-16">
      <h1 class="text-3xl font-semibold mb-4">{{ noteTitle }}</h1>

      <!-- Properties (Reading Mode) -->
      <Card v-if="isReadingMode && hasProperties" class="mb-6">
        <CardHeader class="cursor-pointer" @click="propertiesExpanded = !propertiesExpanded">
          <div class="flex items-center justify-between">
            <CardTitle class="text-xs uppercase tracking-wide text-muted-foreground">Properties</CardTitle>
            <ChevronRight class="h-4 w-4 transition-transform" :class="{ 'rotate-90': propertiesExpanded }" />
          </div>
        </CardHeader>
        <CardContent v-show="propertiesExpanded" class="space-y-2">
          <div v-for="(value, key) in properties" :key="key" class="flex items-center gap-2">
            <component :is="getPropertyIcon(key as string)" class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground w-20">{{ key }}</span>
            <div class="flex-1 text-sm">
              <template v-if="key === 'tags' && Array.isArray(value)">
                <Badge v-for="tag in value" :key="tag" variant="secondary" class="mr-1">{{ tag }}</Badge>
              </template>
              <template v-else-if="isDateField(key as string)">{{ formatDate(value) }}</template>
              <template v-else>{{ value }}</template>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Markdown Content -->
      <div v-if="isReadingMode" class="prose dark:prose-invert max-w-none" v-html="renderedContent"></div>
      <Textarea
        v-else
        v-model="fullContent"
        class="min-h-[500px] font-mono border-0 focus-visible:ring-0 resize-none"
        placeholder="开始写作..."
        @input="handleContentChange"
        @paste="handlePaste"
      />
    </div>

    <!-- Status Bar -->
    <div class="absolute bottom-4 right-6 flex items-center gap-2 px-3 py-1 text-xs bg-background/90 rounded border">
      <span v-if="isSaving" class="flex items-center gap-1 text-yellow-600">
        <Loader2 class="h-3 w-3 animate-spin" />
        保存中...
      </span>
      <span v-else-if="isDirty" class="text-muted-foreground">未保存</span>
      <span v-else class="text-green-600">已保存</span>
      <span class="text-muted-foreground">|</span>
      <span class="text-muted-foreground">{{ wordCount }} 字</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { marked } from 'marked';
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkIcon,
  Edit3,
  BookOpen,
  MoreVertical,
  Link2,
  ExternalLink,
  Info,
  ChevronRight as ChevronRightIcon,
  Loader2,
  Tag,
  Calendar,
  User,
  FileText as FileTextIcon,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  content: string;
  fileName?: string;
  folderPath?: string;
  isSaving?: boolean;
  isDirty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  fileName: '无标题',
  folderPath: '',
  isSaving: false,
  isDirty: false,
});

const emit = defineEmits<{
  'save': [content: string];
  'paste-files': [files: File[]];
  'drop-files': [files: File[]];
}>();

const isReadingMode = ref(true);
const propertiesExpanded = ref(true);
const isBookmarked = ref(false);
const fullContent = ref(props.content);
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatusText = ref('');
let dragCounter = 0;

const parsedContent = computed(() => {
  const content = fullContent.value || '';
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    const frontmatterStr = match[1];
    const body = content.slice(match[0].length);
    const properties = parseFrontmatter(frontmatterStr);
    return { properties, body };
  }
  
  return { properties: {}, body: content };
});

const properties = computed(() => parsedContent.value.properties);
const hasProperties = computed(() => Object.keys(properties.value).length > 0);
const markdownBody = computed(() => parsedContent.value.body);

const noteTitle = computed(() => {
  return properties.value.title || props.fileName.replace(/\.md$/, '') || '无标题';
});

const displayFileName = computed(() => {
  const name = props.fileName || '';
  return name.endsWith('.md') ? name.slice(0, -3) : name;
});

const renderedContent = computed(() => {
  try {
    return marked(markdownBody.value || '');
  } catch {
    return '<p>渲染错误</p>';
  }
});

const wordCount = computed(() => {
  const text = markdownBody.value || '';
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
});

function parseFrontmatter(str: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = str.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1);
        result[key] = value.split(',').map(v => v.trim()).filter(Boolean);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

function getPropertyIcon(key: string) {
  const iconMap: Record<string, any> = {
    tags: Tag,
    created: Calendar,
    updated: Calendar,
    title: FileTextIcon,
    author: User,
  };
  return iconMap[key] || FileTextIcon;
}

function isDateField(key: string): boolean {
  return ['created', 'updated', 'date'].includes(key);
}

function formatDate(value: any): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleString('zh-CN');
  } catch {
    return String(value);
  }
}

function toggleMode() {
  isReadingMode.value = !isReadingMode.value;
}

function toggleBookmark() {
  isBookmarked.value = !isBookmarked.value;
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
}

function openInNewTab() {
  window.open(window.location.href, '_blank');
}

function showFileInfo() {
  console.log('Show file info');
}

const debouncedSave = useDebounceFn((content: string) => {
  emit('save', content);
}, 500);

function handleContentChange() {
  debouncedSave(fullContent.value);
}

async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;

  const files: File[] = [];
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  if (files.length > 0) {
    e.preventDefault();
    emit('paste-files', files);
  }
}

function handleDrop(e: DragEvent) {
  dragCounter = 0;
  isDragOver.value = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    emit('drop-files', Array.from(files));
  }
}

watch(() => props.content, (newContent) => {
  if (newContent !== fullContent.value) {
    fullContent.value = newContent;
  }
}, { immediate: true });
</script>

<style>
.drag-over {
  outline: 2px dashed hsl(var(--primary));
  outline-offset: -2px;
}
</style>
