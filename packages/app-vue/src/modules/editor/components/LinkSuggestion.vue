<template>
  <Popover v-model:open="isVisible">
    <PopoverTrigger as-child>
      <div :style="{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }" />
    </PopoverTrigger>
    <PopoverContent class="w-80 p-0" align="start">
      <Command class="rounded-lg border-none shadow-md">
        <CommandInput
          :placeholder="t('editor.linkSuggestion.searchPlaceholder')"
          :model-value="searchQuery"
          readonly
        />
        <CommandEmpty>
          <div v-if="loading" class="flex items-center justify-center py-6">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
            <span class="text-sm">{{ t('editor.linkSuggestion.searching') }}</span>
          </div>
          <div v-else class="py-6 text-center text-sm">
            <p class="text-muted-foreground">{{ t('editor.linkSuggestion.noResults') }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ t('editor.linkSuggestion.createNew', { name: searchQuery }) }}
            </p>
          </div>
        </CommandEmpty>
        <CommandList>
          <CommandGroup :heading="t('editor.linkSuggestion.documents')">
            <CommandItem
              v-for="(doc, index) in documents"
              :key="doc.id"
              :value="doc.id"
              :data-selected="selectedIndex === index"
              @mouseenter="selectedIndex = index"
              @select="selectDocument(doc)"
              class="cursor-pointer"
            >
              <FileText class="mr-2 h-4 w-4" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ doc.title }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-muted-foreground truncate">{{
                    getFolderPath(doc.path) || '/'
                  }}</span>
                  <Badge v-if="doc.tags.length" variant="secondary" class="text-xs">
                    {{ doc.tags[0] }}
                  </Badge>
                </div>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div class="border-t p-2 text-xs text-muted-foreground flex items-center gap-1">
          <Keyboard class="h-3 w-3" />
          {{ t('editor.linkSuggestion.keyboardHints') }}
        </div>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDebounceFn } from '@vueuse/core';
import { Popover, PopoverContent, PopoverTrigger } from '@dailyuse/ui-vue-shadcn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { FileText, Keyboard } from 'lucide-vue-next';
import { useEditorLinkIndex } from '../composables/useEditorLinkIndex';
import type { LinkIndexDocument } from '../utils/linkIndex';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    visible: boolean;
    searchQuery: string;
    position: { x: number; y: number };
    excludeDocumentId?: string;
  }>(),
  {
    visible: false,
    searchQuery: '',
    position: () => ({ x: 0, y: 0 }),
    excludeDocumentId: undefined,
  },
);

const emit = defineEmits<{
  select: [document: LinkIndexDocument | null];
  close: [];
  createNew: [title: string];
}>();

const { ensureResourcesLoaded, searchDocuments: searchLinkDocuments } = useEditorLinkIndex();

const isVisible = ref(false);
const loading = ref(false);
const documents = ref<LinkIndexDocument[]>([]);
const selectedIndex = ref(0);

function getFolderPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
}

async function searchDocumentsImpl(query: string) {
  loading.value = true;
  try {
    await ensureResourcesLoaded();
    documents.value = searchLinkDocuments(query, {
      excludeId: props.excludeDocumentId,
      limit: 12,
    });
    selectedIndex.value = 0;
  } catch (error) {
    console.error('Search documents failed:', error);
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

const searchDocuments = useDebounceFn(searchDocumentsImpl, 300);

function selectDocument(doc: LinkIndexDocument) {
  emit('select', doc);
  close();
}

function selectCurrent() {
  if (documents.value.length > 0) {
    const selected = documents.value[selectedIndex.value];
    selectDocument(selected);
  } else if (props.searchQuery.trim()) {
    emit('createNew', props.searchQuery.trim());
    close();
  }
}

function close() {
  isVisible.value = false;
  documents.value = [];
  emit('close');
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isVisible.value) return;

  if (documents.value.length === 0) {
    if (event.key === 'Enter') {
      event.preventDefault();
      selectCurrent();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, documents.value.length - 1);
      break;

    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;

    case 'Enter':
      event.preventDefault();
      selectCurrent();
      break;

    case 'Escape':
      event.preventDefault();
      close();
      break;
  }
}

watch(
  () => props.visible,
  (visible) => {
    isVisible.value = visible;
    if (visible) {
      selectedIndex.value = 0;
      void searchDocumentsImpl(props.searchQuery);
    } else {
      documents.value = [];
    }
  },
);

watch(
  () => props.searchQuery,
  (query) => {
    if (isVisible.value) {
      searchDocuments(query);
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
