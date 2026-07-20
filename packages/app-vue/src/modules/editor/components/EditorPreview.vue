<template>
  <div class="w-full h-full overflow-auto bg-background">
    <div
      ref="previewContentRef"
      v-html="renderedHtml"
      class="preview-content px-6 py-6 max-w-3xl mx-auto"
      @click="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import { useRepositoryResourceGateway } from '../../repository/services/repository-resource-gateway';
import { resolveMarkdownResourceReferences } from '../utils/markdown-resource-references';

const { t } = useI18n();
const repository = useRepositoryResourceGateway();

const props = defineProps<{
  content: string;
  onLinkClick?: (title: string) => void;
  brokenResourceReferences?: Array<{ destination: string }>;
}>();

const emit = defineEmits<{
  linkClick: [title: string];
}>();

const renderedHtml = ref('');
const previewContentRef = ref<HTMLElement | null>(null);
let md: MarkdownIt;
let renderRunId = 0;

function initializeMarkdownIt() {
  md = new MarkdownIt({
    // Vault notes are untrusted content; never enable raw HTML (ADR-034 Phase 0).
    // Vault 笔记内容不可信，禁止原始 HTML（ADR-034 阶段 0）。
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  md.core.ruler.after('inline', 'bidirectional-links', (state) => {
    const blockTokens = state.tokens;

    for (let i = 0; i < blockTokens.length; i++) {
      if (blockTokens[i].type !== 'inline') continue;

      const inlineTokens = blockTokens[i].children || [];
      const newTokens: Token[] = [];

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

function decodeDestination(destination: string): string {
  try {
    return decodeURI(destination);
  } catch {
    return destination;
  }
}

function appendBrokenClass(element: Element) {
  const currentClass = element.getAttribute('class');
  element.setAttribute(
    'class',
    currentClass ? `${currentClass} broken-resource-reference` : 'broken-resource-reference',
  );
}

async function resolveImageSourceMap(markdown: string): Promise<Map<string, string>> {
  await repository.ensureReady();

  const references = resolveMarkdownResourceReferences(markdown, repository.resources.value).filter(
    (reference) => reference.kind === 'image' && reference.isRepositoryReference && reference.resource,
  );
  const sourceMap = new Map<string, string>();

  for (const reference of references) {
    const resource = reference.resource;
    if (!resource || sourceMap.has(reference.destination)) {
      continue;
    }

    try {
      sourceMap.set(reference.destination, await repository.readResourceAsDataUrl(resource));
    } catch {
      // Broken-state styling is handled separately; keep the original destination when unreadable.
    }
  }

  return sourceMap;
}

async function renderMarkdown() {
  if (!md) return;

  const currentRunId = ++renderRunId;

  try {
    const html = md.render(props.content);
    const resolvedReferences = resolveMarkdownResourceReferences(
      props.content,
      repository.resources.value,
    );
    const brokenDestinations = new Set(
      (props.brokenResourceReferences ?? []).map((reference) => reference.destination),
    );

    const template = document.createElement('template');
    template.innerHTML = html;

    for (const element of template.content.querySelectorAll('img, a')) {
      const attribute = element.tagName === 'IMG' ? 'src' : 'href';
      const destination = element.getAttribute(attribute);
      if (!destination) {
        continue;
      }

      const decodedDestination = decodeDestination(destination);
      if (element.tagName === 'IMG') {
        const imageReference = resolvedReferences.find(
          (reference) =>
            reference.kind === 'image' &&
            (reference.destination === destination || reference.destination === decodedDestination),
        );
        if (imageReference?.isRepositoryReference) {
          element.setAttribute(
            'data-repository-destination',
            imageReference.destination || decodedDestination,
          );
        }
      }

      if (brokenDestinations.has(destination) || brokenDestinations.has(decodedDestination)) {
        appendBrokenClass(element);
      }
    }

    renderedHtml.value = template.innerHTML;
    await nextTick();

    if (currentRunId !== renderRunId) {
      return;
    }

    void hydratePreviewImages(currentRunId);
  } catch (error) {
    console.error('Markdown render error:', error);
    renderedHtml.value = '<p>' + t('editor.preview.renderError') + '</p>';
  }
}

async function hydratePreviewImages(runId: number) {
  const container = previewContentRef.value;
  if (!container) {
    return;
  }

  const imageSourceMap = await resolveImageSourceMap(props.content);
  if (runId !== renderRunId) {
    return;
  }

  for (const image of container.querySelectorAll('img')) {
    const destination =
      image.getAttribute('data-repository-destination') ??
      image.getAttribute('src') ??
      image.getAttribute('data-src');
    if (!destination) {
      continue;
    }

    const decodedDestination = decodeDestination(destination);
    const resolvedSource =
      imageSourceMap.get(destination) ?? imageSourceMap.get(decodedDestination) ?? null;
    if (resolvedSource) {
      image.setAttribute('src', resolvedSource);
    }
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

initializeMarkdownIt();

watch(
  () => [props.content, props.brokenResourceReferences],
  () => {
    void renderMarkdown();
  },
  { immediate: true },
);
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
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.preview-content h1 {
  font-size: 1.875rem;
  line-height: 2.25rem;
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.5rem;
}

.preview-content h2 {
  font-size: 1.5rem;
  line-height: 2rem;
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.5rem;
}

.preview-content h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.preview-content p {
  margin-bottom: 1rem;
}

.preview-content a {
  color: hsl(var(--primary));
}

.preview-content a:hover {
  text-decoration-line: underline;
}

.preview-content a.internal-link {
  background-color: hsl(var(--primary) / 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
  transition-property: color, background-color;
  transition-duration: 150ms;
  text-decoration-line: none;
}

.preview-content a.internal-link:hover {
  background-color: hsl(var(--primary) / 0.2);
}

.preview-content code {
  background-color: hsl(var(--muted));
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.preview-content pre {
  background-color: hsl(var(--muted));
  border-radius: 0.375rem;
  padding: 1rem;
  overflow: auto;
  margin-bottom: 1rem;
}

.preview-content pre code {
  background-color: transparent;
  padding: 0;
}

.preview-content blockquote {
  border-left: 4px solid hsl(var(--muted-foreground) / 0.3);
  padding-left: 1rem;
  color: hsl(var(--muted-foreground));
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.preview-content ul,
.preview-content ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.preview-content li {
  margin-bottom: 0.25rem;
}

.preview-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.preview-content table th,
.preview-content table td {
  border: 1px solid hsl(var(--border));
  padding: 0.5rem 0.75rem;
}

.preview-content table th {
  background-color: hsl(var(--muted));
  font-weight: 600;
}

.preview-content table tr:nth-child(even) {
  background-color: hsl(var(--muted) / 0.5);
}

.preview-content hr {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.preview-content img {
  max-width: 100%;
  height: auto;
}

.preview-content .broken-resource-reference {
  outline: 2px dashed hsl(var(--destructive));
  outline-offset: 2px;
}

.preview-content strong {
  font-weight: 600;
}

.preview-content em {
  font-style: italic;
}
</style>
