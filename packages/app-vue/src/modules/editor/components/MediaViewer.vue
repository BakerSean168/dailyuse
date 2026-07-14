<template>
  <div class="relative flex flex-col w-full h-full bg-background">
    <div class="flex-1 flex items-center justify-center overflow-auto p-6">
      <!-- Image Viewer -->
      <div v-if="fileType === 'image'" class="flex flex-col items-center max-w-full">
        <img
          :src="resolvedSource"
          :alt="fileName"
          @load="handleImageLoad"
          @error="handleImageError"
          class="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-lg"
        />

        <div v-if="imageInfo" class="flex gap-2 mt-4">
          <Badge variant="secondary"> {{ imageInfo.width }} × {{ imageInfo.height }} </Badge>
          <Badge variant="secondary">
            {{ imageInfo.size }}
          </Badge>
        </div>
      </div>

      <!-- Video Player -->
      <div v-else-if="fileType === 'video'" class="w-full max-w-5xl">
        <video
          :src="resolvedSource"
          controls
          @loadedmetadata="handleVideoLoad"
          class="w-full max-h-[calc(100vh-200px)] rounded-lg shadow-lg"
        >
          {{ t('editor.mediaViewer.videoNotSupported') }}
        </video>
      </div>

      <!-- Audio Player -->
      <div v-else-if="fileType === 'audio'" class="w-full max-w-2xl">
        <div class="flex flex-col items-center p-12 bg-muted/20 rounded-2xl">
          <Music class="h-16 w-16 text-primary mb-4" />
          <div class="text-lg font-medium mb-4">{{ fileName }}</div>
          <audio :src="resolvedSource" controls class="w-full max-w-md">
            {{ t('editor.mediaViewer.audioNotSupported') }}
          </audio>
        </div>
      </div>

      <!-- Unsupported Type -->
      <div v-else class="flex flex-col items-center text-muted-foreground">
        <FileQuestion class="h-16 w-16 mb-4" />
        <div class="text-lg font-semibold">{{ t('editor.mediaViewer.unsupportedFileType') }}</div>
        <div class="text-sm mt-2">{{ fileName }}</div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error Alert -->
    <Alert
      v-if="error"
      variant="destructive"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[90%]"
    >
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Music, FileQuestion, AlertCircle } from '@lucide/vue';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    filePath: string;
    fileType: 'image' | 'video' | 'audio';
    fileName?: string;
    fileContent?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
  }>(),
  {
    fileName: 'Untitled',
    fileContent: null,
    mimeType: null,
    fileSize: null,
  },
);

const loading = ref(false);
const error = ref<string | null>(null);
const imageInfo = ref<{
  width: number;
  height: number;
  size: string;
} | null>(null);
const resolvedSource = computed(() => {
  if (props.fileContent && props.fileContent.trim()) {
    const trimmed = props.fileContent.trim();
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file://')
    ) {
      return trimmed;
    }

    return `data:${props.mimeType || 'application/octet-stream'};base64,${trimmed.replace(/\s+/g, '')}`;
  }

  return props.filePath;
});

function handleImageLoad(event: Event) {
  loading.value = false;
  const img = event.target as HTMLImageElement;

  imageInfo.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: formatFileSize(props.fileSize ?? 0),
  };
}

function handleImageError() {
  loading.value = false;
  error.value = t('editor.mediaViewer.imageLoadFailed');
}

function handleVideoLoad(_event: Event) {
  loading.value = false;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return t('editor.mediaViewer.unknownSize');
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

onMounted(() => {
  loading.value = Boolean(resolvedSource.value);
});

watch(
  () => [resolvedSource.value, props.fileType],
  () => {
    error.value = null;
    imageInfo.value = null;
    loading.value = Boolean(resolvedSource.value);
  },
);
</script>
