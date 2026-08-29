<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Plus } from '@lucide/vue';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@memoflow/ui-vue-shadcn';
import type { LabelPickerOption } from './label-selection.types';

const CREATE_VALUE_PREFIX = '__memoflow_label_create__:';

const props = withDefaults(
  defineProps<{
    modelValue: readonly string[];
    options: readonly LabelPickerOption[];
    disabled?: boolean;
    allowCreate?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
    createLabel?: string;
  }>(),
  {
    disabled: false,
    allowCreate: false,
    searchPlaceholder: 'Search labels…',
    emptyText: 'No labels found',
    createLabel: 'Create label',
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void;
  (event: 'create', name: string): void;
}>();

const search = ref('');
const trimmedSearch = computed(() => search.value.trim().replace(/\s+/g, ' '));
const normalizedSearch = computed(() => trimmedSearch.value.toLocaleLowerCase());
const hasExactMatch = computed(() =>
  props.options.some(
    (option) =>
      option.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalizedSearch.value,
  ),
);
const showCreate = computed(
  () => props.allowCreate && trimmedSearch.value.length > 0 && !hasExactMatch.value,
);
const createValue = computed(() => `${CREATE_VALUE_PREFIX}${trimmedSearch.value}`);
const selectedIds = computed(() => [...props.modelValue]);

function handleSelectionChange(value: unknown): void {
  if (!Array.isArray(value)) return;
  const ids = value.filter((item): item is string => typeof item === 'string');
  emit('update:modelValue', [...new Set(ids)]);
}

function handleCreateSelect(event: Event): void {
  event.preventDefault();
  const name = trimmedSearch.value;
  if (!name) return;
  emit('create', name);
  search.value = '';
}
</script>

<template>
  <Command
    :model-value="selectedIds"
    :disabled="disabled"
    multiple
    :reset-search-term-on-select="false"
    @update:model-value="handleSelectionChange"
  >
    <CommandInput v-model="search" :placeholder="searchPlaceholder" :disabled="disabled" />
    <CommandList class="max-h-64">
      <CommandEmpty>{{ emptyText }}</CommandEmpty>
      <CommandGroup>
        <CommandItem
          v-for="option in options"
          :key="option.id"
          :value="option.id"
          :text-value="option.name"
          :disabled="disabled"
          class="gap-2"
        >
          <Check
            class="h-4 w-4 shrink-0"
            :class="modelValue.includes(option.id) ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
          />
          <span
            v-if="option.color"
            class="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
            :style="{ backgroundColor: option.color }"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ option.name }}</span>
        </CommandItem>
      </CommandGroup>
      <template v-if="showCreate">
        <CommandSeparator />
        <CommandGroup>
          <CommandItem
            :value="createValue"
            :text-value="trimmedSearch"
            class="gap-2"
            data-testid="label-create-option"
            @select="handleCreateSelect"
          >
            <Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{{ createLabel }} “{{ trimmedSearch }}”</span>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
  </Command>
</template>
