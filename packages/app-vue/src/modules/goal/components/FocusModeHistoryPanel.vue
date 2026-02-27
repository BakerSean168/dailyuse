<template>
  <Card>
    <CardHeader class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <History class="w-5 h-5" />
        <CardTitle>{{ t('goal.focusMode.historyPanel.title') }}</CardTitle>
      </div>
      <Button variant="ghost" size="icon" :disabled="isLoading" @click="handleRefresh">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
      </Button>
    </CardHeader>

    <CardContent>
      <!-- Data Table -->
      <div class="relative overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b">
            <tr>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.goalHeader') }}</th>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.statusHeader') }}</th>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.startTimeHeader') }}</th>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.endTimeHeader') }}</th>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.durationHeader') }}</th>
              <th class="text-left p-2">{{ t('goal.focusMode.historyPanel.hiddenModeHeader') }}</th>
              <th class="text-center p-2">{{ t('goal.focusMode.historyPanel.actionHeader') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in focusModeHistory" :key="item.id" class="border-b hover:bg-muted/50">
              <td class="p-2">
                <div class="flex flex-wrap gap-1">
                  <Badge
                    v-for="goalId in item.focusedGoalIds"
                    :key="goalId"
                    variant="outline"
                    class="text-xs"
                  >
                    {{ getGoalTitle(goalId) }}
                  </Badge>
                </div>
              </td>
              <td class="p-2">
                <Badge :variant="getStatusVariant(item)">
                  <component :is="getStatusIcon(item)" class="w-3 h-3 mr-1" />
                  {{ getStatusText(item) }}
                </Badge>
              </td>
              <td class="p-2 text-xs text-muted-foreground">
                {{ formatDate(item.startTime) }}
              </td>
              <td class="p-2 text-xs text-muted-foreground">
                {{ formatDate(item.endTime) }}
              </td>
              <td class="p-2 text-xs">
                {{ calculateDuration(item) }}
              </td>
              <td class="p-2">
                <Badge variant="secondary" class="text-xs">
                  {{ getHiddenModeLabel(item.hiddenGoalsMode) }}
                </Badge>
              </td>
              <td class="p-2">
                <div class="flex justify-center gap-1">
                  <Button
                    v-if="item.isActive && !isExpiredItem(item)"
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    @click="handleExtend(item)"
                  >
                    <CalendarPlus class="w-4 h-4" />
                  </Button>
                  <Button
                    v-if="item.isActive"
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-destructive"
                    @click="handleDeactivate(item)"
                  >
                    <XCircle class="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
            <tr v-if="focusModeHistory.length === 0">
              <td colspan="7" class="p-8 text-center">
                <div class="flex flex-col items-center gap-2">
                  <History class="w-16 h-16 text-muted-foreground" />
                  <div class="text-lg font-semibold text-muted-foreground">
                    {{ t('goal.focusMode.historyPanel.empty') }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ t('goal.focusMode.historyPanel.emptyHint') }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  History,
  RefreshCw,
  CalendarPlus,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-vue-next';
import type { FocusModeClientDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';

interface Props {
  focusModeHistory?: FocusModeClientDTO[];
  isLoading?: boolean;
  goals?: Array<{ id: string; title: string }>;
  onRefresh?: () => Promise<void>;
  onExtend?: (item: FocusModeClientDTO, newEndTime: number) => Promise<void>;
  onDeactivate?: (id: string) => Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  focusModeHistory: () => [],
  isLoading: false,
  goals: () => [],
});

const { t, locale } = useI18n();

const emit = defineEmits<{
  refresh: [];
  extend: [item: FocusModeClientDTO, newEndTime: number];
  deactivate: [id: string];
}>();

onMounted(async () => {
  if (props.onRefresh) {
    await props.onRefresh();
  } else {
    emit('refresh');
  }
});

const getStatusVariant = (
  item: FocusModeClientDTO,
): 'default' | 'outline' | 'destructive' | 'secondary' => {
  if (item.isActive) {
    if (isExpiredItem(item)) return 'destructive';
    return 'default';
  }
  if (isExpiredItem(item)) return 'secondary';
  return 'secondary';
};

const getStatusIcon = (item: FocusModeClientDTO) => {
  if (item.isActive) {
    if (isExpiredItem(item)) return AlertCircle;
    return CheckCircle;
  }
  if (isExpiredItem(item)) return Clock;
  return XCircle;
};

const getStatusText = (item: FocusModeClientDTO): string => {
  if (item.isActive) {
    if (isExpiredItem(item)) return t('goal.focusMode.historyPanel.expired');
    return t('goal.focusMode.historyPanel.active');
  }
  if (isExpiredItem(item)) return t('goal.focusMode.historyPanel.expired');
  return t('goal.focusMode.historyPanel.closed');
};

const isExpiredItem = (item: FocusModeClientDTO): boolean => {
  return Date.now() > item.endTime;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateDuration = (item: FocusModeClientDTO): string => {
  const duration = item.endTime - item.startTime;
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  return `${days} ${t('goal.focusMode.historyPanel.days')}`;
};

const getHiddenModeLabel = (mode: HiddenGoalsMode): string => {
  const labels: Record<string, string> = {
    hide: t('goal.focusMode.historyPanel.modeHide'),
    dim: t('goal.focusMode.historyPanel.modeDim'),
    collapse: t('goal.focusMode.historyPanel.modeFold'),
    hide_all: t('goal.focusMode.historyPanel.modeHideAll'),
    hide_folder: t('goal.focusMode.historyPanel.modeHideFolder'),
    hide_none: t('goal.focusMode.historyPanel.modeNone'),
  };
  return labels[mode] || mode;
};

const getGoalTitle = (id: string): string => {
  const goal = props.goals.find((g) => g.id === id);
  return goal?.title ?? id.slice(0, 8);
};

const handleRefresh = async () => {
  if (props.onRefresh) {
    await props.onRefresh();
  } else {
    emit('refresh');
  }
};

const handleExtend = (item: FocusModeClientDTO) => {
  const newEndTime = item.endTime + 7 * 24 * 60 * 60 * 1000;

  if (props.onExtend) {
    props.onExtend(item, newEndTime);
  } else {
    emit('extend', item, newEndTime);
  }
};

const handleDeactivate = (item: FocusModeClientDTO) => {
  if (!confirm(t('goal.focusMode.historyPanel.confirmClose'))) {
    return;
  }

  if (props.onDeactivate) {
    props.onDeactivate(item.id);
  } else {
    emit('deactivate', item.id);
  }
};
</script>
