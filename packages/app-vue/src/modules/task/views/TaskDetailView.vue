<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">
          {{ currentTemplate?.name || t('task.detail.title') }}
        </h1>
        <Badge v-if="currentTemplate" :variant="statusVariant">{{ currentTemplate.status }}</Badge>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <div v-if="isLoading" class="flex h-[50vh] items-center justify-center text-muted-foreground">
        {{ t('task.detail.loading') }}
      </div>

      <div
        v-else-if="!currentTemplate"
        class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
      >
        <FileQuestion class="mb-4 h-12 w-12 opacity-50" />
        <p>{{ t('task.detail.notFound') }}</p>
      </div>

      <div v-else class="mx-auto max-w-4xl space-y-6">
        <!-- Info Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.basicInfo') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.importance') }}
              </p>
              <p class="text-sm">{{ currentTemplate.importance }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.priority') }}
              </p>
              <p class="text-sm">{{ currentTemplate.priority }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.createTime') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.updateTime') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate.updatedAt) }}</p>
            </div>
            <div v-if="currentTemplate.description" class="sm:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.description') }}
              </p>
              <p class="text-sm">{{ currentTemplate.description }}</p>
            </div>
            <div v-if="currentTemplate.tags?.length" class="sm:col-span-2">
              <p class="mb-1 text-sm font-medium text-muted-foreground">
                {{ t('task.detail.tags') }}
              </p>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in currentTemplate.tags" :key="tag" variant="secondary">{{
                  tag
                }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.executionStats') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ currentTemplate.instanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.totalInstances') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ currentTemplate.completedInstanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.completed') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">
                {{ ((currentTemplate.completionRate ?? 0) * 100).toFixed(0) }}%
              </p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.completionRate') }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, FileQuestion } from 'lucide-vue-next';
import {
  Button,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@dailyuse/ui-vue-shadcn';
import { useTask } from '../composables/useTask';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { currentTemplate, isLoading, fetchTemplate } = useTask();

const statusVariant = computed(() => {
  switch (currentTemplate.value?.status) {
    case 'Active':
      return 'default' as const;
    case 'Paused':
      return 'secondary' as const;
    case 'Archived':
      return 'outline' as const;
    default:
      return 'destructive' as const;
  }
});

function formatDate(ts?: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString(locale.value);
}

onMounted(async () => {
  const id = route.params.id as string;
  if (id && id !== 'new') {
    await fetchTemplate(id);
  }
});
</script>
