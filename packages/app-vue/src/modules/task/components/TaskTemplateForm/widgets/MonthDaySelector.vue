<!-- widgets/MonthDaySelector.vue -->
<template>
  <div class="w-full">
    <Label class="mb-2 block">{{ t('task.monthDay.title') }}</Label>
    <div class="flex flex-wrap gap-1">
      <Badge
        v-for="day in monthDayOptions"
        :key="day"
        :variant="localSelected.includes(day) ? 'default' : 'outline'"
        class="cursor-pointer select-none"
        @click="toggleDay(day)"
      >
        {{ day }}
      </Badge>
    </div>

    <div class="mt-2 flex flex-wrap gap-1">
      <Button size="sm" variant="ghost" @click="selectFirstHalf">
        {{ t('task.monthDay.firstHalf') }}
      </Button>

      <Button size="sm" variant="ghost" @click="selectSecondHalf">
        {{ t('task.monthDay.secondHalf') }}
      </Button>

      <Button size="sm" variant="ghost" @click="selectOddDays">
        {{ t('task.monthDay.oddDays') }}
      </Button>

      <Button size="sm" variant="ghost" @click="selectEvenDays">
        {{ t('task.monthDay.evenDays') }}
      </Button>

      <Button size="sm" variant="ghost" @click="selectAll">
        {{ t('task.monthDay.selectAll') }}
      </Button>

      <Button size="sm" variant="ghost" @click="clearAll"> {{ t('task.monthDay.clear') }} </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Badge, Button, Label } from '@dailyuse/ui-vue-shadcn';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const toggleDay = (day: number) => {
  const current = localSelected.value;
  if (current.includes(day)) {
    localSelected.value = current.filter((d) => d !== day);
  } else {
    localSelected.value = [...current, day];
  }
};

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
