<template>
  <Dialog :open="modelValue" @update:open="setVisible">
    <DialogContent class="max-w-[420px] p-0" data-testid="quick-task-dialog">
      <form @submit.prevent="handleSave">
        <DialogHeader class="p-5 pb-3">
          <DialogTitle class="flex items-center gap-2 text-base">
            <Zap class="h-5 w-5 text-warning" />
            {{ t('task.quickTask.title') }}
          </DialogTitle>
          <DialogDescription>{{ t('task.quickTask.subtitle') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-2 px-5 py-3">
          <Label for="quick-task-title">{{ t('task.quickTask.name') }}</Label>
          <Input
            id="quick-task-title"
            v-model="title"
            data-testid="quick-task-title-input"
            :placeholder="t('task.quickTask.placeholder')"
            :disabled="saving"
            maxlength="200"
            autofocus
          />
          <p class="text-xs text-muted-foreground">{{ t('task.quickTask.todayAllDay') }}</p>
        </div>

        <DialogFooter class="border-t p-5 pt-4">
          <Button type="button" variant="ghost" :disabled="saving" @click="handleCancel">
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            :disabled="title.trim().length === 0 || saving"
            :loading="saving"
            data-testid="quick-task-save-button"
          >
            {{ t('task.quickTask.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Zap } from '@lucide/vue';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@memoflow/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    saving?: boolean;
  }>(),
  { saving: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: { title: string }];
  cancel: [];
}>();

const { t } = useI18n();
const title = ref('');

watch(
  () => props.modelValue,
  (open, wasOpen) => {
    if (open && !wasOpen) {
      title.value = '';
    }
  },
  { immediate: true },
);

function setVisible(value: boolean): void {
  if (!value) {
    handleCancel();
  }
}

function handleCancel(): void {
  title.value = '';
  emit('cancel');
  emit('update:modelValue', false);
}

function handleSave(): void {
  const normalizedTitle = title.value.trim();
  if (!normalizedTitle || props.saving) {
    return;
  }
  emit('save', { title: normalizedTitle });
}
</script>
