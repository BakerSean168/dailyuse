<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t('editor.resourcePicker.title') }}</DialogTitle>
        <DialogDescription>{{ t('editor.resourcePicker.description') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-3">
        <Input
          ref="searchInputRef"
          v-model="query"
          :placeholder="t('editor.resourcePicker.searchPlaceholder')"
        />

        <ScrollArea class="max-h-[420px] rounded-md border">
          <div v-if="filteredResources.length === 0" class="px-4 py-8 text-center">
            <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
          </div>

          <div v-else class="divide-y">
            <button
              v-for="resource in filteredResources"
              :key="resource.id"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent"
              @click="selectResource(resource)"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
              >
                <img
                  v-if="resource.path"
                  :src="resource.path"
                  :alt="resource.displayName || resource.name"
                  class="h-full w-full object-cover"
                />
                <ImageIcon v-else class="h-5 w-5 text-muted-foreground" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ resource.displayName || resource.name }}
                </div>
                <div class="truncate text-xs text-muted-foreground">{{ resource.path }}</div>
              </div>

              <Badge variant="secondary" class="shrink-0 text-xs">
                {{ resource.extension || resource.mimeType || 'image' }}
              </Badge>
            </button>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { Image as ImageIcon } from 'lucide-vue-next';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

const props = withDefaults(
  defineProps<{
    open: boolean;
    resources: ResourceClientDTO[];
  }>(),
  {
    open: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [resource: ResourceClientDTO];
}>();

const { t } = useI18n();
const query = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const filteredResources = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  if (!normalizedQuery) {
    return props.resources;
  }

  return props.resources.filter((resource) => {
    const haystack = [resource.displayName, resource.name, resource.path]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
});

const emptyMessage = computed(() =>
  props.resources.length === 0
    ? t('editor.resourcePicker.empty')
    : t('editor.resourcePicker.noMatches'),
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = '';
      requestAnimationFrame(() => {
        searchInputRef.value?.focus();
      });
    }
  },
);

function handleOpenChange(value: boolean) {
  emit('update:open', value);
}

function selectResource(resource: ResourceClientDTO) {
  emit('select', resource);
  emit('update:open', false);
}
</script>
