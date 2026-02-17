<template>
  <div class="w-full h-full overflow-auto bg-background">
    <div v-html="renderedHtml" class="preview-content px-6 py-6 max-w-3xl mx-auto" @click="handleClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

interface Props {
  content: string;
  onLinkClick?: (title: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  linkClick: [title: string];
}>();

const renderedHtml = ref('');
let md: MarkdownIt;

function initializeMarkdownIt() {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  md.core.ruler.after('inline', 'bidirectional-links', (state) => {
    const blockTokens = state.tokens;

    for (let i = 0; i < blockTokens.length; i++) {
      if (blockTokens[i].type !== 'inline') continue;

      const inlineTokens = blockTokens[i].children || [];
      const newTokens = [];

      for (let j = 0; j < inlineTokens.length; j++) {
        const token = inlineTokens[j];

        if (token.type === 'text') {
          const linkPattern = /\[\[([^\]|#]+)(?:\|([^\]#]+))?(?:#([^\]]+))?\]\]/g;
          const text = token.content;
          let lastIndex = 0;
          let match;

          while ((match = linkPattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const title = match[1].trim();
            const alias = match[2]?.trim();
            const section = match[3]?.trim();
            const displayText = alias || (section ? `${title}#${section}` : title);

            if (match.index > lastIndex) {
              const textToken = new state.Token('text', '', 0);
              textToken.content = text.slice(lastIndex, match.index);
              newTokens.push(textToken);
            }

            const linkOpen = new state.Token('link_open', 'a', 1);
            linkOpen.attrSet('href', `#${title}`);
            linkOpen.attrSet('class', 'internal-link');
            linkOpen.attrSet('data-title', title);
            if (section) {
              linkOpen.attrSet('data-section', section);
            }

            const linkText = new state.Token('text', '', 0);
            linkText.content = displayText;

            const linkClose = new state.Token('link_close', 'a', -1);

            newTokens.push(linkOpen, linkText, linkClose);
            lastIndex = match.index + fullMatch.length;
          }

          if (lastIndex < text.length) {
            const textToken = new state.Token('text', '', 0);
            textToken.content = text.slice(lastIndex);
            newTokens.push(textToken);
          }

          if (lastIndex > 0) {
            inlineTokens.splice(j, 1, ...newTokens);
            j += newTokens.length - 1;
          }
        } else {
          newTokens.push(token);
        }
      }
    }

    return true;
  });
}

function renderMarkdown() {
  if (!md) return;
  
  try {
    let content = props.content;
    renderedHtml.value = md.render(content);
  } catch (error) {
    console.error('Markdown render error:', error);
    renderedHtml.value = '<p>渲染错误</p>';
  }
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  if (target.tagName === 'A' && target.classList.contains('internal-link')) {
    event.preventDefault();
    const title = target.getAttribute('data-title');
    if (title) {
      emit('linkClick', title);
      props.onLinkClick?.(title);
    }
  }
}

onMounted(() => {
  initializeMarkdownIt();
  renderMarkdown();
});

watch(() => props.content, () => {
  renderMarkdown();
}, { immediate: false });
</script>

<style>
.preview-content {
  line-height: 1.6;
}

.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  @apply mt-6 mb-4 font-semibold;
}

.preview-content h1 {
  @apply text-3xl border-b pb-2;
}

.preview-content h2 {
  @apply text-2xl border-b pb-2;
}

.preview-content h3 {
  @apply text-xl;
}

.preview-content p {
  @apply mb-4;
}

.preview-content a {
  @apply text-primary hover:underline;
}

.preview-content a.internal-link {
  @apply bg-primary/10 px-1.5 py-0.5 rounded font-medium transition-colors hover:bg-primary/20 no-underline;
}

.preview-content code {
  @apply bg-muted rounded px-1 py-0.5 font-mono text-sm;
}

.preview-content pre {
  @apply bg-muted rounded-md p-4 overflow-auto mb-4;
}

.preview-content pre code {
  @apply bg-transparent p-0;
}

.preview-content blockquote {
  @apply border-l-4 border-muted-foreground/30 pl-4 text-muted-foreground my-4;
}

.preview-content ul,
.preview-content ol {
  @apply mb-4 pl-8;
}

.preview-content li {
  @apply mb-1;
}

.preview-content table {
  @apply w-full border-collapse mb-4;
}

.preview-content table th,
.preview-content table td {
  @apply border border-border px-3 py-2;
}

.preview-content table th {
  @apply bg-muted font-semibold;
}

.preview-content table tr:nth-child(even) {
  @apply bg-muted/50;
}

.preview-content hr {
  @apply border-0 border-t border-border my-6;
}

.preview-content img {
  @apply max-w-full h-auto;
}

.preview-content strong {
  @apply font-semibold;
}

.preview-content em {
  @apply italic;
}
</style>
