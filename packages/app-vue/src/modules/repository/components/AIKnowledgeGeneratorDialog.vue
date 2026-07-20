<!--
  AIKnowledgeGeneratorDialog - AI Knowledge Generator Dialog - shadcn/ui version
-->

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="h-5 w-5 text-primary" />
          {{ t('repository.aiKnowledge.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('repository.aiKnowledge.description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Input Stage -->
      <div v-if="!isGenerating && !isComplete" class="space-y-4">
        <div>
          <Label for="prompt">{{ t('repository.aiKnowledge.topic') }}</Label>
          <Textarea
            id="prompt"
            v-model="prompt"
            :placeholder="t('repository.aiKnowledge.topicPlaceholder')"
            rows="4"
            maxlength="500"
            :disabled="isGenerating"
            class="resize-none"
          />
          <p class="text-xs text-muted-foreground mt-1">{{ prompt.length }}/500</p>
        </div>

        <div class="flex items-center space-x-2">
          <Switch id="create-folder" v-model:checked="createFolder" />
          <Label for="create-folder">{{ t('repository.aiKnowledge.createSubfolder') }}</Label>
        </div>

        <div v-if="createFolder">
          <Label for="folder-name">{{ t('repository.aiKnowledge.folderName') }}</Label>
          <Input
            id="folder-name"
            v-model="folderName"
            :placeholder="t('repository.aiKnowledge.folderNamePlaceholder')"
            :disabled="isGenerating"
          />
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder class="h-3 w-3" />
          {{ t('repository.aiKnowledge.saveLocation') }}{{ savePath }}
        </div>
      </div>

      <!-- Generating Stage -->
      <div v-else-if="isGenerating" class="space-y-4">
        <div class="flex items-center gap-2">
          <Loader2 class="h-4 w-4 animate-spin text-primary" />
          <span class="text-sm">{{ t('repository.aiKnowledge.generating') }}</span>
        </div>

        <Card class="max-h-80 overflow-y-auto">
          <CardContent class="p-3">
            <div class="prose prose-sm dark:prose-invert" v-html="renderedContent"></div>
            <span class="inline-block w-1 h-4 bg-primary animate-pulse">|</span>
          </CardContent>
        </Card>

        <p class="text-xs text-muted-foreground">
          {{ t('repository.aiKnowledge.generatedChars', { count: generatedContent.length }) }}
        </p>
      </div>

      <!-- Complete Stage -->
      <div v-else-if="isComplete" class="space-y-4">
        <Alert>
          <CheckCircle class="h-4 w-4" />
          <AlertTitle>{{ t('repository.aiKnowledge.generateComplete') }}</AlertTitle>
          <AlertDescription>{{
            t('repository.aiKnowledge.generateCompleteDesc')
          }}</AlertDescription>
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
        <AlertTitle>{{ t('repository.aiKnowledge.error') }}</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <DialogFooter>
        <Button
          v-if="!isComplete"
          variant="outline"
          :disabled="isGenerating"
          @click="$emit('update:open', false)"
        >
          {{ t('repository.aiKnowledge.cancel') }}
        </Button>
        <Button
          v-if="!isGenerating && !isComplete"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          <Sparkles class="mr-2 h-4 w-4" />
          {{ t('repository.aiKnowledge.generate') }}
        </Button>
        <Button v-if="isComplete" @click="handleOpenNote">
          <ExternalLink class="mr-2 h-4 w-4" />
          {{ t('repository.aiKnowledge.viewNote') }}
        </Button>
        <Button v-if="isComplete" variant="outline" @click="$emit('update:open', false)">
          {{ t('repository.aiKnowledge.done') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { renderSafeMarkdown } from '../../../shared/utils/safe-markdown';
import {
  Sparkles,
  Folder,
  Loader2,
  CheckCircle,
  FileText,
  ExternalLink,
  AlertCircle,
} from '@lucide/vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Switch } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription, AlertTitle } from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    open: boolean;
    repositoryName?: string;
    parentFolderName?: string;
  }>(),
  {
    repositoryName: '',
    parentFolderName: '',
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  generate: [options: GenerateOptions];
  'open-note': [id: string];
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
const generatedResourceId = ref<string | null>(null);
const generatedFileName = ref('');
const resultPath = ref('');

const canGenerate = computed(() => prompt.value.trim().length >= 2);

const savePath = computed(() => {
  const repo = props.repositoryName || t('repository.aiKnowledge.defaultRepositoryName');
  const parentPath = props.parentFolderName ? `/${props.parentFolderName}` : '';
  const folderPath = createFolder.value
    ? `/${folderName.value || extractTopicName(prompt.value) || t('repository.aiKnowledge.newKnowledge')}`
    : '';
  return `${repo}${parentPath}${folderPath}`;
});

const renderedContent = computed(() => renderSafeMarkdown(generatedContent.value));

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Reset state
      prompt.value = '';
      folderName.value = '';
      createFolder.value = true;
      generatedContent.value = '';
      isGenerating.value = false;
      isComplete.value = false;
      error.value = '';
      generatedResourceId.value = null;
      generatedFileName.value = '';
      resultPath.value = '';
    }
  },
);

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

function handleOpenNote() {
  if (generatedResourceId.value) {
    emit('open-note', generatedResourceId.value);
  }
  emit('update:open', false);
}

// Expose methods for parent to control
defineExpose({
  setGenerating: (value: boolean) => {
    isGenerating.value = value;
  },
  appendContent: (chunk: string) => {
    generatedContent.value += chunk;
  },
  setComplete: (options: { fileName: string; filePath: string; resourceId: string }) => {
    generatedFileName.value = options.fileName;
    resultPath.value = options.filePath;
    generatedResourceId.value = options.resourceId;
    isComplete.value = true;
    isGenerating.value = false;
  },
  setError: (errorMessage: string) => {
    error.value = errorMessage;
    isGenerating.value = false;
  },
});
</script>
