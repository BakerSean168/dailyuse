<!-- widgets/SchedulingPolicySection.vue -->
<template>
  <Card class="mb-4 border">
    <CardHeader class="pb-2">
      <CardTitle class="text-primary font-semibold flex items-center">
        <Clock class="h-5 w-5 mr-2" />
        {{ t('task.schedulingPolicy.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              {{ t('task.schedulingPolicy.alertDescription') }}
            </AlertDescription>
          </Alert>
        </div>

        <div class="col-span-12">
          <Label>{{ t('task.schedulingPolicy.label') }}</Label>
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
              :placeholder="t('task.schedulingPolicy.tagPlaceholder')"
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
              {{ t('task.schedulingPolicy.alertMessage') }}
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
} from '@memoflow/ui-vue-shadcn';
import { Clock, Info, X } from '@lucide/vue';
import type { TaskTemplateViewModel } from '../../types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplateViewModel];
}>();

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
