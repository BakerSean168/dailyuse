<template>
  <Popover v-model:open="isVisible">
    <PopoverTrigger as-child>
      <div :style="{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px` }" />
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
              v-for="(doc, index) in filteredDocuments"
              :key="doc.id"
              :value="doc.id"
              :data-selected="selectedIndex === index"
              @mouseenter="selectedIndex = index"
              @select="selectDocument(doc)"
              class="cursor-pointer"
            >
              <FileText class="mr-2 h-4 w-4" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ doc.name }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-muted-foreground truncate">{{
                    getFolderPath(doc.path) || '/'
                  }}</span>
                  <Badge v-if="doc.metadata?.tags?.length" variant="secondary" class="text-xs">
                    {{ doc.metadata.tags[0] }}
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
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDebounceFn } from '@vueuse/core';
import type { DocumentClientDTO } from '@dailyuse/contracts/editor';
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

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    visible: boolean;
    searchQuery: string;
    position: { x: number; y: number };
  }>(),
  {
    visible: false,
    searchQuery: '',
    position: () => ({ x: 0, y: 0 }),
  },
);

const emit = defineEmits<{
  select: [document: DocumentClientDTO | null];
  close: [];
  createNew: [title: string];
}>();

const isVisible = ref(false);
const loading = ref(false);
const documents = ref<DocumentClientDTO[]>([]);
const selectedIndex = ref(0);

const filteredDocuments = computed(() => {
  if (!props.searchQuery.trim()) return documents.value;

  const query = props.searchQuery.toLowerCase();
  return documents.value.filter(
    (doc) =>
      doc.name.toLowerCase().includes(query) ||
      doc.path?.toLowerCase().includes(query) ||
      doc.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(query)),
  );
});

function getFolderPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
}

async function searchDocumentsImpl(query: string) {
  if (!query || query.length < 1) {
    documents.value = [];
    return;
  }

  loading.value = true;
  try {
    documents.value = [];
    selectedIndex.value = 0;
  } catch (error) {
    console.error('Search documents failed:', error);
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

const searchDocuments = useDebounceFn(searchDocumentsImpl, 300);

function selectDocument(doc: DocumentClientDTO) {
  emit('select', doc);
  close();
}

function selectCurrent() {
  if (filteredDocuments.value.length > 0) {
    const selected = filteredDocuments.value[selectedIndex.value];
    selectDocument(selected);
  } else if (props.searchQuery.trim()) {
    emit('createNew', props.searchQuery.trim());
    close();
  }
}

function close() {
  isVisible.value = false;
  emit('close');
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isVisible.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredDocuments.value.length - 1);
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
    }
  },
);

watch(
  () => props.searchQuery,
  (query) => {
    if (query) {
      searchDocuments(query);
    } else {
      documents.value = [];
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
