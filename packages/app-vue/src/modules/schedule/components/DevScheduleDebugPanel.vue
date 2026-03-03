<template>
  <div v-if="isDev" class="fixed bottom-4 right-4 z-50">
    <!-- Trigger button -->
    <Button
      variant="outline"
      size="icon"
      class="h-9 w-9 rounded-full border-dashed border-muted-foreground/50 bg-background/80 backdrop-blur-sm"
      @click="open = true"
    >
      <Bug class="h-4 w-4 text-muted-foreground" />
    </Button>

    <!-- Debug panel sheet -->
    <Sheet :open="open" @update:open="open = $event">
      <SheetContent side="right" class="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <Bug class="h-4 w-4" />
            {{ t('schedule.dev.title') }}
          </SheetTitle>
          <SheetDescription>{{ t('schedule.dev.subtitle') }}</SheetDescription>
        </SheetHeader>

        <div class="mt-4 space-y-3">
          <div v-if="tasks.length === 0" class="py-6 text-center text-sm text-muted-foreground">
            {{ t('schedule.dev.noTasks') }}
          </div>

          <div v-for="task in tasks" :key="task.id" class="rounded-lg border bg-card p-3 text-xs">
            <div class="flex items-start justify-between gap-2">
              <span class="font-medium text-foreground">{{ task.name }}</span>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 font-medium"
                :class="statusClass(task.statusColor)"
              >
                {{ task.statusDisplay }}
              </span>
            </div>
            <div class="mt-1.5 space-y-0.5 text-muted-foreground">
              <div>
                <span class="text-foreground/60">{{ t('schedule.dev.source') }}:</span>
                {{ task.sourceModuleDisplay }}
              </div>
              <div>
                <span class="text-foreground/60">{{ t('schedule.dev.enabled') }}:</span>
                {{ task.enabledDisplay }}
              </div>
              <div>
                <span class="text-foreground/60">{{ t('schedule.dev.nextRun') }}:</span>
                {{ task.nextRunAtFormatted || '—' }}
              </div>
              <div>
                <span class="text-foreground/60">{{ t('schedule.dev.executions') }}:</span>
                {{ task.executionSummary }}
              </div>
              <div>
                <span class="text-foreground/60">{{ t('schedule.dev.health') }}:</span>
                <span :class="healthClass(task.healthStatus)">{{ task.healthStatus }}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bug } from 'lucide-vue-next';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@dailyuse/ui-vue-shadcn';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';

interface Props {
  tasks: ScheduleTaskClientDTO[];
}

defineProps<Props>();

const { t } = useI18n();

const isDev = import.meta.env.DEV;
const open = ref(false);

function statusClass(color: string): string {
  const map: Record<string, string> = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return map[color] ?? map['gray'];
}

function healthClass(health: string): string {
  const map: Record<string, string> = {
    healthy: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  };
  return map[health] ?? '';
}
</script>
