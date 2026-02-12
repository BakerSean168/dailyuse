<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" :size="16" />
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      class="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      placeholder="搜索规则 (按 / 聚焦)"
      @input="onInput"
      @keydown.escape="query = ''; onInput()"
    />
    <button
      v-if="query"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      @click="query = ''; onInput()"
    >
      <X :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Search, X } from 'lucide-vue-next';

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
