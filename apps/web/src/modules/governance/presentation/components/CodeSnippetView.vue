<template>
  <CodeSnippetView :snippet="snippet" />
</template>

<script setup lang="ts">
import { CodeSnippetView } from '@dailyuse/ui-vue-shadcn';

// Use the interface from the extracted component or import from contracts when available
interface CodeSnippetDTO {
  type: 'GoodExample' | 'BadExample';
  language: string;
  content: string;
  caption?: string;
}

defineProps<{
  snippet: CodeSnippetDTO;
}>();
</script>
