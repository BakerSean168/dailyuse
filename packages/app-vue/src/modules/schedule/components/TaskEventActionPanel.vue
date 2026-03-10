<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-xl pb-safe">
      <SheetHeader class="text-left">
        <SheetTitle class="flex items-center gap-2">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-info shrink-0" />
          {{ event?.title ?? '' }}
        </SheetTitle>
        <SheetDescription>
          {{ event ? formatTimeRange(event) : '' }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-4 space-y-3">
        <!-- Status badge -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">{{ t('task.field.status') }}:</span>
          <span
            class="inline-block rounded px-2 py-0.5 text-xs font-medium"
            :class="statusBadgeClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <!-- Complete action -->
        <div v-if="event && event.instanceStatus !== 'Completed'" class="pt-2">
          <Button class="w-full gap-2" :disabled="completing" @click="handleComplete">
            <CheckCircle2 class="h-4 w-4" />
            {{ t('task.action.complete') }}
          </Button>
        </div>

        <!-- Already completed state -->
        <div
          v-else-if="event && event.instanceStatus === 'Completed'"
          class="flex items-center justify-center gap-2 rounded-lg border border-success/40 bg-success/10 py-3 text-sm font-medium text-success"
        >
          <CheckCircle2 class="h-4 w-4" />
          {{ t('task.status.completed') }}
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CheckCircle2 } from 'lucide-vue-next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
} from '@dailyuse/ui-vue-shadcn';
import type { CalendarEventItem } from '../composables/useCalendarView';

interface Props {
  open: boolean;
  event: CalendarEventItem | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'complete-task', originalId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const completing = ref(false);

function formatTimeRange(event: CalendarEventItem): string {
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  return `${fmt(event.startTime)} – ${fmt(event.endTime)}`;
}

const statusBadgeClass = computed(() => {
  switch (props.event?.instanceStatus) {
    case 'Completed':
      return 'bg-success/15 text-success';
    case 'InProgress':
      return 'bg-info/15 text-info';
    case 'Skipped':
      return 'bg-muted text-muted-foreground';
    case 'Expired':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-warning/15 text-warning';
  }
});

const statusLabel = computed(() => {
  const status = props.event?.instanceStatus;
  if (!status) return '';
  const key = `task.instanceStatus.${status.toLowerCase()}`;
  return t(key, status);
});

async function handleComplete() {
  if (!props.event) return;
  completing.value = true;
  emit('complete-task', props.event.originalId);
  // Parent is responsible for the async call; we close optimistically
  emit('update:open', false);
  completing.value = false;
}
</script>
