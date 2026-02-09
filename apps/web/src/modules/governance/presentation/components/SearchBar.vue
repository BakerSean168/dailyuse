<template>
  <v-text-field
    v-model="query"
    prepend-inner-icon="mdi-magnify"
    placeholder="搜索规则 (按 / 聚焦)"
    variant="outlined"
    density="compact"
    hide-details
    clearable
    @update:model-value="onInput"
    @keydown.escape="query = ''; onInput('')"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

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
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput(value: string | null) {
  const q = value ?? '';
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
    const input = document.querySelector('.v-text-field input') as HTMLInputElement;
    input?.focus();
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
