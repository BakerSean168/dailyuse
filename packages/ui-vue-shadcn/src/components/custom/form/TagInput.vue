<template>
  <div class="space-y-2">
    <label v-if="resolvedLabel" class="text-sm font-medium leading-none">{{ resolvedLabel }}</label>
    <div class="flex min-h-[38px] flex-wrap gap-1.5 rounded-md border bg-background p-2">
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      >
        {{ tag }}
        <button class="hover:text-blue-600 dark:hover:text-blue-300" @click="removeTag(tag)">
          <X :size="12" />
        </button>
      </span>

      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        :placeholder="modelValue.length === 0 ? resolvedPlaceholder : ''"
        :list="suggestions.length > 0 ? 'tag-suggestions' : undefined"
        @keydown.enter.prevent="addTag"
        @keydown.backspace="onBackspace"
      />
    </div>
    <p v-if="resolvedHint" class="text-xs text-muted-foreground">{{ resolvedHint }}</p>

    <datalist v-if="suggestions.length > 0" id="tag-suggestions">
      <option v-for="s in filteredSuggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { X } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    tags: string[];
    suggestions?: string[];
    label?: string;
    hint?: string;
    placeholder?: string;
  }>(),
  {
    suggestions: () => [],
    label: undefined,
    hint: undefined,
    placeholder: 'Type and press Enter to add tags',
  },
);

const emit = defineEmits<{
  'update:tags': [tags: string[]];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');

const modelValue = computed(() => props.tags);
const resolvedLabel = computed(() => props.label?.trim() || '');
const resolvedHint = computed(() => props.hint?.trim() || '');
const resolvedPlaceholder = computed(() => props.placeholder?.trim() || '');

const filteredSuggestions = computed(() =>
  props.suggestions.filter((s) => !props.tags.includes(s)),
);

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function addTag() {
  const normalized = normalizeTag(inputValue.value);
  if (normalized && !props.tags.includes(normalized)) {
    emit('update:tags', [...props.tags, normalized]);
  }
  inputValue.value = '';
}

function removeTag(tag: string) {
  emit(
    'update:tags',
    props.tags.filter((t) => t !== tag),
  );
}

function onBackspace() {
  if (inputValue.value === '' && props.tags.length > 0) {
    emit('update:tags', props.tags.slice(0, -1));
  }
}
</script>
