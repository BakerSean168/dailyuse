<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="w-full">
      <div class="flex items-center gap-2">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="text-sm text-muted-foreground">{{
          t('schedule.conflictAlert.detecting')
        }}</span>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('schedule.conflictAlert.error') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- No Conflicts -->
    <Alert
      v-if="!isLoading && conflicts && !conflicts.hasConflict"
      variant="default"
      class="border-success/40 bg-success/10 text-success"
    >
      <CheckCircle class="h-4 w-4" />
      <AlertDescription>{{ t('schedule.conflictAlert.noConflict') }}</AlertDescription>
    </Alert>

    <!-- Conflicts Detected -->
    <Alert v-if="conflicts?.hasConflict" variant="destructive" class="border-l-4">
      <AlertTitle class="flex items-center gap-2 text-base font-semibold">
        <AlertCircle class="h-5 w-5" />
        {{ t('schedule.conflictAlert.conflictsDetected', { n: conflicts.conflicts.length }) }}
      </AlertTitle>

      <Separator class="my-3" />

      <!-- Conflict List -->
      <div class="space-y-3">
        <div
          v-for="(conflict, index) in conflicts.conflicts"
          :key="index"
          class="flex items-center gap-2 flex-wrap"
        >
          <Badge :variant="getSeverityVariant(conflict.severity)" class="shrink-0">
            {{ getSeverityLabel(conflict.severity) }}
          </Badge>
          <span class="font-medium">{{
            t('schedule.conflictAlert.conflictWith', { title: conflict.scheduleTitle })
          }}</span>
          <span class="text-sm text-destructive font-medium ml-auto">
            {{
              t('schedule.conflictAlert.overlap', {
                duration: formatDuration(conflict.overlapDuration),
              })
            }}
          </span>
        </div>
      </div>

      <Separator class="my-3" />

      <!-- Suggestions -->
      <div v-if="conflicts.suggestions.length > 0" class="space-y-3">
        <div class="flex items-center gap-1 text-sm font-medium">
          <Lightbulb class="h-4 w-4" />
          {{ t('schedule.conflictAlert.suggestion') }}
        </div>
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="(suggestion, index) in conflicts.suggestions"
            :key="index"
            size="sm"
            variant="outline"
            @click="handleApplySuggestion(suggestion)"
          >
            {{ getSuggestionLabel(suggestion) }}
          </Button>
          <Button size="sm" variant="ghost" @click="handleIgnore">
            {{ t('schedule.conflictAlert.ignoreConflict') }}
          </Button>
        </div>
      </div>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { AlertCircle, CheckCircle, Lightbulb, Loader2 } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { formatScheduleDurationMinutes } from '../../../shared/utils/format-schedule-duration-minutes';
import { formatProductHm } from '../../../shared/utils/product-time';
import {
  ConflictSeverity,
  ConflictSuggestionType,
  type ConflictDetectionResult,
  type ConflictSuggestion,
} from '@dailyuse/contracts/schedule';

interface Props {
  conflicts: ConflictDetectionResult | null;
  isLoading: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'apply-suggestion', suggestion: ConflictSuggestion): void;
  (e: 'ignore-conflict'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

/**
 * Residual 1246 keep-boundary: ScheduleConflictAlert conflict summary — i18n noConflict / conflictsDetected.
 * Full loading/error/no-conflict/has-conflict states; not English describeConflict pill strings.
 * Soft residual 1246: ConflictAlert hasConflict-only path + formatSuggestion advanceTo family (no force-merge).
 */

const getSeverityVariant = (severity?: ConflictSeverity): 'default' | 'destructive' | 'outline' => {
  if (severity === ConflictSeverity.Severe) return 'destructive';
  if (severity === ConflictSeverity.Moderate) return 'default';
  return 'outline';
};

const getSeverityLabel = (severity?: ConflictSeverity): string => {
  const labels: Record<ConflictSeverity, string> = {
    [ConflictSeverity.Severe]: t('schedule.severity.severe'),
    [ConflictSeverity.Moderate]: t('schedule.severity.moderate'),
    [ConflictSeverity.Minor]: t('schedule.severity.minor'),
  };
  return severity ? labels[severity] || t('common.unknown') : t('common.unknown');
};

/**
 * Residual 1243 keep-boundary / Residual 1324: schedule conflict minutes duration dual retired onto
 * formatScheduleDurationMinutes sole (total minutes → schedule.duration.* i18n; hours-only band).
 * Soft residual: ConflictAlert ms floor path + presentation durationMs/Sec + task graph differ (no force-merge).
 */
const formatDuration = (minutes: number): string => formatScheduleDurationMinutes(minutes, t);

const getSuggestionLabel = (suggestion: ConflictSuggestion): string => {
  if (suggestion.type === ConflictSuggestionType.MoveEarlier) {
    const timeStr = formatProductHm(suggestion.newStartTime);
    return t('schedule.conflictAlert.moveEarlier', { time: timeStr });
  }

  if (suggestion.type === ConflictSuggestionType.MoveLater) {
    const timeStr = formatProductHm(suggestion.newStartTime);
    return t('schedule.conflictAlert.moveLater', { time: timeStr });
  }

  if (suggestion.type === ConflictSuggestionType.Shorten) {
    return t('schedule.conflictAlert.shortenDuration');
  }

  return t('schedule.conflictAlert.adjustTime');
};

const handleApplySuggestion = (suggestion: ConflictSuggestion): void => {
  emit('apply-suggestion', suggestion);
};

const handleIgnore = (): void => {
  emit('ignore-conflict');
};
</script>
