<template>
  <Card v-if="show" class="sticky top-16 z-50 border-l-4" :class="getBorderColorClass(status)">
    <CardContent class="flex items-center justify-between py-3 px-4 min-h-[60px]">
      <!-- Left side: Status info -->
      <div class="flex items-center gap-3">
        <component
          :is="getStatusIcon(status)"
          :class="getStatusColorClass(status)"
          class="h-6 w-6"
        />

        <div>
          <div class="text-sm font-semibold">
            {{ statusText }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ detailText }}
          </div>
        </div>
      </div>

      <!-- Right side: Actions -->
      <div class="flex items-center gap-2">
        <!-- Remaining days indicator -->
        <Badge :variant="getRemainingDaysBadgeVariant(remainingDays)" class="font-medium">
          <Clock class="mr-1 h-3 w-3" />
          {{ t('goal.focusMode.statusBar.remainingDays', { n: remainingDays }) }}
        </Badge>

        <!-- Extend button -->
        <Button variant="outline" size="sm" :disabled="loading" @click="$emit('extend')">
          <CalendarPlus class="mr-2 h-4 w-4" />
          {{ t('goal.focusMode.statusBar.extend') }}
        </Button>

        <!-- Close button -->
        <Button variant="outline" size="sm" :disabled="loading" @click="$emit('close')">
          <XCircle class="mr-2 h-4 w-4" />
          {{ t('goal.focusMode.statusBar.close') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge, type BadgeVariants } from '@dailyuse/ui-vue-shadcn';
import { Clock, CalendarPlus, XCircle, Target, AlertCircle } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

type FocusModeStatus = 'active' | 'expired';

interface Props {
  show?: boolean;
  status: FocusModeStatus;
  statusText: string;
  detailText: string;
  remainingDays: number;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: true,
  loading: false,
});

defineEmits<{
  (e: 'extend'): void;
  (e: 'close'): void;
}>();

function getStatusIcon(status: FocusModeStatus) {
  return status === 'expired' ? AlertCircle : Target;
}

function getStatusColorClass(status: FocusModeStatus): string {
  return status === 'expired' ? 'text-destructive' : 'text-green-600';
}

function getBorderColorClass(status: FocusModeStatus): string {
  return status === 'expired' ? 'border-destructive' : 'border-green-600';
}

function getRemainingDaysBadgeVariant(days: number): BadgeVariants['variant'] {
  if (days <= 3) return 'destructive';
  if (days <= 7) return 'secondary';
  return 'default';
}
</script>
