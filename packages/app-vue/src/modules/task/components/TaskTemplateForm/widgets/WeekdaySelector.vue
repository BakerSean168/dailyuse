<!-- widgets/WeekdaySelector.vue -->
<template>
  <div class="weekday-selector">
    <v-label class="mb-2">选择星期</v-label>
    <v-chip-group v-model="localSelected" multiple variant="outlined" selected-class="text-primary">
      <v-chip
        v-for="(day, index) in weekdayOptions"
        :key="index"
        :value="index"
        filter
        variant="outlined"
      >
        {{ day }}
      </v-chip>
    </v-chip-group>

    <div class="mt-2">
      <v-btn size="small" variant="text" @click="selectWorkdays"> 工作日 </v-btn>

      <v-btn size="small" variant="text" @click="selectWeekends"> 周末 </v-btn>

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

const weekdayOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 快捷选择方法
const selectWorkdays = () => {
  localSelected.value = [1, 2, 3, 4, 5]; // 周一到周五
};

const selectWeekends = () => {
  localSelected.value = [0, 6]; // 周日和周六
};

const selectAll = () => {
  localSelected.value = [0, 1, 2, 3, 4, 5, 6];
};

const clearAll = () => {
  localSelected.value = [];
};
</script>

<style scoped>
.weekday-selector {
  width: 100%;
}
</style>
