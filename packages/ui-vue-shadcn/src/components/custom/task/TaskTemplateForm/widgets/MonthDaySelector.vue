<!-- widgets/MonthDaySelector.vue -->
<template>
  <div class="month-day-selector">
    <v-label class="mb-2">选择日期</v-label>
    <v-chip-group
      v-model="localSelected"
      multiple
      variant="outlined"
      selected-class="text-primary"
      class="flex-wrap"
    >
      <v-chip
        v-for="day in monthDayOptions"
        :key="day"
        :value="day"
        filter
        variant="outlined"
        size="small"
      >
        {{ day }}
      </v-chip>
    </v-chip-group>

    <div class="mt-2">
      <v-btn size="small" variant="text" @click="selectFirstHalf"> 前半月 </v-btn>

      <v-btn size="small" variant="text" @click="selectSecondHalf"> 后半月 </v-btn>

      <v-btn size="small" variant="text" @click="selectOddDays"> 奇数日 </v-btn>

      <v-btn size="small" variant="text" @click="selectEvenDays"> 偶数日 </v-btn>

      <v-btn size="small" variant="text" @click="selectAll"> 全选 </v-btn>

      <v-btn size="small" variant="text" @click="clearAll"> 清空 </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: number[];
}

interface Emits {
  (e: 'update:modelValue', value: number[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSelected = computed({
  get: () => props.modelValue || [],
  set: (value: number[]) => emit('update:modelValue', value),
});

// 生成1-31的日期选项
const monthDayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

// 快捷选择方法
const selectFirstHalf = () => {
  localSelected.value = Array.from({ length: 15 }, (_, i) => i + 1); // 1-15
};

const selectSecondHalf = () => {
  localSelected.value = Array.from({ length: 16 }, (_, i) => i + 16); // 16-31
};

const selectOddDays = () => {
  localSelected.value = Array.from({ length: 16 }, (_, i) => i * 2 + 1); // 1,3,5,...,31
};

const selectEvenDays = () => {
  localSelected.value = Array.from({ length: 15 }, (_, i) => (i + 1) * 2); // 2,4,6,...,30
};

const selectAll = () => {
  localSelected.value = [...monthDayOptions];
};

const clearAll = () => {
  localSelected.value = [];
};
</script>

<style scoped>
.month-day-selector {
  width: 100%;
}

.flex-wrap {
  flex-wrap: wrap;
  gap: 4px;
}

.v-chip-group {
  width: 100%;
}
</style>
