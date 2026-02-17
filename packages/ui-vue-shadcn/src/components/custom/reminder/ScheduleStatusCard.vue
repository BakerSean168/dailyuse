<template>
  <Card :class="['w-full', { 'opacity-50': isLoading }]">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <component :is="statusIcon" :class="['h-5 w-5', statusColor]" />
          <CardTitle>Schedule Status</CardTitle>
        </div>
        <Badge v-if="scheduleStatus" :variant="scheduleStatus.enabled ? 'default' : 'secondary'">
          {{ scheduleStatus.enabled ? 'Enabled' : 'Disabled' }}
        </Badge>
      </div>
    </CardHeader>

    <Separator />

    <CardContent class="pt-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-3">
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-2" />
        <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
        <Button variant="outline" size="sm" @click="$emit('refresh')">Retry</Button>
      </div>

      <!-- No Schedule -->
      <div v-else-if="!scheduleStatus || !scheduleStatus.hasSchedule" class="text-center py-8">
        <CalendarClock class="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p class="text-sm font-medium">No Schedule Set</p>
        <p class="text-xs text-muted-foreground mt-1">This reminder template has no automatic schedule configured</p>
      </div>

      <!-- Schedule Details -->
      <div v-else class="space-y-4">
        <!-- Cron Expression -->
        <div v-if="scheduleStatus.cronExpression" class="flex items-start gap-3">
          <Clock class="h-5 w-5 text-muted-foreground mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Cron Expression</p>
            <code class="text-xs bg-muted px-2 py-1 rounded mt-1 block">{{ scheduleStatus.cronExpression }}</code>
          </div>
        </div>

        <!-- Cron Description -->
        <div v-if="scheduleStatus.cronDescription" class="flex items-start gap-3">
          <FileText class="h-5 w-5 text-muted-foreground mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Schedule Rule</p>
            <p class="text-sm text-muted-foreground mt-1">{{ scheduleStatus.cronDescription }}</p>
          </div>
        </div>

        <!-- Next Run -->
        <div v-if="scheduleStatus.nextRunAt" class="flex items-start gap-3">
          <FastForward class="h-5 w-5 text-primary mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Next Execution</p>
            <p class="text-sm text-primary font-medium mt-1">
              {{ formatDateTime(scheduleStatus.nextRunAt) }}
              <span class="text-xs text-muted-foreground ml-1">({{ getRelativeTime(scheduleStatus.nextRunAt) }})</span>
            </p>
          </div>
        </div>

        <!-- Last Run -->
        <div v-if="scheduleStatus.lastRunAt" class="flex items-start gap-3">
          <CheckCircle2 class="h-5 w-5 text-muted-foreground mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Last Execution</p>
            <p class="text-sm text-muted-foreground mt-1">
              {{ formatDateTime(scheduleStatus.lastRunAt) }}
              <span class="text-xs ml-1">({{ getRelativeTime(scheduleStatus.lastRunAt) }})</span>
            </p>
          </div>
        </div>

        <!-- Execution Count -->
        <div class="flex items-start gap-3">
          <Hash class="h-5 w-5 text-muted-foreground mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Execution Count</p>
            <p class="text-sm text-muted-foreground mt-1">{{ scheduleStatus.executionCount }} times</p>
          </div>
        </div>

        <!-- Status -->
        <div class="flex items-start gap-3">
          <Info class="h-5 w-5 text-muted-foreground mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">Status</p>
            <Badge :variant="getStatusVariant(scheduleStatus.status)" class="mt-1">
              {{ getStatusText(scheduleStatus.status) }}
            </Badge>
          </div>
        </div>

        <!-- Recent Executions -->
        <Accordion v-if="scheduleStatus.recentExecutions && scheduleStatus.recentExecutions.length > 0" type="single" collapsible>
          <AccordionItem value="history">
            <AccordionTrigger>
              <div class="flex items-center gap-2">
                <History class="h-4 w-4" />
                <span>Recent Execution History ({{ scheduleStatus.recentExecutions.length }})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="space-y-2 pt-2">
                <div
                  v-for="(execution, index) in scheduleStatus.recentExecutions"
                  :key="index"
                  class="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div class="flex-1">
                    <p class="text-xs">{{ formatDateTime(execution.executedAt) }}</p>
                    <p v-if="execution.error" class="text-xs text-destructive mt-1">{{ execution.error }}</p>
                  </div>
                  <Badge :variant="execution.success ? 'default' : 'destructive'" class="text-xs">
                    {{ execution.success ? 'Success' : 'Failed' }}
                  </Badge>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </CardContent>

    <Separator v-if="scheduleStatus && scheduleStatus.hasSchedule" />

    <CardFooter v-if="scheduleStatus && scheduleStatus.hasSchedule" class="justify-end">
      <Button variant="outline" size="sm" :disabled="isLoading" @click="$emit('refresh')">
        <RefreshCw :class="['h-4 w-4 mr-2', { 'animate-spin': isLoading }]" />
        Refresh
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CalendarClock,
  AlertCircle,
  Clock,
  FileText,
  FastForward,
  CheckCircle2,
  Hash,
  Info,
  History,
  RefreshCw,
  CalendarCheck,
  CalendarX,
} from 'lucide-vue-next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Execution {
  executedAt: Date | string | number;
  success: boolean;
  error?: string;
}

interface ScheduleStatus {
  enabled: boolean;
  hasSchedule: boolean;
  cronExpression?: string;
  cronDescription?: string;
  triggerType?: string;
  scheduledTime?: Date | string | number;
  nextRunAt?: Date | string | number;
  lastRunAt?: Date | string | number;
  executionCount: number;
  status?: string;
  recentExecutions?: Execution[];
}

interface Props {
  scheduleStatus?: ScheduleStatus | null;
  isLoading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleStatus: null,
  isLoading: false,
  error: null,
});

const emit = defineEmits<{
  'refresh': [];
}>();

const statusColor = computed(() => {
  if (!props.scheduleStatus || !props.scheduleStatus.hasSchedule) return 'text-muted-foreground';
  if (!props.scheduleStatus.enabled) return 'text-orange-500';
  if (props.scheduleStatus.status === 'ACTIVE') return 'text-green-500';
  if (props.scheduleStatus.status === 'PAUSED') return 'text-orange-500';
  if (props.scheduleStatus.status === 'CANCELLED') return 'text-destructive';
  return 'text-muted-foreground';
});

const statusIcon = computed(() => {
  if (!props.scheduleStatus || !props.scheduleStatus.hasSchedule) return CalendarClock;
  if (props.scheduleStatus.enabled) return CalendarCheck;
  return CalendarX;
});

const formatDateTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
};

const getRelativeTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const getStatusVariant = (status: string | undefined): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'PAUSED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusText = (status: string | undefined): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Running';
    case 'PAUSED':
      return 'Paused';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};
</script>
