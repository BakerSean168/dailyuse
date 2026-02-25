<template>
  <div class="space-y-2">
    <label class="text-sm font-medium leading-none">{{ label }}</label>
    <div class="flex flex-wrap gap-1.5 p-2 min-h-[38px] border rounded-md bg-background">
      <!-- Existing tags -->
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium"
      >
        {{ tag }}
        <button
          class="hover:text-blue-600 dark:hover:text-blue-300"
          @click="removeTag(tag)"
        >
          <X :size="12" />
        </button>
      </span>

      <!-- Input -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        :placeholder="modelValue.length === 0 ? '输入后按回车添加标签' : ''"
        :list="suggestions.length > 0 ? 'tag-suggestions' : undefined"
        @keydown.enter.prevent="addTag"
        @keydown.backspace="onBackspace"
      />
    </div>
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>

    <!-- Suggestions datalist -->
    <datalist v-if="suggestions.length > 0" id="tag-suggestions">
      <option v-for="s in filteredSuggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    tags: string[];
    suggestions?: string[];
    label?: string;
    hint?: string;
  }>(),
  {
    suggestions: () => [],
    label: '标签',
    hint: '输入后按回车添加标签（自动转换为 kebab-case）',
  },
);

const emit = defineEmits<{
  'update:tags': [tags: string[]];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');

const modelValue = computed(() => props.tags);

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
  emit('update:tags', props.tags.filter((t) => t !== tag));
}

function onBackspace() {
  if (inputValue.value === '' && props.tags.length > 0) {
    emit('update:tags', props.tags.slice(0, -1));
  }
}
</script>
