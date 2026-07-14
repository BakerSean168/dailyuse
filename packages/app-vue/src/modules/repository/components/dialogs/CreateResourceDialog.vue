<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('repository.createResource.title') }}</DialogTitle>
        <DialogDescription> {{ t('repository.createResource.description') }} </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Resource Name -->
        <div class="space-y-2">
          <Label for="resource-name">{{ t('repository.createResource.labelName') }}</Label>
          <Input
            id="resource-name"
            v-model="localName"
            :placeholder="t('repository.createResource.placeholderName')"
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- Resource Type -->
        <div class="space-y-2">
          <Label for="resource-type">{{ t('repository.createResource.labelType') }}</Label>
          <Select v-model="localType">
            <SelectTrigger id="resource-type">
              <SelectValue :placeholder="t('repository.createResource.placeholderType')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARKDOWN">
                <div class="flex items-center gap-2">
                  <FileText class="h-4 w-4" />
                  {{ t('repository.createResource.typeMarkdown') }}
                </div>
              </SelectItem>
              <SelectItem value="IMAGE">
                <div class="flex items-center gap-2">
                  <Image class="h-4 w-4" />
                  {{ t('repository.createResource.typeImage') }}
                </div>
              </SelectItem>
              <SelectItem value="VIDEO">
                <div class="flex items-center gap-2">
                  <Video class="h-4 w-4" />
                  {{ t('repository.createResource.typeVideo') }}
                </div>
              </SelectItem>
              <SelectItem value="AUDIO">
                <div class="flex items-center gap-2">
                  <Music class="h-4 w-4" />
                  {{ t('repository.createResource.typeAudio') }}
                </div>
              </SelectItem>
              <SelectItem value="LINK">
                <div class="flex items-center gap-2">
                  <Link class="h-4 w-4" />
                  {{ t('repository.createResource.typeLink') }}
                </div>
              </SelectItem>
              <SelectItem value="OTHER">
                <div class="flex items-center gap-2">
                  <File class="h-4 w-4" />
                  {{ t('repository.createResource.typeOther') }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Folder Selection (optional) -->
        <div v-if="showFolderSelection" class="space-y-2">
          <Label for="folder">{{ t('repository.createResource.labelFolder') }}</Label>
          <Input
            id="folder"
            v-model="localFolderId"
            :placeholder="t('repository.createResource.placeholderFolder')"
            readonly
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          {{ t('repository.createResource.btnCancel') }}
        </Button>
        <Button :disabled="!localName.trim() || loading" @click="handleSubmit">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('repository.createResource.btnCreate') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileText, Image, Video, Music, Link, File, Loader2 } from '@lucide/vue';
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

const props = withDefaults(
  defineProps<{
    open: boolean;
    name?: string;
    type?: string;
    folderId?: string;
    loading?: boolean;
    showFolderSelection?: boolean;
  }>(),
  {
    name: '',
    type: 'MARKDOWN',
    folderId: '',
    loading: false,
    showFolderSelection: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  create: [data: { name: string; type: string; folderId?: string }];
}>();

const localName = ref('');
const localType = ref('MARKDOWN');
const localFolderId = ref('');

const { t } = useI18n();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localName.value = props.name || '';
      localType.value = props.type || 'MARKDOWN';
      localFolderId.value = props.folderId || '';
    }
  },
);

function handleSubmit() {
  if (!localName.value.trim()) return;

  emit('create', {
    name: localName.value.trim(),
    type: localType.value,
    folderId: localFolderId.value || undefined,
  });
}
</script>
