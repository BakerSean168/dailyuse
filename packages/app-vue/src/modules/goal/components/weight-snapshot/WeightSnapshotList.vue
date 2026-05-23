<template>
  <div class="w-full">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{{ t('goal.weightSnapshotList.title') }}</CardTitle>
        <div class="flex items-center gap-0.5">
          <Button
            v-for="range in timeRanges"
            :key="range.value"
            :variant="selectedRange === range.value ? 'default' : 'ghost'"
            size="sm"
            @click="selectedRange = range.value"
          >
            {{ range.label }}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <!-- 筛选器 -->
        <div class="mb-4 grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-4">
            <Select v-model="selectedKRId">
              <SelectTrigger>
                <SelectValue :placeholder="t('goal.weightSnapshotList.filterKR')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in krOptions"
                  :key="option.value ?? 'all'"
                  :value="option.value ?? '__all__'"
                >
                  {{ option.text }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="col-span-12 md:col-span-4">
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="option in triggerOptions"
                :key="option.value"
                :variant="selectedTriggers.includes(option.value) ? 'default' : 'outline'"
                class="cursor-pointer select-none"
                @click="toggleTriggerFilter(option.value)"
              >
                {{ option.title }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-primary" />
        </div>

        <!-- 空状态 -->
        <Alert v-else-if="!hasGoalSnapshots">
          <AlertDescription>{{ t('goal.weightSnapshotList.empty') }}</AlertDescription>
        </Alert>

        <!-- 快照列表 -->
        <div v-else>
          <div
            v-for="snapshot in filteredSnapshots"
            :key="snapshot.id"
            class="border-b border-border/50 transition-colors hover:bg-muted/50"
          >
            <div
              class="flex items-center gap-3 px-2 py-3 cursor-pointer"
              @click="toggleDetail(snapshot.id)"
            >
              <!-- Avatar -->
              <div
                class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center"
                :class="getWeightChangeAvatarClass(snapshot.weightDelta)"
              >
                <component
                  :is="getWeightChangeIconComponent(snapshot.weightDelta)"
                  class="h-4 w-4"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ getKRTitle(snapshot.keyResultId) }}</span>
                  <Badge :variant="getTriggerBadgeVariant(snapshot.trigger)" class="text-[10px]">
                    {{ getTriggerLabel(snapshot.trigger) }}
                  </Badge>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{{ formatTime(snapshot.snapshotTime) }}</span>
                  <Separator orientation="vertical" class="h-3" />
                  <span class="inline-flex items-center gap-1">
                    {{ snapshot.oldWeight }}%
                    <ArrowRight class="h-3 w-3" />
                    {{ snapshot.newWeight }}%
                  </span>
                  <Badge
                    :variant="
                      snapshot.weightDelta === 0
                        ? 'secondary'
                        : snapshot.weightDelta > 0
                          ? 'default'
                          : 'destructive'
                    "
                    class="text-[10px]"
                  >
                    {{ snapshot.weightDelta > 0 ? '+' : '' }}{{ snapshot.weightDelta }}%
                  </Badge>
                </div>
                <div v-if="snapshot.reason" class="text-xs text-muted-foreground mt-1">
                  {{ snapshot.reason }}
                </div>
              </div>

              <!-- Expand toggle -->
              <Button variant="ghost" size="icon-sm">
                <ChevronUp v-if="expandedItems.has(snapshot.id)" class="h-4 w-4" />
                <ChevronDown v-else class="h-4 w-4" />
              </Button>
            </div>

            <!-- 展开详情 -->
            <div
              v-show="expandedItems.has(snapshot.id)"
              class="mx-2 mb-3 p-3 bg-muted/50 rounded transition-all"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.weightSnapshotList.beforeWeight') }}
                  </div>
                  <div class="text-lg font-semibold">{{ snapshot.oldWeight }}%</div>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.weightSnapshotList.afterWeight') }}
                  </div>
                  <div class="text-lg font-semibold">{{ snapshot.newWeight }}%</div>
                </div>
                <div class="col-span-2">
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.weightSnapshotList.operator') }}
                  </div>
                  <div class="text-sm">{{ snapshot.operatorId }}</div>
                </div>
                <div v-if="snapshot.reason" class="col-span-2">
                  <div class="text-xs text-muted-foreground">
                    {{ t('goal.weightSnapshotList.reason') }}
                  </div>
                  <div class="text-sm">{{ snapshot.reason }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="hasGoalSnapshots && pagination && pagination.totalPages > 1"
          class="mt-4 flex items-center justify-center gap-2"
        >
          <Button variant="outline" size="sm" :disabled="currentPage <= 1" @click="currentPage--">
            {{ t('goal.weightSnapshotList.prevPage') }}
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ currentPage }} / {{ pagination.totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= pagination.totalPages"
            @click="currentPage++"
          >
            {{ t('goal.weightSnapshotList.nextPage') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWeightSnapshot } from '../../composables/useWeightSnapshot';
import { useGoal } from '../../composables/useGoal';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Alert,
  AlertDescription,
  Separator,
} from '@dailyuse/ui-vue-shadcn';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-vue-next';

const props = defineProps<{
  goalId: string;
}>();

const { goalSnapshots, pagination, isLoading, hasGoalSnapshots, fetchGoalSnapshots } =
  useWeightSnapshot();
const { goals } = useGoal();
const { t, locale } = useI18n();

const dateFnsLocaleMap: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// 筛选状态
const selectedKRId = ref<string | undefined>(undefined);
const selectedTriggers = ref<string[]>([]);
const selectedRange = ref<'all' | '7d' | '30d' | '90d'>('all');
const currentPage = ref(1);
const expandedItems = ref<Set<string>>(new Set());

// 时间范围选项
const timeRanges = computed(() => [
  { label: t('goal.weightSnapshotList.timeRangeAll'), value: 'all' as const },
  { label: t('goal.weightSnapshotList.timeRange7d'), value: '7d' as const },
  { label: t('goal.weightSnapshotList.timeRange30d'), value: '30d' as const },
  { label: t('goal.weightSnapshotList.timeRange90d'), value: '90d' as const },
]);

// 触发方式选项
const triggerOptions = computed(() => [
  { title: t('goal.weightSnapshotList.triggerManual'), value: 'manual' },
  { title: t('goal.weightSnapshotList.triggerAuto'), value: 'auto' },
  { title: t('goal.weightSnapshotList.triggerRestore'), value: 'restore' },
  { title: t('goal.weightSnapshotList.triggerImport'), value: 'import' },
]);

// KeyResult 选项
const krOptions = computed(() => {
  const goal = goals.value.find((g: any) => g.id === props.goalId);
  if (!goal || !goal.keyResults) return [{ text: t('goal.weightSnapshotList.allKR'), value: null }];

  return [
    { text: t('goal.weightSnapshotList.allKR'), value: null },
    ...goal.keyResults.map((kr: any) => ({
      text: kr.title,
      value: kr.id,
    })),
  ];
});

// 筛选后的快照
const filteredSnapshots = computed(() => {
  let filtered = goalSnapshots.value;

  // 按 KR 筛选
  if (selectedKRId.value) {
    filtered = filtered.filter((s: any) => s.keyResultId === selectedKRId.value);
  }

  // 按触发方式筛选
  if (selectedTriggers.value.length > 0) {
    filtered = filtered.filter((s: any) => selectedTriggers.value.includes(s.trigger));
  }

  // 按时间范围筛选
  if (selectedRange.value !== 'all') {
    const now = Date.now();
    const days = selectedRange.value === '7d' ? 7 : selectedRange.value === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((s: any) => s.snapshotTime >= cutoff);
  }

  return filtered;
});

// 获取 KR 标题
const getKRTitle = (krId: string) => {
  const goal = goals.value.find((g: any) => g.id === props.goalId);
  const kr = goal?.keyResults?.find((k: any) => k.id === krId);
  return kr?.title || 'Unknown KR';
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm', {
    locale: dateFnsLocaleMap[locale.value] || zhCN,
  });
};

// 获取权重变化 avatar 的 Tailwind 类
const getWeightChangeAvatarClass = (delta: number) => {
  if (delta > 0) return 'bg-success/15 text-success dark:bg-green-900 dark:text-success';
  if (delta < 0) return 'bg-destructive/15 text-destructive dark:bg-red-900 dark:text-destructive';
  return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
};

// 获取权重变化图标组件
const getWeightChangeIconComponent = (delta: number) => {
  if (delta > 0) return ArrowUp;
  if (delta < 0) return ArrowDown;
  return Minus;
};

// 获取触发方式标签
const getTriggerLabel = (trigger: string) => {
  const labels: Record<string, string> = {
    manual: t('goal.weightSnapshotList.triggerLabelManual'),
    auto: t('goal.weightSnapshotList.triggerLabelAuto'),
    restore: t('goal.weightSnapshotList.triggerLabelRestore'),
    import: t('goal.weightSnapshotList.triggerLabelImport'),
  };
  return labels[trigger] || trigger;
};

// 获取触发方式 Badge variant
const getTriggerBadgeVariant = (
  trigger: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    manual: 'default',
    auto: 'secondary',
    restore: 'outline',
    import: 'secondary',
  };
  return variants[trigger] || 'outline';
};

// 切换触发方式筛选
const toggleTriggerFilter = (value: string) => {
  const index = selectedTriggers.value.indexOf(value);
  if (index === -1) {
    selectedTriggers.value = [...selectedTriggers.value, value];
  } else {
    selectedTriggers.value = selectedTriggers.value.filter((v) => v !== value);
  }
};

// 切换详情展开/收起
const toggleDetail = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

// 加载快照
const loadSnapshots = async () => {
  await fetchGoalSnapshots(props.goalId, currentPage.value, 20);
};

// 监听分页变化
watch(currentPage, () => {
  loadSnapshots();
});

// 初始加载
onMounted(() => {
  loadSnapshots();
});
</script>
