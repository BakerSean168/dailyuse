<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" :size="16" />
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      class="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      :placeholder="t('governance.search.placeholder')"
      :aria-label="t('governance.search.placeholder')"
      @input="onInput"
      @keydown.escape="
        query = '';
        onInput();
      "
    />
    <button
      v-if="query"
      type="button"
      class="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="t('governance.search.clear')"
      @click="
        query = '';
        onInput();
      "
    >
      <X :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Search, X } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    debounceMs?: number;
  }>(),
  {
    modelValue: '',
    debounceMs: 300,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [query: string];
}>();

const query = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  const q = query.value ?? '';
  emit('update:modelValue', q);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('search', q);
  }, props.debounceMs);
}

// Keyboard shortcut: / to focus search
function handleKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
    e.preventDefault();
    inputRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>
