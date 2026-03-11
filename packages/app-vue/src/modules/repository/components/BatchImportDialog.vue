<!--
  BatchImportDialog - Drag-drop file import with batch tag assignment
  Allows users to import multiple files and assign tags to all of them at once.
-->

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t('repository.import.title') }}</DialogTitle>
        <DialogDescription>{{ t('repository.import.description') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          :class="
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          "
          @dragenter.prevent="isDragOver = true"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <Upload class="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p class="text-sm font-medium">{{ t('repository.import.dropzone') }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('repository.import.supportedTypes') }}
          </p>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
        </div>

        <!-- Selected Files -->
        <div v-if="selectedFiles.length > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-sm font-medium">{{
                t('repository.import.fileCount', { count: selectedFiles.length })
              }}</span>
              <div class="text-xs text-muted-foreground">
                {{ t('repository.import.totalSize', { size: formatSize(totalSize) }) }}
              </div>
            </div>
            <Button variant="ghost" size="sm" :disabled="importing" @click="clearFiles">
              <X class="h-4 w-4 mr-1" />
              {{ t('repository.import.clearSelection') }}
            </Button>
          </div>
          <div
            v-if="duplicateFiles.length > 0"
            class="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
          >
            {{ t('repository.import.duplicatesSkipped', { count: duplicateFiles.length }) }}
          </div>
          <ScrollArea class="max-h-32">
            <div class="space-y-1">
              <div
                v-for="(file, idx) in selectedFiles"
                :key="idx"
                class="flex items-center gap-2 px-2 py-1 rounded text-sm bg-muted/50"
              >
                <component
                  :is="getFileTypeIcon(file)"
                  class="h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span class="truncate flex-1">{{ file.name }}</span>
                <span class="text-xs text-muted-foreground shrink-0">{{
                  formatSize(file.size)
                }}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-5 w-5 shrink-0"
                  @click="removeFile(idx)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- Tag Assignment -->
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('repository.import.addTags') }}</label>
          <div class="flex flex-wrap gap-1 mb-2">
            <Badge
              v-for="tag in tags"
              :key="tag"
              variant="secondary"
              class="cursor-pointer"
              @click="removeTag(tag)"
            >
              {{ tag }}
              <X class="h-3 w-3 ml-1" />
            </Badge>
          </div>
          <Input
            v-model="tagInput"
            :placeholder="t('repository.import.addTagsPlaceholder')"
            @keydown.enter.prevent="addTag"
            @keydown.,.prevent="addTag"
          />
        </div>

        <div v-if="importing" class="space-y-2 rounded-md border bg-muted/40 p-3">
          <div class="flex items-center justify-between text-sm">
            <span>{{ t('repository.import.importing') }}</span>
            <span class="text-muted-foreground">{{ progress.completed }}/{{ progress.total }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full bg-primary transition-all duration-200"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <div v-if="progress.currentFileName" class="text-xs text-muted-foreground truncate">
            {{ progress.currentFileName }}
          </div>
        </div>

        <div v-if="summary" class="space-y-2 rounded-md border bg-muted/40 p-3">
          <div class="text-sm font-medium">{{ summaryTitle }}</div>
          <div class="text-xs text-muted-foreground">
            {{
              t('repository.import.summary', {
                successCount: summary.successes.length,
                failureCount: summary.failures.length,
              })
            }}
          </div>
          <div v-if="summary.failures.length > 0" class="space-y-1">
            <div class="text-xs font-medium text-destructive">
              {{ t('repository.import.failedFiles') }}
            </div>
            <div class="max-h-24 overflow-y-auto space-y-1">
              <div
                v-for="failure in summary.failures"
                :key="failure.fileName"
                class="text-xs text-muted-foreground"
              >
                {{ failure.fileName }} - {{ failure.message }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="importing" @click="isOpen = false">
          {{ summary ? t('repository.import.btnDone') : t('repository.import.btnCancel') }}
        </Button>
        <Button :disabled="selectedFiles.length === 0 || importing" @click="handleImport">
          <Loader2 v-if="importing" class="h-4 w-4 mr-2 animate-spin" />
          {{ importing ? t('repository.import.importing') : t('repository.import.btnImport') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Upload,
  X,
  Loader2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@dailyuse/ui-vue-shadcn';
import { Button, Badge, Input, ScrollArea } from '@dailyuse/ui-vue-shadcn';
import type {
  RepositoryUploadProgress,
  RepositoryUploadResult,
} from '../composables/useRepository';

const isOpen = defineModel<boolean>('open', { default: false });

const props = withDefaults(
  defineProps<{
    importing?: boolean;
    progress?: RepositoryUploadProgress;
    summary?: RepositoryUploadResult | null;
  }>(),
  {
    importing: false,
    progress: () => ({ total: 0, completed: 0, currentFileName: null }),
    summary: null,
  },
);

const emit = defineEmits<{
  import: [files: File[], tags: string[]];
}>();

const { t } = useI18n();

const fileInputRef = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);
const tags = ref<string[]>([]);
const tagInput = ref('');
const isDragOver = ref(false);
const duplicateFiles = ref<string[]>([]);

const totalSize = computed(() => selectedFiles.value.reduce((sum, file) => sum + file.size, 0));
const progressPercent = computed(() => {
  if (!props.progress.total) {
    return 0;
  }

  return Math.round((props.progress.completed / props.progress.total) * 100);
});
const summaryTitle = computed(() =>
  props.summary?.failures.length
    ? t('repository.import.partialSuccess')
    : t('repository.import.importSuccess', { count: props.summary?.successes.length ?? 0 }),
);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
    input.value = '';
  }
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false;
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files));
  }
}

function addFiles(files: File[]) {
  // Deduplicate by name + size
  const existing = new Set(selectedFiles.value.map((f) => `${f.name}_${f.size}`));
  const newFiles = files.filter((f) => !existing.has(`${f.name}_${f.size}`));
  const duplicates = files
    .filter((file) => existing.has(`${file.name}_${file.size}`))
    .map((file) => file.name);

  duplicateFiles.value = duplicates;
  selectedFiles.value.push(...newFiles);
}

function removeFile(idx: number) {
  selectedFiles.value.splice(idx, 1);
}

function addTag() {
  const tag = tagInput.value.trim().replace(/,$/, '');
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
  }
  tagInput.value = '';
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag);
}

function getFileTypeIcon(file: File) {
  const type = file.type || '';
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.includes('markdown') || file.name.endsWith('.md')) return FileText;
  if (type.startsWith('text/')) return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function clearFiles() {
  selectedFiles.value = [];
  duplicateFiles.value = [];
}

function resetState() {
  selectedFiles.value = [];
  tags.value = [];
  tagInput.value = '';
  duplicateFiles.value = [];
}

async function handleImport() {
  if (selectedFiles.value.length === 0 || props.importing) return;
  emit('import', [...selectedFiles.value], [...tags.value]);
}

watch(
  () => props.summary,
  (summary) => {
    if (summary && summary.failures.length === 0) {
      resetState();
    }
  },
);
</script>
