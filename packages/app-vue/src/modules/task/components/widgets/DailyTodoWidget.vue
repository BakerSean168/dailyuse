<template>
  <Card class="border-border/50 flex flex-col">
    <CardHeader class="pb-2 px-4 pt-4 flex flex-row items-center justify-between shrink-0">
      <CardTitle class="text-sm font-medium text-foreground flex items-center gap-2">
        <ListTodo class="w-4 h-4 text-muted-foreground" />
        今日待办
      </CardTitle>
      <div class="flex items-center gap-2">
        <!-- Progress text -->
        <span class="text-[11px] text-muted-foreground font-mono">
          {{ completedCount }}/{{ todayInstances.length }}
        </span>
        <Button variant="ghost" size="sm" class="h-7 text-xs" @click="$emit('view-all')">
          查看全部
          <ArrowRight class="w-3 h-3 ml-1" />
        </Button>
      </div>
    </CardHeader>

    <!-- Progress bar -->
    <div class="px-4 pb-2 shrink-0">
      <div class="h-1 rounded-full bg-muted overflow-hidden">
        <div
          class="h-full rounded-full bg-emerald-500 transition-all duration-500"
          :style="{ width: progressPct + '%' }"
        />
      </div>
    </div>

    <CardContent class="px-4 pb-4 flex-1 overflow-hidden">
      <!-- Loading skeleton -->
      <template v-if="isLoading">
        <div class="space-y-2">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3">
            <Skeleton class="h-4 w-4 rounded-full shrink-0" />
            <Skeleton class="h-3 flex-1" />
            <Skeleton class="h-3 w-12" />
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else-if="todayInstances.length === 0">
        <div class="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 class="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p class="text-xs text-muted-foreground">今日暂无任务安排</p>
        </div>
      </template>

      <!-- Task list -->
      <template v-else>
        <ScrollArea class="h-[200px]">
          <div class="space-y-0.5 pr-2">
            <div
              v-for="inst in sortedInstances"
              :key="inst.id"
              class="group flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50 transition-colors"
              :class="{ 'opacity-50': inst.status === 'Completed' || inst.status === 'Skipped' }"
            >
              <!-- Complete button (circle dot) -->
              <button
                class="shrink-0 flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="completeBtnClass(inst.status)"
                :disabled="
                  inst.status === 'Completed' || inst.status === 'Skipped' || completing === inst.id
                "
                :title="inst.status === 'Completed' ? '已完成' : '标记完成'"
                @click.stop="handleComplete(inst)"
              >
                <Check v-if="inst.status === 'Completed'" class="w-2.5 h-2.5 text-white" />
                <Loader2
                  v-else-if="completing === inst.id"
                  class="w-2.5 h-2.5 text-muted-foreground animate-spin"
                />
              </button>

              <!-- Task title -->
              <span
                class="flex-1 min-w-0 text-xs text-foreground truncate"
                :class="{ 'line-through text-muted-foreground': inst.status === 'Completed' }"
              >
                {{ templateName(inst.templateId) }}
              </span>

              <!-- Time label -->
              <span class="shrink-0 text-[10px] text-muted-foreground font-mono">
                {{ timeLabel(inst) }}
              </span>

              <!-- Status badge (Skipped / Expired) -->
              <span
                v-if="inst.status === 'Skipped' || inst.status === 'Expired'"
                class="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium"
                :class="{
                  'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground':
                    inst.status === 'Skipped',
                  'bg-destructive/15 text-destructive dark:bg-destructive/30 dark:text-destructive':
                    inst.status === 'Expired',
                }"
              >
                {{ inst.status === 'Skipped' ? '已跳过' : '已过期' }}
              </span>
            </div>
          </div>
        </ScrollArea>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { endOfDay, isSameDay, startOfDay } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { ListTodo, ArrowRight, CheckCircle2, Check, Loader2 } from 'lucide-vue-next';
import { useTask } from '../../composables/useTask';
import type { TaskInstanceClientDTO, TaskTemplateClientDTO } from '@dailyuse/contracts/task';

const emit = defineEmits<{
  (e: 'view-all'): void;
}>();

const task = useTask();
const completing = ref<string | null>(null);

const TEMPLATE_FETCH_LIMIT = 200;

function getTodayRange(): { startDate: number; endDate: number } {
  const now = new Date();
  return {
    startDate: startOfDay(now).getTime(),
    endDate: endOfDay(now).getTime(),
  };
}

// ── Load today's data on mount ──
onMounted(async () => {
  const todayRange = getTodayRange();
  await Promise.all([
    task.fetchInstancesByDateRange(todayRange.startDate, todayRange.endDate),
    task.fetchTemplates({ page: 1, limit: TEMPLATE_FETCH_LIMIT }),
  ]);
});

const isLoading = computed(() => task.isLoading.value);

// ── Derive today's instances ──
const todayInstances = computed<TaskInstanceClientDTO[]>(() => {
  return (task.instances.value ?? []).filter((inst) => {
    return isSameDay(new Date(inst.instanceDate), new Date());
  });
});

// Sort: Pending/InProgress first (by time), then Completed/Skipped/Expired
const sortedInstances = computed(() => {
  const active = todayInstances.value.filter(
    (i) => i.status !== 'Completed' && i.status !== 'Skipped' && i.status !== 'Expired',
  );
  const done = todayInstances.value.filter(
    (i) => i.status === 'Completed' || i.status === 'Skipped' || i.status === 'Expired',
  );
  const byTime = (a: TaskInstanceClientDTO, b: TaskInstanceClientDTO) => {
    const ta = a.timeConfig?.timeRange?.start ?? a.timeConfig?.timePoint ?? 0;
    const tb = b.timeConfig?.timeRange?.start ?? b.timeConfig?.timePoint ?? 0;
    return (ta ?? 0) - (tb ?? 0);
  };
  return [...active.sort(byTime), ...done.sort(byTime)];
});

const completedCount = computed(
  () => todayInstances.value.filter((i) => i.status === 'Completed').length,
);

const progressPct = computed(() => {
  const total = todayInstances.value.length;
  if (total === 0) return 0;
  return Math.round((completedCount.value / total) * 100);
});

// ── Template name lookup ──
const templateMap = computed<Map<string, TaskTemplateClientDTO>>(() => {
  return new Map((task.templates.value ?? []).map((t) => [t.id, t]));
});

function templateName(templateId: string): string {
  return templateMap.value.get(templateId)?.name ?? templateId;
}

// ── Time label ──
function timeLabel(inst: TaskInstanceClientDTO): string {
  const fmt = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const tr = inst.timeConfig?.timeRange;
  if (tr && typeof tr.start === 'number') {
    return fmt(tr.start);
  }
  const tp = inst.timeConfig?.timePoint;
  if (typeof tp === 'number') {
    return fmt(tp);
  }
  return '全天';
}

// ── Complete button style ──
function completeBtnClass(status: string): string {
  if (status === 'Completed') {
    return 'border-emerald-500 bg-emerald-500 cursor-default';
  }
  if (status === 'Skipped' || status === 'Expired') {
    return 'border-muted-foreground/30 bg-muted cursor-default';
  }
  return 'border-muted-foreground/50 bg-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer';
}

// ── Complete handler ──
async function handleComplete(inst: TaskInstanceClientDTO) {
  if (completing.value || inst.status === 'Completed' || inst.status === 'Skipped') return;
  completing.value = inst.id;
  await task.completeInstance(inst.id);
  completing.value = null;
}
</script>
