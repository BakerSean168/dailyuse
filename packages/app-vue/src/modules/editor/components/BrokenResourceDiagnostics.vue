<template>
  <div class="rounded-lg border bg-background/80">
    <div class="flex items-center justify-between border-b px-4 py-3">
      <div>
        <h3 class="text-sm font-semibold">{{ t('editor.diagnostics.title') }}</h3>
        <p class="text-xs text-muted-foreground">
          {{
            diagnostics.length > 0
              ? t('editor.diagnostics.count', { count: diagnostics.length })
              : t('editor.diagnostics.empty')
          }}
        </p>
      </div>
    </div>

    <div v-if="diagnostics.length === 0" class="px-4 py-4 text-sm text-muted-foreground">
      {{ t('editor.diagnostics.emptyDescription') }}
    </div>

    <div v-else class="divide-y">
      <div
        v-for="item in diagnostics"
        :key="`${item.reference.start}-${item.reference.end}`"
        class="px-4 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-destructive">
              {{ item.reference.destination }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">{{ item.reference.raw }}</div>
          </div>
          <Button size="sm" variant="outline" @click="$emit('repair', item.reference)">
            {{ t('editor.diagnostics.repair') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { ResourceReferenceUsage } from '../utils/resourceReferenceIndex';

defineProps<{
  diagnostics: ResourceReferenceUsage[];
}>();

defineEmits<{
  repair: [reference: ResourceReferenceUsage['reference']];
}>();

const { t } = useI18n();
</script>
