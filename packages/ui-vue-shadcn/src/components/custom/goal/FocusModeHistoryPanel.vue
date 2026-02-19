<template>
  <Card>
    <CardHeader class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <History class="w-5 h-5" />
        <CardTitle>专注周期历史</CardTitle>
      </div>
      <Button
        variant="ghost"
        size="icon"
        :disabled="isLoading"
        @click="handleRefresh"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
      </Button>
    </CardHeader>

    <CardContent>
      <!-- Data Table -->
      <div class="relative overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b">
            <tr>
              <th class="text-left p-2">专注目标</th>
              <th class="text-left p-2">状态</th>
              <th class="text-left p-2">开始时间</th>
              <th class="text-left p-2">结束时间</th>
              <th class="text-left p-2">持续时间</th>
              <th class="text-left p-2">隐藏模式</th>
              <th class="text-center p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in focusModeHistory"
              :key="item.id"
              class="border-b hover:bg-muted/50"
            >
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
                  <div class="text-lg font-semibold text-muted-foreground">暂无专注周期历史</div>
                  <div class="text-sm text-muted-foreground">启用专注模式后，历史记录将显示在这里</div>
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
import { History, RefreshCw, CalendarPlus, XCircle, CheckCircle, AlertCircle, Clock } from 'lucide-vue-next';
import type { FocusModeClientDTO, HiddenGoalsMode } from '@dailyuse/contracts/goal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

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

const getStatusVariant = (item: FocusModeClientDTO): 'default' | 'outline' | 'destructive' | 'secondary' => {
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
    if (isExpiredItem(item)) return '已过期';
    return '进行中';
  }
  if (isExpiredItem(item)) return '已过期';
  return '已关闭';
};

const isExpiredItem = (item: FocusModeClientDTO): boolean => {
  return Date.now() > item.endTime;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
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
  return `${days} 天`;
};

const getHiddenModeLabel = (mode: HiddenGoalsMode): string => {
  const labels: Record<string, string> = {
    hide: '隐藏',
    dim: '变暗',
    collapse: '折叠',
    hide_all: '隐藏所有',
    hide_folder: '隐藏文件夹',
    hide_none: '不隐藏',
  };
  return labels[mode] || mode;
};

const getGoalTitle = (id: string): string => {
  const goal = props.goals.find(g => g.id === id);
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
  if (!confirm(`确定要关闭该专注周期吗？`)) {
    return;
  }

  if (props.onDeactivate) {
    props.onDeactivate(item.id);
  } else {
    emit('deactivate', item.id);
  }
};
</script>
