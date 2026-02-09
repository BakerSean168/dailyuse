<template>
  <div class="code-snippet-view">
    <div class="snippet-header d-flex align-center justify-space-between px-3 py-1">
      <div class="d-flex align-center ga-2">
        <v-chip
          :color="typeColor"
          size="x-small"
          variant="flat"
          label
        >
          {{ typeLabel }}
        </v-chip>
        <span class="text-caption text-medium-emphasis">{{ snippet.language }}</span>
      </div>

      <div class="d-flex align-center ga-1">
        <span v-if="snippet.caption" class="text-caption text-medium-emphasis">
          {{ snippet.caption }}
        </span>
        <v-btn
          icon="mdi-content-copy"
          size="x-small"
          variant="text"
          @click="copyToClipboard"
        />
      </div>
    </div>

    <pre class="snippet-code"><code
      ref="codeEl"
      :class="`language-${languageClass}`"
    >{{ snippet.content }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import type { CodeSnippetDTO } from '../../types';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';

// Register languages
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);

const props = defineProps<{
  snippet: CodeSnippetDTO;
}>();

const codeEl = ref<HTMLElement | null>(null);

const typeColor = computed(() =>
  props.snippet.type === 'GoodExample' ? 'success' : 'error',
);

const typeLabel = computed(() =>
  props.snippet.type === 'GoodExample' ? '✓ Good' : '✗ Bad',
);

const languageClass = computed(() => {
  const lang = props.snippet.language.toLowerCase();
  switch (lang) {
    case 'typescript': return 'typescript';
    case 'json': return 'json';
    case 'yaml': return 'yaml';
    case 'prisma': return 'typescript'; // Fallback
    default: return 'plaintext';
  }
});

async function highlight(): Promise<void> {
  await nextTick();
  if (codeEl.value) {
    hljs.highlightElement(codeEl.value);
  }
}

onMounted(highlight);
watch(() => props.snippet.content, highlight);

async function copyToClipboard(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.snippet.content);
  } catch {
    // Fallback for non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = props.snippet.content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
</script>

<style scoped>
.code-snippet-view {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
}

.snippet-header {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.snippet-code {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  background: rgba(var(--v-theme-surface), 1);
}

.snippet-code code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}
</style>
