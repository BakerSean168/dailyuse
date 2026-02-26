<!-- widgets/WeekdaySelector.vue -->
<template>
  <div class="w-full">
    <Label class="mb-2 block">选择星期</Label>
    <div class="flex flex-wrap gap-1">
      <Badge
        v-for="(day, index) in weekdayOptions"
        :key="index"
        :variant="localSelected.includes(index) ? 'default' : 'outline'"
        class="cursor-pointer select-none"
        @click="toggleDay(index)"
      >
        {{ day }}
      </Badge>
    </div>

    <div class="mt-2 flex flex-wrap gap-1">
      <Button size="sm" variant="ghost" @click="selectWorkdays"> 工作日 </Button>

      <Button size="sm" variant="ghost" @click="selectWeekends"> 周末 </Button>

      <Button size="sm" variant="ghost" @click="selectAll"> 全选 </Button>

      <Button size="sm" variant="ghost" @click="clearAll"> 清空 </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Badge, Button, Label } from '@dailyuse/ui-vue-shadcn';

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

const toggleDay = (index: number) => {
  const current = localSelected.value;
  if (current.includes(index)) {
    localSelected.value = current.filter((d) => d !== index);
  } else {
    localSelected.value = [...current, index];
  }
};

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
