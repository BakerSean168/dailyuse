<template>
  <Alert
    v-if="!dismissed && conflictResult && conflictResult.hasConflict"
    variant="destructive"
    class="mb-4 relative"
  >
    <AlertCircle class="h-4 w-4" />
    <AlertTitle class="font-semibold pr-6">
      {{ t('schedule.conflictAlert.conflictsDetected', { n: conflictResult.conflicts.length }) }}
    </AlertTitle>
    <AlertDescription class="mt-2 space-y-2">
      <div class="text-sm">
        <div v-for="conflict in conflictResult.conflicts" :key="conflict.scheduleId" class="mb-1">
          • {{ t('schedule.conflictAlert.conflictWith', { title: conflict.scheduleTitle }) }}
          {{
            t('schedule.conflictAlert.overlap', {
              duration: formatDuration(conflict.overlapDuration),
            })
          }}
        </div>
      </div>

      <div
        v-if="conflictResult.suggestions.length > 0"
        class="text-xs mt-3 pt-2 border-t border-border/40"
      >
        <strong>{{ t('schedule.conflictAlert.suggestion') }}</strong>
        <span v-for="(suggestion, index) in conflictResult.suggestions" :key="index">
          {{ formatSuggestion(suggestion) }}
          <span v-if="index < conflictResult.suggestions.length - 1"> · </span>
        </span>
      </div>
    </AlertDescription>

    <Button
      v-if="dismissible"
      variant="ghost"
      size="icon"
      :aria-label="t('common.close')"
      class="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
      @click="handleDismiss"
    >
      <X class="h-4 w-4" />
    </Button>
  </Alert>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { AlertCircle, X } from '@lucide/vue';
import { splitDurationMs } from '@dailyuse/time';
import { useI18n } from 'vue-i18n';
import { formatProductHm } from '../../../shared/utils/product-time';
import {
  ConflictSuggestionType,
  type ConflictDetectionResult,
  type ConflictSuggestion,
} from '@dailyuse/contracts/schedule';

interface Props {
  conflictResult: ConflictDetectionResult | null;
  dismissible?: boolean;
}

withDefaults(defineProps<Props>(), {
  dismissible: true,
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

const dismissed = ref(false);

const { t } = useI18n();

function handleDismiss() {
  dismissed.value = true;
  emit('dismiss');
}

/**
 * Soft residual 1243: ConflictAlert formatDuration — ms → floor minutes; hoursMinutes always when h>0 (no hours-only).
 * Always passes m remainder; differs from ScheduleConflictAlert hours-only band (no force-merge).
 */
function formatDuration(ms: number): string {
  // Soft residual 1243: ms → minutes via time split; hoursMinutes always when h>0 (no hours-only).
  const { hours, totalMinutes } = splitDurationMs(ms);
  if (hours > 0) {
    return t('schedule.duration.hoursMinutes', { h: hours, m: totalMinutes % 60 });
  }
  return t('schedule.duration.minutes', { n: totalMinutes });
}

/**
 * Soft residual 1246: ConflictAlert conflict summary — conflictsDetected only when hasConflict (no noConflict empty path).
 * formatSuggestion uses advanceTo/delayTo/shortenTo; differs from ScheduleConflictAlert getSuggestionLabel moveEarlier family.
 */
function formatSuggestion(suggestion: ConflictSuggestion): string {
  const startTime = formatProductHm(suggestion.newStartTime);
  const endTime = formatProductHm(suggestion.newEndTime);

  switch (suggestion.type) {
    case ConflictSuggestionType.MoveEarlier:
      return t('schedule.conflictAlert.advanceTo', { start: startTime, end: endTime });
    case ConflictSuggestionType.MoveLater:
      return t('schedule.conflictAlert.delayTo', { start: startTime, end: endTime });
    case ConflictSuggestionType.Shorten:
      return t('schedule.conflictAlert.shortenTo', { start: startTime, end: endTime });
    default:
      return '';
  }
}
</script>
