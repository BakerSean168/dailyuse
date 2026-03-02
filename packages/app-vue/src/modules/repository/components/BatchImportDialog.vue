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
            <span class="text-sm font-medium"
              >{{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'file' : 'files' }}</span
            >
            <Button variant="ghost" size="sm" @click="selectedFiles = []">
              <X class="h-4 w-4 mr-1" />
              Clear
            </Button>
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
            @keydown.comma.prevent="addTag"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isImporting" @click="isOpen = false">
          {{ t('repository.import.btnCancel') }}
        </Button>
        <Button :disabled="selectedFiles.length === 0 || isImporting" @click="handleImport">
          <Loader2 v-if="isImporting" class="h-4 w-4 mr-2 animate-spin" />
          {{ isImporting ? t('repository.import.importing') : t('repository.import.btnImport') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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

const isOpen = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  import: [files: File[], tags: string[]];
}>();

const { t } = useI18n();

const fileInputRef = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);
const tags = ref<string[]>([]);
const tagInput = ref('');
const isDragOver = ref(false);
const isImporting = ref(false);

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

async function handleImport() {
  if (selectedFiles.value.length === 0) return;
  isImporting.value = true;
  try {
    emit('import', [...selectedFiles.value], [...tags.value]);
  } finally {
    // Parent is responsible for closing dialog and resetting state on success
    isImporting.value = false;
  }
}
</script>
