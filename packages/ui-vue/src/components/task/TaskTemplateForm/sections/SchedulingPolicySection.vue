<!-- widgets/SchedulingPolicySection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-calendar-clock</v-icon>
      调度策略
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            任务模板的时间配置和重复规则请在"时间配置"部分设置。这里只配置标签信息。
          </v-alert>
        </v-col>

        <v-col cols="12">
          <v-combobox v-model="tags" :items="[]" label="标签" variant="outlined" multiple chips clearable
            prepend-inner-icon="mdi-tag-multiple" hint="按回车键添加新标签" />
        </v-col>
      </v-row>

      <!-- 策略说明 -->
      <v-row>
        <v-col cols="12">
          <v-alert type="info" density="compact" variant="tonal">
            <v-icon start>mdi-information-outline</v-icon>
            调度模式决定任务实例的生成频率。标签和地点信息将应用于所有生成的任务实例。
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskTemplate } from '@dailyuse/task/domain-client';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const tags = computed({
  get: () => props.modelValue.tags || [],
  set: (value: string[]) => {
    updateTemplate((template) => {
      template.updateTags(value);
    });
  },
});
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
