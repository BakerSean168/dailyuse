<template>
  <div class="weight-snapshot-list">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>权重变更历史</span>
        <v-btn-group density="compact">
          <v-btn
            v-for="range in timeRanges"
            :key="range.value"
            :variant="selectedRange === range.value ? 'flat' : 'text'"
            :color="selectedRange === range.value ? 'primary' : undefined"
            size="small"
            @click="selectedRange = range.value"
          >
            {{ range.label }}
          </v-btn>
        </v-btn-group>
      </v-card-title>

      <v-card-text>
        <!-- 筛选器 -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedKRUuid"
              :items="krOptions"
              item-title="text"
              item-value="value"
              label="筛选 KeyResult"
              clearable
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedTriggers"
              :items="triggerOptions"
              label="触发方式"
              multiple
              chips
              clearable
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- 加载状态 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" />

        <!-- 空状态 -->
        <v-alert v-else-if="!hasGoalSnapshots" type="info" variant="tonal"> 暂无权重变更记录 </v-alert>

        <!-- 快照列表 -->
        <v-list v-else>
          <v-list-item
            v-for="snapshot in filteredSnapshots"
            :key="snapshot.uuid"
            class="snapshot-item"
            @click="toggleDetail(snapshot.uuid)"
          >
            <template #prepend>
              <v-avatar :color="getWeightChangeColor(snapshot.weightDelta)" size="40">
                <v-icon>{{ getWeightChangeIcon(snapshot.weightDelta) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>
              <span class="font-weight-medium">{{ getKRTitle(snapshot.keyResultUuid) }}</span>
              <v-chip size="x-small" :color="getTriggerColor(snapshot.trigger)" class="ml-2">
                {{ getTriggerLabel(snapshot.trigger) }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              <div class="d-flex align-center ga-2">
                <span>{{ formatTime(snapshot.snapshotTime) }}</span>
                <v-divider vertical />
                <span class="weight-change">
                  {{ snapshot.oldWeight }}%
                  <v-icon size="x-small">mdi-arrow-right</v-icon>
                  {{ snapshot.newWeight }}%
                </span>
                <v-chip
                  size="x-small"
                  :color="getWeightChangeColor(snapshot.weightDelta)"
                  variant="tonal"
                >
                  {{ snapshot.weightDelta > 0 ? '+' : '' }}{{ snapshot.weightDelta }}%
                </v-chip>
              </div>
              <div v-if="snapshot.reason" class="text-caption mt-1">
                {{ snapshot.reason }}
              </div>
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                :icon="expandedItems.has(snapshot.uuid) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                variant="text"
                size="small"
              />
            </template>

            <!-- 展开详情 -->
            <v-expand-transition>
              <div v-if="expandedItems.has(snapshot.uuid)" class="detail-panel mt-3 pa-3">
                <v-row>
                  <v-col cols="6">
                    <div class="text-caption text-medium-emphasis">调整前权重</div>
                    <div class="text-h6">{{ snapshot.oldWeight }}%</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption text-medium-emphasis">调整后权重</div>
                    <div class="text-h6">{{ snapshot.newWeight }}%</div>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-caption text-medium-emphasis">操作人</div>
                    <div>{{ snapshot.operatorUuid }}</div>
                  </v-col>
                  <v-col v-if="snapshot.reason" cols="12">
                    <div class="text-caption text-medium-emphasis">调整原因</div>
                    <div>{{ snapshot.reason }}</div>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </v-list-item>

          <v-divider />
        </v-list>

        <!-- 分页 -->
        <v-pagination
          v-if="hasGoalSnapshots && pagination && pagination.totalPages > 1"
          v-model="currentPage"
          :length="pagination.totalPages"
          class="mt-4"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useWeightSnapshot } from '../../../application/composables/useWeightSnapshot';
import { useGoal } from '../../composables/useGoal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const props = defineProps<{
  goalUuid: string;
}>();

const {
  goalSnapshots,
  pagination,
  isLoading,
  hasGoalSnapshots,
  fetchGoalSnapshots,
} = useWeightSnapshot();
const { goals } = useGoal();

// 筛选状态
const selectedKRUuid = ref<string | null>(null);
const selectedTriggers = ref<string[]>([]);
const selectedRange = ref<'all' | '7d' | '30d' | '90d'>('all');
const currentPage = ref(1);
const expandedItems = ref<Set<string>>(new Set());

// 时间范围选项
const timeRanges: Array<{ label: string; value: 'all' | '7d' | '30d' | '90d' }> = [
  { label: '全部', value: 'all' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
];

// 触发方式选项
const triggerOptions = [
  { title: '手动调整', value: 'manual' },
  { title: '自动调整', value: 'auto' },
  { title: '恢复快照', value: 'restore' },
  { title: '批量导入', value: 'import' },
];

// KeyResult 选项
const krOptions = computed(() => {
  const goal = goals.value.find((g: any) => g.uuid === props.goalUuid);
  if (!goal || !goal.keyResults) return [{ text: '全部', value: null }];

  return [
    { text: '全部', value: null },
    ...goal.keyResults.map((kr: any) => ({
      text: kr.title,
      value: kr.uuid,
    })),
  ];
});

// 筛选后的快照
const filteredSnapshots = computed(() => {
  let filtered = goalSnapshots.value;

  // 按 KR 筛选
  if (selectedKRUuid.value) {
    filtered = filtered.filter((s: any) => s.keyResultUuid === selectedKRUuid.value);
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
const getKRTitle = (krUuid: string) => {
  const goal = goals.value.find((g: any) => g.uuid === props.goalUuid);
  const kr = goal?.keyResults?.find((k: any) => k.uuid === krUuid);
  return kr?.title || 'Unknown KR';
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

// 获取权重变化颜色
const getWeightChangeColor = (delta: number) => {
  if (delta > 0) return 'success';
  if (delta < 0) return 'error';
  return 'grey';
};

// 获取权重变化图标
const getWeightChangeIcon = (delta: number) => {
  if (delta > 0) return 'mdi-arrow-up';
  if (delta < 0) return 'mdi-arrow-down';
  return 'mdi-minus';
};

// 获取触发方式标签
const getTriggerLabel = (trigger: string) => {
  const labels: Record<string, string> = {
    manual: '手动',
    auto: '自动',
    restore: '恢复',
    import: '导入',
  };
  return labels[trigger] || trigger;
};

// 获取触发方式颜色
const getTriggerColor = (trigger: string) => {
  const colors: Record<string, string> = {
    manual: 'primary',
    auto: 'info',
    restore: 'warning',
    import: 'secondary',
  };
  return colors[trigger] || 'default';
};

// 切换详情展开/收起
const toggleDetail = (uuid: string) => {
  if (expandedItems.value.has(uuid)) {
    expandedItems.value.delete(uuid);
  } else {
    expandedItems.value.add(uuid);
  }
};

// 加载快照
const loadSnapshots = async () => {
  await fetchGoalSnapshots(props.goalUuid, currentPage.value, 20);
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

<style scoped>
.weight-snapshot-list {
  width: 100%;
}

.snapshot-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.snapshot-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.weight-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-panel {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}
</style>
