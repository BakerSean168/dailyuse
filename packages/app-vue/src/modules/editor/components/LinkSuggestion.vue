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
          <CommandGroup :heading="t('editor.linkSuggestion.notes')">
            <CommandItem
              v-for="(note, index) in notes"
              :key="note.id"
              :value="note.id"
              :data-selected="selectedIndex === index"
              @mouseenter="selectedIndex = index"
              @select="selectNote(note)"
              class="cursor-pointer"
            >
              <FileText class="mr-2 h-4 w-4" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ note.title }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-muted-foreground truncate">{{
                    getFolderPath(note.path) || '/'
                  }}</span>
                  <Badge v-if="note.tags.length" variant="secondary" class="text-xs">
                    {{ note.tags[0] }}
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
import type { LinkIndexNote } from '../utils/link-index';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    visible: boolean;
    searchQuery: string;
    position: { x: number; y: number };
    excludeNoteId?: string;
  }>(),
  {
    visible: false,
    searchQuery: '',
    position: () => ({ x: 0, y: 0 }),
    excludeNoteId: undefined,
  },
);

const emit = defineEmits<{
  select: [note: LinkIndexNote | null];
  close: [];
  createNew: [title: string];
}>();

const { ensureResourcesLoaded, searchNotes: searchLinkNotes } = useEditorLinkIndex();

const isVisible = ref(false);
const loading = ref(false);
const notes = ref<LinkIndexNote[]>([]);
const selectedIndex = ref(0);

function getFolderPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
}

async function searchNotesImpl(query: string) {
  loading.value = true;
  try {
    await ensureResourcesLoaded();
    notes.value = searchLinkNotes(query, {
      excludeId: props.excludeNoteId,
      limit: 12,
    });
    selectedIndex.value = 0;
  } catch (error) {
    console.error('Search notes failed:', error);
    notes.value = [];
  } finally {
    loading.value = false;
  }
}

const searchNotes = useDebounceFn(searchNotesImpl, 300);

function selectNote(note: LinkIndexNote) {
  emit('select', note);
  close();
}

function selectCurrent() {
  if (notes.value.length > 0) {
    const selected = notes.value[selectedIndex.value];
    selectNote(selected);
  } else if (props.searchQuery.trim()) {
    emit('createNew', props.searchQuery.trim());
    close();
  }
}

function close() {
  isVisible.value = false;
  notes.value = [];
  emit('close');
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isVisible.value) return;

  if (notes.value.length === 0) {
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
      selectedIndex.value = Math.min(selectedIndex.value + 1, notes.value.length - 1);
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
      void searchNotesImpl(props.searchQuery);
    } else {
      notes.value = [];
    }
  },
);

watch(
  () => props.searchQuery,
  (query) => {
    if (isVisible.value) {
      searchNotes(query);
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
