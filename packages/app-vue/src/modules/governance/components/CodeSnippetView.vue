<template>
  <div class="border rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
          :class="typeClasses"
        >
          {{ typeLabel }}
        </span>
        <span class="text-xs text-muted-foreground">{{ snippet.language }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="snippet.caption" class="text-xs text-muted-foreground">
          {{ snippet.caption }}
        </span>
        <button
          class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="复制代码"
          @click="copyToClipboard"
        >
          <Copy :size="14" />
        </button>
      </div>
    </div>

    <!-- Code -->
    <pre class="m-0 p-4 overflow-x-auto text-[13px] leading-relaxed bg-background"><code
      ref="codeEl"
      :class="`language-${languageClass}`"
      class="font-mono"
    >{{ snippet.content }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { Copy } from 'lucide-vue-next';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';

// Register languages
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);

// Code snippet interface — aligned with contracts CodeSnippetDTO
interface CodeSnippetDTO {
  id?: string;
  type: 'GoodExample' | 'BadExample';
  language: string;
  content: string;
  caption?: string | null;
}

const props = defineProps<{
  snippet: CodeSnippetDTO;
}>();

const codeEl = ref<HTMLElement | null>(null);

const typeClasses = computed(() =>
  props.snippet.type === 'GoodExample'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
);

const typeLabel = computed(() => (props.snippet.type === 'GoodExample' ? '✓ Good' : '✗ Bad'));

const languageClass = computed(() => {
  const lang = props.snippet.language.toLowerCase();
  switch (lang) {
    case 'typescript':
      return 'typescript';
    case 'json':
      return 'json';
    case 'yaml':
      return 'yaml';
    case 'prisma':
      return 'typescript';
    default:
      return 'plaintext';
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
    const textarea = document.createElement('textarea');
    textarea.value = props.snippet.content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
</script>
