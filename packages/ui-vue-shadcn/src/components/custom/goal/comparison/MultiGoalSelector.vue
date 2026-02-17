<!--
  MultiGoalSelector.vue
  多目标选择器组件 - 用于选择 2-4 个目标进行对比分析
-->

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-compare</v-icon>
      选择对比目标 ({{ selectedGoals.length }}/{{ maxGoals }})
    </v-card-title>

    <v-card-text>
      <!-- 已选目标列表 -->
      <div v-if="selectedGoals.length > 0" class="mb-4">
        <v-chip
          v-for="goal in selectedGoals"
          :key="goal.uuid"
          class="mr-2 mb-2"
          closable
          :color="getGoalColor(goal)"
          @click:close="removeGoal(goal.uuid)"
        >
          <v-icon start>mdi-target</v-icon>
          {{ goal.title }}
        </v-chip>
      </div>

      <!-- 提示信息 -->
      <v-alert
        v-if="selectedGoals.length < minGoals"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        请至少选择 {{ minGoals }} 个目标开始对比
      </v-alert>

      <v-alert
        v-else-if="selectedGoals.length >= maxGoals"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        已达到最大对比数量 ({{ maxGoals }} 个)
      </v-alert>

      <!-- 目标选择列表 -->
      <v-autocomplete
        v-model="searchQuery"
        :items="availableGoals"
        item-title="title"
        item-value="uuid"
        label="搜索并添加目标"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        :disabled="selectedGoals.length >= maxGoals"
        @update:model-value="addGoal"
      >
        <template #item="{ props, item }">
          <v-list-item
            v-bind="props"
            :disabled="isGoalSelected(item.raw.uuid)"
            :prepend-icon="getStatusIcon(item.raw)"
          >
            <template #append>
              <v-chip size="small" :color="getStatusColor(item.raw)">
                {{ getStatusText(item.raw) }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>

      <!-- 快速筛选 -->
      <div class="mt-4">
        <v-chip-group v-model="selectedFilter" column>
          <v-chip
            filter
            variant="outlined"
            prepend-icon="mdi-clock-outline"
            @click="filterByActive"
          >
            进行中
          </v-chip>
          <v-chip
            filter
            variant="outlined"
            prepend-icon="mdi-check-circle"
            @click="filterByCompleted"
          >
            已完成
          </v-chip>
          <v-chip filter variant="outlined" prepend-icon="mdi-star" @click="filterByImportant">
            重要目标
          </v-chip>
        </v-chip-group>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="clearSelection"> 清空选择 </v-btn>
      <v-btn color="primary" :disabled="!canStartComparison" @click="startComparison">
        <v-icon start>mdi-eye</v-icon>
        开始对比
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGoalStore } from '../../stores/goalStore';

// Props
interface Props {
  minGoals?: number;
  maxGoals?: number;
}

const props = withDefaults(defineProps<Props>(), {
  minGoals: 2,
  maxGoals: 4,
});

// Emits
const emit = defineEmits<{
  compare: [goals: any[]];
  'update:selection': [goals: any[]];
}>();

// Store
const goalStore = useGoalStore();

// State
const selectedGoals = ref<any[]>([]);
const searchQuery = ref<string | null>(null);
const selectedFilter = ref<number | null>(null);

// Computed
const availableGoals = computed(() => {
  return goalStore.getAllGoals.filter((goal: any) => {
    // 过滤掉已删除的目标
    if (goal.deletedAt) return false;

    // 应用筛选条件
    if (selectedFilter.value === 0) {
      // 进行中
      return goal.status === 'IN_PROGRESS';
    } else if (selectedFilter.value === 1) {
      // 已完成
      return goal.status === 'COMPLETED';
    } else if (selectedFilter.value === 2) {
      // 重要目标
      return goal.importance === 'HIGH' || goal.importance === 'CRITICAL';
    }

    return true;
  });
});

const canStartComparison = computed(() => {
  return selectedGoals.value.length >= props.minGoals;
});

// Methods
const addGoal = (goalUuid: string | null) => {
  if (!goalUuid) return;

  const goal = goalStore.getGoalByUuid(goalUuid);
  if (!goal || isGoalSelected(goalUuid)) return;

  if (selectedGoals.value.length >= props.maxGoals) {
    return;
  }

  selectedGoals.value.push(goal);
  searchQuery.value = null;

  emit('update:selection', selectedGoals.value);
};

const removeGoal = (goalUuid: string) => {
  const index = selectedGoals.value.findIndex((g) => g.uuid === goalUuid);
  if (index !== -1) {
    selectedGoals.value.splice(index, 1);
    emit('update:selection', selectedGoals.value);
  }
};

const isGoalSelected = (goalUuid: string): boolean => {
  return selectedGoals.value.some((g) => g.uuid === goalUuid);
};

const clearSelection = () => {
  selectedGoals.value = [];
  emit('update:selection', selectedGoals.value);
};

const startComparison = () => {
  if (canStartComparison.value) {
    emit('compare', selectedGoals.value);
  }
};

const filterByActive = () => {
  selectedFilter.value = selectedFilter.value === 0 ? null : 0;
};

const filterByCompleted = () => {
  selectedFilter.value = selectedFilter.value === 1 ? null : 1;
};

const filterByImportant = () => {
  selectedFilter.value = selectedFilter.value === 2 ? null : 2;
};

// UI Helpers
const getGoalColor = (goal: any): string => {
  return goal.color || 'primary';
};

const getStatusIcon = (goal: any): string => {
  const iconMap: Record<string, string> = {
    NOT_STARTED: 'mdi-circle-outline',
    IN_PROGRESS: 'mdi-clock-outline',
    COMPLETED: 'mdi-check-circle',
    ARCHIVED: 'mdi-archive',
  };
  return iconMap[goal.status] || 'mdi-target';
};

const getStatusColor = (goal: any): string => {
  const colorMap: Record<string, string> = {
    NOT_STARTED: 'grey',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    ARCHIVED: 'warning',
  };
  return colorMap[goal.status] || 'default';
};

const getStatusText = (goal: any): string => {
  const textMap: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    ARCHIVED: '已归档',
  };
  return textMap[goal.status] || goal.status;
};

// Expose methods for parent components
defineExpose({
  selectedGoals,
  clearSelection,
});
</script>

<style scoped>
.v-chip {
  font-size: 0.875rem;
}
</style>
