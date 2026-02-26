<!-- widgets/SchedulingPolicySection.vue -->
<template>
  <Card class="mb-4 border">
    <CardHeader class="pb-2">
      <CardTitle class="text-primary font-semibold flex items-center">
        <Clock class="h-5 w-5 mr-2" />
        调度策略
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              任务模板的时间配置和重复规则请在"时间配置"部分设置。这里只配置标签信息。
            </AlertDescription>
          </Alert>
        </div>

        <div class="col-span-12">
          <Label>标签</Label>
          <div class="flex flex-wrap gap-2 mt-1">
            <Badge
              v-for="(tag, index) in tags"
              :key="index"
              variant="secondary"
              class="flex items-center gap-1"
            >
              {{ tag }}
              <button class="ml-1 hover:text-destructive" @click="removeTag(index)">
                <X class="h-3 w-3" />
              </button>
            </Badge>
            <Input
              v-model="newTag"
              placeholder="按回车键添加新标签"
              class="w-40"
              @keydown.enter.prevent="addTag"
            />
          </div>
        </div>
      </div>

      <!-- 策略说明 -->
      <div class="grid grid-cols-12 gap-4 mt-4">
        <div class="col-span-12">
          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              调度模式决定任务实例的生成频率。标签和地点信息将应用于所有生成的任务实例。
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Badge,
  Input,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import { Clock, Info, X } from 'lucide-vue-next';
import type { TaskTemplateViewModel } from '../../types';

interface Props {
  modelValue: TaskTemplateViewModel;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const newTag = ref('');

const updateTemplate = (updater: (template: TaskTemplateViewModel) => void) => {
  const updatedTemplate: TaskTemplateViewModel = {
    ...props.modelValue,
    tags: [...(props.modelValue.tags || [])],
    timeConfig: { ...(props.modelValue.timeConfig || {}) },
  };
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const tags = computed({
  get: () => props.modelValue.tags || [],
  set: (value: string[]) => {
    updateTemplate((template) => {
      template.tags = value;
    });
  },
});

const addTag = () => {
  const trimmed = newTag.value.trim();
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value = [...tags.value, trimmed];
  }
  newTag.value = '';
};

const removeTag = (index: number) => {
  const updated = [...tags.value];
  updated.splice(index, 1);
  tags.value = updated;
};
</script>
