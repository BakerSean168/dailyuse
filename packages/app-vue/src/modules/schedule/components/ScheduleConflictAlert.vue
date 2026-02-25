<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="w-full">
      <div class="flex items-center gap-2">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="text-sm text-muted-foreground">检测冲突中...</span>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>错误</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- No Conflicts -->
    <Alert v-if="!isLoading && conflicts && !conflicts.hasConflict" variant="default" class="border-green-200 bg-green-50 text-green-800">
      <CheckCircle class="h-4 w-4" />
      <AlertDescription>无时间冲突</AlertDescription>
    </Alert>

    <!-- Conflicts Detected -->
    <Alert v-if="conflicts?.hasConflict" variant="destructive" class="border-l-4">
      <AlertTitle class="flex items-center gap-2 text-base font-semibold">
        <AlertCircle class="h-5 w-5" />
        检测到 {{ conflicts.conflicts.length }} 个时间冲突
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
          <span class="font-medium">与"{{ conflict.scheduleTitle }}"冲突</span>
          <span class="text-sm text-destructive font-medium ml-auto">
            重叠 {{ formatDuration(conflict.overlapDuration) }}
          </span>
        </div>
      </div>

      <Separator class="my-3" />

      <!-- Suggestions -->
      <div v-if="conflicts.suggestions.length > 0" class="space-y-3">
        <div class="flex items-center gap-1 text-sm font-medium">
          <Lightbulb class="h-4 w-4" />
          建议调整：
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
            忽略冲突
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
import { AlertCircle, CheckCircle, Lightbulb, Loader2 } from 'lucide-vue-next';
import type { ConflictDetectionResult, ConflictSuggestion } from '@dailyuse/contracts/schedule';

interface Props {
  conflicts: ConflictDetectionResult | null;
  isLoading: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'apply-suggestion', suggestion: ConflictSuggestion): void;
  (e: 'ignore-conflict'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const getSeverityVariant = (severity?: 'minor' | 'moderate' | 'severe'): 'default' | 'destructive' | 'outline' => {
  if (severity === 'severe') return 'destructive';
  if (severity === 'moderate') return 'default';
  return 'outline';
};

const getSeverityLabel = (severity?: 'minor' | 'moderate' | 'severe'): string => {
  const labels: Record<string, string> = {
    severe: '严重',
    moderate: '中',
    minor: '轻微',
  };
  return severity ? labels[severity] || '未知' : '未知';
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
};

const getSuggestionLabel = (suggestion: ConflictSuggestion): string => {
  if (suggestion.type === 'move_earlier') {
    const startTime = new Date(suggestion.newStartTime);
    const timeStr = startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `移至 ${timeStr} (提前)`;
  }
  
  if (suggestion.type === 'move_later') {
    const startTime = new Date(suggestion.newStartTime);
    const timeStr = startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `移至 ${timeStr} (推后)`;
  }
  
  if (suggestion.type === 'shorten') {
    return '缩短时长';
  }
  
  return '调整时间';
};

const handleApplySuggestion = (suggestion: ConflictSuggestion): void => {
  emit('apply-suggestion', suggestion);
};

const handleIgnore = (): void => {
  emit('ignore-conflict');
};
</script>
