<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t('editor.exportDialog.title') }}</DialogTitle>
        <DialogDescription>{{ t('editor.exportDialog.description') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="rounded-lg border bg-muted/20 p-4 text-sm">
          <div class="font-medium">{{ t('editor.exportDialog.summaryTitle') }}</div>
          <div class="mt-2 flex flex-wrap gap-3 text-muted-foreground">
            <span>{{
              t('editor.exportDialog.converted', { count: result?.convertedCount ?? 0 })
            }}</span>
            <span>{{
              t('editor.exportDialog.skipped', { count: result?.skippedCount ?? 0 })
            }}</span>
          </div>
        </div>

        <div
          v-if="result?.failures.length"
          class="rounded-lg border border-warning/40 bg-warning/5 p-4"
        >
          <div class="mb-2 text-sm font-medium">{{ t('editor.exportDialog.failuresTitle') }}</div>
          <ul class="space-y-1 text-xs text-muted-foreground">
            <li
              v-for="failure in result.failures"
              :key="`${failure.resourceId ?? 'missing'}-${failure.path}`"
            >
              {{ failure.path }} - {{ t(`editor.exportDialog.failureReasons.${failure.reason}`) }}
            </li>
          </ul>
        </div>

        <Textarea
          :model-value="result?.markdown ?? ''"
          class="min-h-[320px] font-mono text-xs"
          :readonly="true"
        />

        <DialogFooter>
          <Button variant="outline" @click="emit('download')">
            {{ t('editor.exportDialog.download') }}
          </Button>
          <Button @click="emit('copy')">
            {{ t('editor.exportDialog.copy') }}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';
import type { SelfContainedExportResult } from '../composables/useResourceInsertion';

defineProps<{
  open: boolean;
  result: SelfContainedExportResult | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  copy: [];
  download: [];
}>();

const { t } = useI18n();

function handleOpenChange(value: boolean) {
  emit('update:open', value);
}
</script>
