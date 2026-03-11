<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t('editor.resourcePicker.title') }}</DialogTitle>
        <DialogDescription>{{ t('editor.resourcePicker.description') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <Input
          ref="searchInputRef"
          v-model="query"
          :placeholder="t('editor.resourcePicker.searchPlaceholder')"
        />

        <div class="flex flex-wrap gap-2">
          <Button
            v-for="filter in kindFilters"
            :key="filter.value"
            size="sm"
            :variant="activeKind === filter.value ? 'default' : 'outline'"
            @click="activeKind = filter.value"
          >
            {{ filter.label }}
          </Button>
        </div>

        <div class="rounded-lg border bg-muted/20 p-3">
          <div class="mb-2 flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-medium">{{ t('editor.resourcePicker.modeLabel') }}</div>
              <div class="text-xs text-muted-foreground">
                {{ t('editor.resourcePicker.modeHint') }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button
                size="sm"
                :variant="mode === 'path' ? 'default' : 'outline'"
                @click="mode = 'path'"
              >
                {{ t('editor.resourcePicker.modePath') }}
              </Button>
              <Button
                size="sm"
                :disabled="activeKind !== 'all' && activeKind !== 'image'"
                :variant="mode === 'base64' ? 'default' : 'outline'"
                @click="mode = 'base64'"
              >
                {{ t('editor.resourcePicker.modeBase64') }}
              </Button>
            </div>
          </div>
          <p v-if="mode === 'base64'" class="text-xs text-muted-foreground">
            {{ t('editor.resourcePicker.base64Hint') }}
          </p>
        </div>

        <p
          v-if="activeKind !== 'all' && activeKind !== 'image'"
          class="text-xs text-muted-foreground"
        >
          {{ t('editor.resourcePicker.pathOnlyHint') }}
        </p>

        <ScrollArea class="max-h-[460px] rounded-md border">
          <div v-if="filteredRecentItems.length > 0" class="border-b">
            <div
              class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {{ t('editor.resourcePicker.recent') }}
            </div>
            <div class="divide-y">
              <button
                v-for="item in filteredRecentItems"
                :key="`recent-${item.resource.id}`"
                type="button"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent"
                @click="selectItem(item)"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted"
                >
                  <component :is="getKindIcon(item.kind)" class="h-4 w-4 text-muted-foreground" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ item.resource.displayName || item.resource.name }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">{{ item.resource.path }}</div>
                </div>
                <Badge variant="secondary" class="shrink-0 text-xs">
                  {{ t(`editor.resourcePicker.kinds.${item.kind}`) }}
                </Badge>
              </button>
            </div>
          </div>

          <div
            v-if="filteredItems.length === 0"
            class="px-4 py-10 text-center text-sm text-muted-foreground"
          >
            {{ emptyMessage }}
          </div>

          <div v-else class="divide-y">
            <button
              v-for="item in regularItems"
              :key="item.resource.id"
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent"
              @click="selectItem(item)"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <component :is="getKindIcon(item.kind)" class="h-4 w-4 text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <div class="truncate text-sm font-medium">
                    {{ item.resource.displayName || item.resource.name }}
                  </div>
                  <Badge variant="outline" class="shrink-0 text-[10px] uppercase">
                    {{ t(`editor.resourcePicker.kinds.${item.kind}`) }}
                  </Badge>
                </div>
                <div class="truncate text-xs text-muted-foreground">{{ item.resource.path }}</div>
                <div
                  v-if="item.tags.length > 0"
                  class="mt-1 truncate text-xs text-muted-foreground"
                >
                  {{ item.tags.join(', ') }}
                </div>
              </div>
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
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { File, FileImage, FileText, Film, Link2 } from 'lucide-vue-next';
import type {
  ResourceInsertionItem,
  ResourceInsertionKind,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
} from '../composables/useResourceInsertion';

const props = withDefaults(
  defineProps<{
    open: boolean;
    items: ResourceInsertionItem[];
    recentItems?: ResourceInsertionItem[];
  }>(),
  {
    open: false,
    recentItems: () => [],
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [
    payload: {
      mode: ResourceInsertionMode;
      template: ResourceInsertionTemplate;
      item: ResourceInsertionItem;
    },
  ];
}>();

const { t } = useI18n();
const query = ref('');
const activeKind = ref<'all' | ResourceInsertionKind>('all');
const mode = ref<ResourceInsertionMode>('path');
const searchInputRef = ref<HTMLInputElement | null>(null);

const kindFilters = computed(() => [
  { value: 'all' as const, label: t('common.all') },
  { value: 'image' as const, label: t('editor.resourcePicker.kinds.image') },
  { value: 'note' as const, label: t('editor.resourcePicker.kinds.note') },
  { value: 'document' as const, label: t('editor.resourcePicker.kinds.document') },
  { value: 'media' as const, label: t('editor.resourcePicker.kinds.media') },
  { value: 'other' as const, label: t('editor.resourcePicker.kinds.other') },
]);

const filteredItems = computed(() => filterItems(props.items, query.value, activeKind.value));
const filteredRecentItems = computed(() => {
  const seen = new Set<string>();
  return filterItems(props.recentItems, query.value, activeKind.value).filter((item) => {
    const key = String(item.resource.id);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
});
const regularItems = computed(() => {
  const recentIds = new Set(filteredRecentItems.value.map((item) => String(item.resource.id)));
  return filteredItems.value.filter((item) => !recentIds.has(String(item.resource.id)));
});

const emptyMessage = computed(() => {
  if (props.items.length === 0) {
    return t('editor.resourcePicker.empty');
  }

  return t('editor.resourcePicker.noMatches');
});

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    query.value = '';
    activeKind.value = 'all';
    mode.value = 'path';

    requestAnimationFrame(() => {
      searchInputRef.value?.focus();
    });
  },
);

watch(activeKind, (kind) => {
  if (kind !== 'all' && kind !== 'image' && mode.value === 'base64') {
    mode.value = 'path';
  }
});

function handleOpenChange(value: boolean) {
  emit('update:open', value);
}

function selectItem(item: ResourceInsertionItem) {
  emit('select', {
    item,
    mode: item.kind === 'image' ? mode.value : 'path',
    template: 'auto',
  });
  emit('update:open', false);
}

function filterItems(
  items: ResourceInsertionItem[],
  queryValue: string,
  kind: 'all' | ResourceInsertionKind,
): ResourceInsertionItem[] {
  const normalizedQuery = queryValue.trim().toLowerCase();

  return items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return item.searchableText.includes(normalizedQuery);
  });
}

function getKindIcon(kind: ResourceInsertionKind) {
  switch (kind) {
    case 'image':
      return FileImage;
    case 'note':
      return FileText;
    case 'document':
      return Link2;
    case 'media':
      return Film;
    default:
      return File;
  }
}
</script>
