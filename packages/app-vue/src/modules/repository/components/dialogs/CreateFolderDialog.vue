<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('repository.createFolder.title') }}</DialogTitle>
        <DialogDescription>
          {{
            parentName
              ? t('repository.createFolder.descriptionInParent', { name: parentName })
              : t('repository.createFolder.description')
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Folder Name -->
        <div class="space-y-2">
          <Label for="folder-name">{{ t('repository.createFolder.labelName') }}</Label>
          <Input
            id="folder-name"
            v-model="localName"
            :placeholder="t('repository.createFolder.placeholderName')"
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- Folder Icon (optional) -->
        <div class="space-y-2">
          <Label for="folder-icon">{{ t('repository.createFolder.labelIcon') }}</Label>
          <Input id="folder-icon" v-model="localIcon" placeholder="mdi-folder" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          {{ t('repository.createFolder.btnCancel') }}
        </Button>
        <Button :disabled="!localName.trim() || loading" @click="handleSubmit">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('repository.createFolder.btnCreate') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loader2 } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    open: boolean;
    name?: string;
    icon?: string;
    parentId?: string;
    parentName?: string;
    loading?: boolean;
  }>(),
  {
    name: '',
    icon: '',
    parentId: '',
    parentName: '',
    loading: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  create: [data: { name: string; icon?: string; parentId?: string }];
}>();

const localName = ref('');
const localIcon = ref('');

const { t } = useI18n();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localName.value = props.name || '';
      localIcon.value = props.icon || '';
    }
  },
);

function handleSubmit() {
  if (!localName.value.trim()) return;

  emit('create', {
    name: localName.value.trim(),
    icon: localIcon.value || undefined,
    parentId: props.parentId || undefined,
  });
}
</script>
