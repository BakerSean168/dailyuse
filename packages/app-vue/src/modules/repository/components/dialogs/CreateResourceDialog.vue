<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>创建资源</DialogTitle>
        <DialogDescription>
          创建一个新的资源文件
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Resource Name -->
        <div class="space-y-2">
          <Label for="resource-name">资源名称</Label>
          <Input
            id="resource-name"
            v-model="localName"
            placeholder="输入资源名称..."
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- Resource Type -->
        <div class="space-y-2">
          <Label for="resource-type">资源类型</Label>
          <Select v-model="localType">
            <SelectTrigger id="resource-type">
              <SelectValue placeholder="选择资源类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARKDOWN">
                <div class="flex items-center gap-2">
                  <FileText class="h-4 w-4" />
                  Markdown 笔记
                </div>
              </SelectItem>
              <SelectItem value="IMAGE">
                <div class="flex items-center gap-2">
                  <Image class="h-4 w-4" />
                  图片
                </div>
              </SelectItem>
              <SelectItem value="VIDEO">
                <div class="flex items-center gap-2">
                  <Video class="h-4 w-4" />
                  视频
                </div>
              </SelectItem>
              <SelectItem value="AUDIO">
                <div class="flex items-center gap-2">
                  <Music class="h-4 w-4" />
                  音频
                </div>
              </SelectItem>
              <SelectItem value="LINK">
                <div class="flex items-center gap-2">
                  <Link class="h-4 w-4" />
                  链接
                </div>
              </SelectItem>
              <SelectItem value="OTHER">
                <div class="flex items-center gap-2">
                  <File class="h-4 w-4" />
                  其他
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Folder Selection (optional) -->
        <div v-if="showFolderSelection" class="space-y-2">
          <Label for="folder">目标文件夹（可选）</Label>
          <Input
            id="folder"
            v-model="localFolderId"
            placeholder="选择目标文件夹..."
            readonly
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
import { FileText, Image, Video, Music, Link, File, Loader2 } from 'lucide-vue-next';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';

interface Props {
  open: boolean;
  name?: string;
  type?: string;
  folderId?: string;
  loading?: boolean;
  showFolderSelection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  type: 'MARKDOWN',
  folderId: '',
  loading: false,
  showFolderSelection: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  create: [data: { name: string; type: string; folderId?: string }];
}>();

const localName = ref('');
const localType = ref('MARKDOWN');
const localFolderId = ref('');

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localName.value = props.name || '';
    localType.value = props.type || 'MARKDOWN';
    localFolderId.value = props.folderId || '';
  }
});

function handleSubmit() {
  if (!localName.value.trim()) return;
  
  emit('create', {
    name: localName.value.trim(),
    type: localType.value,
    folderId: localFolderId.value || undefined,
  });
}
</script>
