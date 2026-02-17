<!--
  AIKnowledgeGeneratorDialog - AI Knowledge Generator Dialog - shadcn/ui version
-->

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="h-5 w-5 text-primary" />
          AI 知识文档生成
        </DialogTitle>
        <DialogDescription>
          描述你想了解的知识主题，AI 将为你生成结构化的知识文档。
        </DialogDescription>
      </DialogHeader>

      <!-- Input Stage -->
      <div v-if="!isGenerating && !isComplete" class="space-y-4">
        <div>
          <Label for="prompt">知识主题</Label>
          <Textarea
            id="prompt"
            v-model="prompt"
            placeholder="例如：详细讲讲软路由相关知识，包括常见软路由系统对比、硬件选型、典型应用场景等"
            rows="4"
            maxlength="500"
            :disabled="isGenerating"
            class="resize-none"
          />
          <p class="text-xs text-muted-foreground mt-1">{{ prompt.length }}/500</p>
        </div>

        <div class="flex items-center space-x-2">
          <Switch id="create-folder" v-model:checked="createFolder" />
          <Label for="create-folder">创建子文件夹</Label>
        </div>

        <div v-if="createFolder">
          <Label for="folder-name">文件夹名称</Label>
          <Input
            id="folder-name"
            v-model="folderName"
            placeholder="留空则使用主题名称"
            :disabled="isGenerating"
          />
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder class="h-3 w-3" />
          保存位置：{{ savePath }}
        </div>
      </div>

      <!-- Generating Stage -->
      <div v-else-if="isGenerating" class="space-y-4">
        <div class="flex items-center gap-2">
          <Loader2 class="h-4 w-4 animate-spin text-primary" />
          <span class="text-sm">正在生成知识文档...</span>
        </div>

        <Card class="max-h-80 overflow-y-auto">
          <CardContent class="p-3">
            <div class="prose prose-sm dark:prose-invert" v-html="renderedContent"></div>
            <span class="inline-block w-1 h-4 bg-primary animate-pulse">|</span>
          </CardContent>
        </Card>

        <p class="text-xs text-muted-foreground">已生成 {{ generatedContent.length }} 字符</p>
      </div>

      <!-- Complete Stage -->
      <div v-else-if="isComplete" class="space-y-4">
        <Alert>
          <CheckCircle class="h-4 w-4" />
          <AlertTitle>生成完成</AlertTitle>
          <AlertDescription>知识文档已成功生成并保存</AlertDescription>
        </Alert>

        <Card>
          <CardContent class="p-3 flex items-center gap-2">
            <FileText class="h-5 w-5 text-primary" />
            <div>
              <div class="text-sm font-medium">{{ generatedFileName }}</div>
              <div class="text-xs text-muted-foreground">{{ resultPath }}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Error -->
      <Alert v-if="error" variant="destructive" class="mt-4">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <DialogFooter>
        <Button v-if="!isComplete" variant="outline" :disabled="isGenerating" @click="$emit('update:open', false)">
          取消
        </Button>
        <Button
          v-if="!isGenerating && !isComplete"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          <Sparkles class="mr-2 h-4 w-4" />
          生成
        </Button>
        <Button
          v-if="isComplete"
          @click="handleOpenDocument"
        >
          <ExternalLink class="mr-2 h-4 w-4" />
          查看文档
        </Button>
        <Button
          v-if="isComplete"
          variant="outline"
          @click="$emit('update:open', false)"
        >
          完成
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import {
  Sparkles,
  Folder,
  Loader2,
  CheckCircle,
  FileText,
  ExternalLink,
  AlertCircle,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  open: boolean;
  repositoryName?: string;
  parentFolderName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  repositoryName: '知识库',
  parentFolderName: '',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  generate: [options: GenerateOptions];
  'open-document': [uuid: string];
}>();

interface GenerateOptions {
  topic: string;
  createFolder: boolean;
  folderName?: string;
}

const prompt = ref('');
const folderName = ref('');
const createFolder = ref(true);
const generatedContent = ref('');
const isGenerating = ref(false);
const isComplete = ref(false);
const error = ref('');
const generatedResourceUuid = ref<string | null>(null);
const generatedFileName = ref('');
const resultPath = ref('');

const canGenerate = computed(() => prompt.value.trim().length >= 2);

const savePath = computed(() => {
  const repo = props.repositoryName;
  const parentPath = props.parentFolderName ? `/${props.parentFolderName}` : '';
  const folderPath = createFolder.value ? `/${folderName.value || extractTopicName(prompt.value) || '新知识'}` : '';
  return `${repo}${parentPath}${folderPath}`;
});

const renderedContent = computed(() => {
  try {
    return marked(generatedContent.value);
  } catch {
    return generatedContent.value;
  }
});

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Reset state
    prompt.value = '';
    folderName.value = '';
    createFolder.value = true;
    generatedContent.value = '';
    isGenerating.value = false;
    isComplete.value = false;
    error.value = '';
    generatedResourceUuid.value = null;
    generatedFileName.value = '';
    resultPath.value = '';
  }
});

watch(prompt, (newPrompt) => {
  if (!folderName.value && newPrompt) {
    folderName.value = extractTopicName(newPrompt);
  }
});

function extractTopicName(text: string): string {
  const keywords = text.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
  if (keywords && keywords.length > 0) {
    return keywords.slice(0, 3).join('').substring(0, 30);
  }
  return '';
}

function handleGenerate() {
  if (!canGenerate.value) return;

  emit('generate', {
    topic: prompt.value.trim(),
    createFolder: createFolder.value,
    folderName: folderName.value.trim() || undefined,
  });
}

function handleOpenDocument() {
  if (generatedResourceUuid.value) {
    emit('open-document', generatedResourceUuid.value);
  }
  emit('update:open', false);
}

// Expose methods for parent to control
defineExpose({
  setGenerating: (value: boolean) => { isGenerating.value = value; },
  appendContent: (chunk: string) => { generatedContent.value += chunk; },
  setComplete: (options: { fileName: string; filePath: string; resourceUuid: string }) => {
    generatedFileName.value = options.fileName;
    resultPath.value = options.filePath;
    generatedResourceUuid.value = options.resourceUuid;
    isComplete.value = true;
    isGenerating.value = false;
  },
  setError: (errorMessage: string) => {
    error.value = errorMessage;
    isGenerating.value = false;
  },
});
</script>
