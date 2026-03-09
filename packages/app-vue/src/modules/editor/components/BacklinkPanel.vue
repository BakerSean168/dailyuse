<template>
  <Card class="h-full flex flex-col border-l">
    <CardHeader class="flex flex-row items-center space-x-2 p-3">
      <Link2 class="h-5 w-5 text-primary" />
      <CardTitle class="text-lg">{{ t('editor.backlink.title') }}</CardTitle>
      <Badge v-if="!loading" variant="secondary" class="ml-2">
        {{ backlinks.length }}
      </Badge>
      <div class="flex-1" />
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="refresh" :disabled="loading">
        <RotateCw :class="['h-4 w-4', loading && 'animate-spin']" />
      </Button>
    </CardHeader>

    <Separator />

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
      <p class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="backlinks.length === 0"
      class="flex-1 flex flex-col items-center justify-center p-6 text-center"
    >
      <Link2Off class="h-16 w-16 text-muted-foreground/50 mb-3" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('editor.backlink.empty') }}</p>
      <p class="text-xs text-muted-foreground mt-1">{{ t('editor.backlink.emptyDescription') }}</p>
    </div>

    <!-- Backlinks List -->
    <ScrollArea v-else class="flex-1">
      <div class="p-2 space-y-2">
        <div
          v-for="backlink in backlinks"
          :key="backlink.link.id"
          @click="navigateToSource(backlink)"
          class="p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors"
        >
          <div class="flex items-start gap-3">
            <Avatar class="h-8 w-8">
              <AvatarFallback class="bg-primary/10">
                <FileText class="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>

            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">
                {{ backlink.sourceDocument.title }}
              </div>

              <div class="text-xs text-muted-foreground mt-1 line-clamp-2">
                {{ backlink.context }}
              </div>

              <div class="flex items-center gap-2 mt-2">
                <Badge variant="outline" class="text-xs">
                  <Clock class="h-3 w-3 mr-1" />
                  {{ formatDate(backlink.sourceDocument.updatedAt) }}
                </Badge>
                <Badge v-if="backlink.link.isBroken" variant="destructive" class="text-xs">
                  {{ t('editor.backlink.broken') }}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click.stop="navigateToSource(backlink)"
            >
              <ExternalLink class="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Error Alert -->
    <Alert v-if="error" variant="destructive" class="m-3">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Avatar, AvatarFallback } from '@dailyuse/ui-vue-shadcn';
import { ScrollArea } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import {
  Link2,
  Link2Off,
  RotateCw,
  FileText,
  Clock,
  ExternalLink,
  AlertCircle,
} from 'lucide-vue-next';

const { t, locale } = useI18n();

interface BacklinkDTO {
  link: { id: string; isBroken: boolean };
  sourceDocument: { id: string; title: string; updatedAt: number };
  context: string;
}

const props = withDefaults(
  defineProps<{
    documentId: string;
    autoLoad?: boolean;
  }>(),
  {
    autoLoad: true,
  },
);

const emit = defineEmits<{
  navigate: [sourceDocumentId: string];
}>();

const loading = ref(false);
const backlinks = ref<BacklinkDTO[]>([]);
const error = ref<string | null>(null);

async function loadBacklinks() {
  if (!props.documentId) return;

  loading.value = true;
  error.value = null;

  try {
    backlinks.value = [];
    error.value = t('editor.backlink.comingSoon');
  } catch (err: any) {
    console.error('Load backlinks failed:', err);
    error.value = err.message || t('editor.backlink.loadFailed');
    backlinks.value = [];
  } finally {
    loading.value = false;
  }
}

function refresh() {
  loadBacklinks();
}

function navigateToSource(backlink: BacklinkDTO) {
  const sourceId = backlink.sourceDocument.id;
  emit('navigate', sourceId);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('editor.backlink.today');
  if (diffDays === 1) return t('editor.backlink.yesterday');
  if (diffDays < 7) return t('editor.backlink.daysAgo', { n: diffDays });
  if (diffDays < 30) return t('editor.backlink.weeksAgo', { n: Math.floor(diffDays / 7) });
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
}

watch(
  () => props.documentId,
  (newId) => {
    if (newId && props.autoLoad) {
      loadBacklinks();
    }
  },
);

onMounted(() => {
  if (props.documentId && props.autoLoad) {
    loadBacklinks();
  }
});

defineExpose({
  refresh: loadBacklinks,
});
</script>
