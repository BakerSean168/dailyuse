<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>创建文件夹</DialogTitle>
        <DialogDescription>
          {{ parentName ? `在 "${parentName}" 中创建新文件夹` : '创建一个新文件夹' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Folder Name -->
        <div class="space-y-2">
          <Label for="folder-name">文件夹名称</Label>
          <Input
            id="folder-name"
            v-model="localName"
            placeholder="输入文件夹名称..."
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- Folder Icon (optional) -->
        <div class="space-y-2">
          <Label for="folder-icon">图标（可选）</Label>
          <Input
            id="folder-icon"
            v-model="localIcon"
            placeholder="mdi-folder"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          取消
        </Button>
        <Button :disabled="!localName.trim() || loading" @click="handleSubmit">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          创建
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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

interface Props {
  open: boolean;
  name?: string;
  icon?: string;
  parentId?: string;
  parentName?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  icon: '',
  parentId: '',
  parentName: '',
  loading: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  create: [data: { name: string; icon?: string; parentId?: string }];
}>();

const localName = ref('');
const localIcon = ref('');

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localName.value = props.name || '';
    localIcon.value = props.icon || '';
  }
});

function handleSubmit() {
  if (!localName.value.trim()) return;
  
  emit('create', {
    name: localName.value.trim(),
    icon: localIcon.value || undefined,
    parentId: props.parentId || undefined,
  });
}
</script>
