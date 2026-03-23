import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';

export interface MarkdownLivePreviewOptions {
  imageSources?: ReadonlyMap<string, string>;
}

class InlineChipWidget extends WidgetType {
  constructor(
    private readonly label: string,
    private readonly className: string,
    private readonly attributes: Record<string, string> = {},
  ) {
    super();
  }

  override eq(other: InlineChipWidget) {
    return (
      other.label === this.label &&
      other.className === this.className &&
      JSON.stringify(other.attributes) === JSON.stringify(this.attributes)
    );
  }

  override toDOM() {
    const element = document.createElement('span');
    element.className = this.className;
    element.textContent = this.label;
    for (const [key, value] of Object.entries(this.attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }
}

class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly from: number,
    private readonly to: number,
  ) {
    super();
  }

  override eq(other: TaskCheckboxWidget) {
    return other.checked === this.checked && other.from === this.from && other.to === this.to;
  }

  override toDOM() {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = `cm-md-task-checkbox${this.checked ? ' is-checked' : ''}`;
    element.setAttribute('role', 'checkbox');
    element.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    element.setAttribute('data-task-from', String(this.from));
    element.setAttribute('data-task-to', String(this.to));
    element.setAttribute('data-task-checked', this.checked ? 'true' : 'false');
    element.textContent = this.checked ? '✓' : '';
    return element;
  }
}

class CodeBlockHeaderWidget extends WidgetType {
  constructor(
    private readonly language: string,
    private readonly codeFrom: number,
    private readonly codeTo: number,
  ) {
    super();
  }

  override eq(other: CodeBlockHeaderWidget) {
    return (
      other.language === this.language &&
      other.codeFrom === this.codeFrom &&
      other.codeTo === this.codeTo
    );
  }

  override toDOM() {
    const element = document.createElement('div');
    element.className = 'cm-live-codeblock-header';

    const label = document.createElement('span');
    label.className = 'cm-live-codeblock-header__label';
    label.textContent = this.language || 'plain text';
    element.append(label);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cm-live-codeblock-header__copy';
    button.textContent = 'Copy';
    button.setAttribute('data-code-copy-from', String(this.codeFrom));
    button.setAttribute('data-code-copy-to', String(this.codeTo));
    button.setAttribute('data-code-language', this.language);
    element.append(button);

    return element;
  }
}

class ImagePreviewWidget extends WidgetType {
  constructor(
    private readonly alt: string,
    private readonly destination: string,
    private readonly source: string | null,
  ) {
    super();
  }

  override eq(other: ImagePreviewWidget) {
    return (
      other.alt === this.alt &&
      other.destination === this.destination &&
      other.source === this.source
    );
  }

  override toDOM() {
    const figure = document.createElement('figure');
    figure.className = 'cm-md-image-widget';
    figure.setAttribute('data-image-destination', this.destination);

    const resolvedSource = this.source ?? fallbackImageSource(this.destination);
    if (resolvedSource) {
      const image = document.createElement('img');
      image.className = 'cm-md-image-widget__image';
      image.src = resolvedSource;
      image.alt = this.alt || this.destination;
      image.setAttribute('data-image-preview-src', resolvedSource);
      image.setAttribute('data-image-preview-alt', this.alt || this.destination);
      figure.append(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'cm-md-image-widget__placeholder';
      placeholder.textContent = this.alt || this.destination;
      figure.append(placeholder);
    }

    const caption = document.createElement('figcaption');
    caption.className = 'cm-md-image-widget__caption';
    caption.textContent = this.alt || this.destination;
    figure.append(caption);

    return figure;
  }
}

function fallbackImageSource(destination: string): string | null {
  if (
    destination.startsWith('http://') ||
    destination.startsWith('https://') ||
    destination.startsWith('data:')
  ) {
    return destination;
  }

  return null;
}

function overlapsSelection(view: EditorView, from: number, to: number) {
  return view.state.selection.ranges.some((range) => range.from <= to && range.to >= from);
}

function lineIsActive(view: EditorView, from: number, to: number) {
  return view.state.selection.ranges.some((range) => range.head >= from && range.head <= to);
}

function decodeDestination(destination: string) {
  try {
    return decodeURI(destination);
  } catch {
    return destination;
  }
}

function buildDecorations(
  view: EditorView,
  options: MarkdownLivePreviewOptions,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  buildCodeBlockDecorations(view, builder);

  for (const { from, to } of view.visibleRanges) {
    let line = view.state.doc.lineAt(from);

    while (line.from <= to) {
      const isActiveLine = lineIsActive(view, line.from, line.to);
      const headingMatch = line.text.match(/^(#{1,6})(\s+)/);

      if (headingMatch && !isActiveLine) {
        const markerFrom = line.from;
        const markerTo = line.from + headingMatch[0].length;
        builder.add(
          line.from,
          line.from,
          Decoration.line({
            class: `cm-live-heading cm-live-heading-${headingMatch[1].length}`,
          }),
        );
        builder.add(markerFrom, markerTo, Decoration.mark({ class: 'cm-live-heading-marker' }));
      }

      const imagePattern = /!\[([^\]]*)\]\(([^)\n]+)\)/g;
      let imageMatch: RegExpExecArray | null;
      while ((imageMatch = imagePattern.exec(line.text)) !== null) {
        const raw = imageMatch[0];
        const alt = imageMatch[1] ?? '';
        const destination = imageMatch[2] ?? '';
        const rangeFrom = line.from + imageMatch.index;
        const rangeTo = rangeFrom + raw.length;

        if (overlapsSelection(view, rangeFrom, rangeTo)) {
          continue;
        }

        const decoded = decodeDestination(destination);
        const source = options.imageSources?.get(destination) ?? options.imageSources?.get(decoded) ?? null;
        builder.add(
          rangeFrom,
          rangeTo,
          Decoration.replace({
            widget: new ImagePreviewWidget(alt, decoded, source),
          }),
        );
      }

      const wikiLinkPattern = /\[\[([^\]|#]+)(?:\|([^\]#]+))?(?:#([^\]]+))?\]\]/g;
      let wikiMatch: RegExpExecArray | null;
      while ((wikiMatch = wikiLinkPattern.exec(line.text)) !== null) {
        const raw = wikiMatch[0];
        const title = (wikiMatch[1] ?? '').trim();
        const alias = wikiMatch[2]?.trim();
        const section = wikiMatch[3]?.trim();
        const label = alias || (section ? `${title}#${section}` : title);
        const rangeFrom = line.from + wikiMatch.index;
        const rangeTo = rangeFrom + raw.length;

        if (overlapsSelection(view, rangeFrom, rangeTo)) {
          continue;
        }

        builder.add(
          rangeFrom,
          rangeTo,
          Decoration.replace({
            widget: new InlineChipWidget(label, 'cm-md-link-chip cm-md-link-chip--wiki', {
              'data-wiki-title': title,
              ...(section ? { 'data-wiki-section': section } : {}),
              title: section ? `${title}#${section}` : title,
            }),
          }),
        );
      }

      const markdownLinkPattern = /\[([^\]]+)\]\(([^)\n]+)\)/g;
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = markdownLinkPattern.exec(line.text)) !== null) {
        const rangeFrom = line.from + linkMatch.index;
        const raw = linkMatch[0];
        const rangeTo = rangeFrom + raw.length;
        const markerIndex = linkMatch.index - 1;

        if (markerIndex >= 0 && line.text[markerIndex] === '!') {
          continue;
        }

        if (overlapsSelection(view, rangeFrom, rangeTo)) {
          continue;
        }

        builder.add(
          rangeFrom,
          rangeTo,
          Decoration.replace({
            widget: new InlineChipWidget(
              linkMatch[1] ?? linkMatch[2] ?? '',
              'cm-md-link-chip cm-md-link-chip--external',
              {
                title: decodeDestination(linkMatch[2] ?? ''),
              },
            ),
          }),
        );
      }

      const taskListMatch = line.text.match(/^(\s*[-*+]\s+)(\[(?: |x|X)\])(\s+)/);
      if (taskListMatch) {
        const prefix = taskListMatch[1] ?? '';
        const checkbox = taskListMatch[2] ?? '[ ]';
        const checked = /\[x\]/i.test(checkbox);
        const checkboxFrom = line.from + prefix.length;
        const checkboxTo = checkboxFrom + checkbox.length;

        if (!overlapsSelection(view, checkboxFrom, checkboxTo)) {
          builder.add(
            line.from,
            line.from,
            Decoration.line({
              class: checked ? 'cm-live-task-line cm-live-task-line--checked' : 'cm-live-task-line',
            }),
          );
          builder.add(
            checkboxFrom,
            checkboxTo,
            Decoration.replace({
              widget: new TaskCheckboxWidget(checked, checkboxFrom, checkboxTo),
            }),
          );
        }
      }

      if (/^\s*>/.test(line.text) && !isActiveLine) {
        builder.add(
          line.from,
          line.from,
          Decoration.line({
            class: 'cm-live-blockquote',
          }),
        );
      }

      if (looksLikeTableLine(line.text) && !isActiveLine) {
        builder.add(
          line.from,
          line.from,
          Decoration.line({
            class: 'cm-live-table-line',
          }),
        );
      }

      if (line.to >= to) {
        break;
      }

      line = view.state.doc.line(line.number + 1);
    }
  }

  return builder.finish();
}

function buildCodeBlockDecorations(
  view: EditorView,
  builder: RangeSetBuilder<Decoration>,
) {
  for (const block of findFencedCodeBlocksFromText(view.state.doc.toString())) {
    const startLine = view.state.doc.line(block.startLine);
    const endLine = view.state.doc.line(block.endLine);
    const blockFrom = startLine.from;
    const blockTo = endLine.to;
    const isActive = overlapsSelection(view, blockFrom, blockTo) || lineIsActive(view, blockFrom, blockTo);

    if (!isActive) {
      for (let blockLineNumber = block.startLine; blockLineNumber <= block.endLine; blockLineNumber += 1) {
        const blockLine = view.state.doc.line(blockLineNumber);
        if (blockLineNumber === block.startLine) {
          builder.add(
            blockLine.from,
            blockLine.from,
            Decoration.widget({
              side: -1,
              widget: new CodeBlockHeaderWidget(
                block.language,
                block.codeFrom,
                block.codeTo,
              ),
            }),
          );
          builder.add(
            blockLine.from,
            blockLine.to,
            Decoration.mark({
              class: 'cm-live-codeblock-fence',
            }),
          );
          continue;
        }

        if (blockLineNumber === block.endLine) {
          builder.add(
            blockLine.from,
            blockLine.to,
            Decoration.mark({
              class: 'cm-live-codeblock-fence',
            }),
          );
          continue;
        }

        builder.add(
          blockLine.from,
          blockLine.from,
          Decoration.line({
            class: 'cm-live-codeblock cm-live-codeblock--body',
          }),
        );
      }
    }
  }
}

function findFencedCodeBlocksFromText(text: string) {
  const blocks: Array<{
    startLine: number;
    endLine: number;
    language: string;
    codeFrom: number;
    codeTo: number;
  }> = [];
  const lines = text.split('\n');
  let activeStartLine: number | null = null;
  let activeFenceOffset = 0;
  let activeLanguage = '';
  let offset = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const fenceMatch = line.match(/^(```|~~~)\s*([^\s`]*)?.*$/);
    if (!fenceMatch) {
      offset += line.length + 1;
      continue;
    }

    const lineNumber = index + 1;
    if (activeStartLine === null) {
      activeStartLine = lineNumber;
      activeFenceOffset = offset;
      activeLanguage = (fenceMatch[2] ?? '').trim();
      offset += line.length + 1;
      continue;
    }

    blocks.push({
      startLine: activeStartLine,
      endLine: lineNumber,
      language: activeLanguage,
      codeFrom: activeFenceOffset + lines[activeStartLine - 1].length + 1,
      codeTo: offset - 1,
    });
    activeStartLine = null;
    activeFenceOffset = 0;
    activeLanguage = '';
    offset += line.length + 1;
  }

  return blocks;
}

function looksLikeTableLine(text: string) {
  if (!text.includes('|')) {
    return false;
  }

  const trimmed = text.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return false;
  }

  return trimmed.split('|').length >= 4;
}

export function markdownLivePreview(options: MarkdownLivePreviewOptions = {}) {
  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = buildDecorations(view, options);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = buildDecorations(update.view, options);
          }
        }
      },
      {
        decorations: (value) => value.decorations,
      },
    ),
    EditorView.baseTheme({
      '.cm-live-heading': {
        fontWeight: '700',
        color: 'hsl(var(--foreground))',
      },
      '.cm-live-heading-1': {
        fontSize: '1.875rem',
        lineHeight: '2.25rem',
      },
      '.cm-live-heading-2': {
        fontSize: '1.5rem',
        lineHeight: '2rem',
      },
      '.cm-live-heading-3': {
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
      },
      '.cm-live-heading-4': {
        fontSize: '1.125rem',
      },
      '.cm-live-heading-5, .cm-live-heading-6': {
        fontSize: '1rem',
      },
      '.cm-live-heading-marker': {
        opacity: '0.28',
        fontWeight: '500',
      },
      '.cm-md-link-chip': {
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: '0.125rem 0.5rem',
        fontSize: '0.85em',
        lineHeight: '1.4',
        fontWeight: '500',
      },
      '.cm-md-link-chip--wiki': {
        backgroundColor: 'hsl(var(--primary) / 0.12)',
        color: 'hsl(var(--primary))',
      },
      '.cm-md-link-chip--external': {
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--foreground))',
      },
      '.cm-live-task-line': {
        color: 'hsl(var(--foreground))',
      },
      '.cm-live-task-line--checked': {
        color: 'hsl(var(--muted-foreground))',
        textDecoration: 'line-through',
      },
      '.cm-live-task-line--checked .cm-md-task-checkbox': {
        backgroundColor: 'hsl(var(--primary))',
        borderColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
      },
      '.cm-md-task-checkbox': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1rem',
        height: '1rem',
        marginRight: '0.35rem',
        borderRadius: '0.3rem',
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        fontSize: '0.75rem',
        lineHeight: '1',
        verticalAlign: 'text-bottom',
        cursor: 'pointer',
        textDecoration: 'none',
      },
      '.cm-md-task-checkbox.is-checked': {
        backgroundColor: 'hsl(var(--primary))',
        borderColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
      },
      '.cm-md-image-widget': {
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '0.375rem',
        maxWidth: 'min(100%, 32rem)',
        margin: '0.35rem 0',
        padding: '0.5rem',
        borderRadius: '0.75rem',
        backgroundColor: 'hsl(var(--muted) / 0.55)',
        border: '1px solid hsl(var(--border))',
        verticalAlign: 'top',
        cursor: 'zoom-in',
      },
      '.cm-md-image-widget__image': {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '18rem',
        borderRadius: '0.5rem',
        objectFit: 'contain',
      },
      '.cm-md-image-widget__placeholder': {
        minWidth: '12rem',
        minHeight: '6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        color: 'hsl(var(--muted-foreground))',
        backgroundColor: 'hsl(var(--background))',
      },
      '.cm-md-image-widget__caption': {
        fontSize: '0.75rem',
        color: 'hsl(var(--muted-foreground))',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      '.cm-live-codeblock': {
        backgroundColor: 'hsl(var(--muted) / 0.7)',
      },
      '.cm-live-codeblock--body': {
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
      },
      '.cm-live-codeblock-fence': {
        opacity: '0.35',
        fontSize: '0.75rem',
      },
      '.cm-live-codeblock-header': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.35rem 0.75rem',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))',
        borderTopLeftRadius: '0.75rem',
        borderTopRightRadius: '0.75rem',
        borderBottom: '1px solid hsl(var(--border))',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      },
      '.cm-live-codeblock-header__label': {
        fontWeight: '600',
      },
      '.cm-live-codeblock-header__copy': {
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        borderRadius: '9999px',
        padding: '0.1rem 0.55rem',
        cursor: 'pointer',
        textTransform: 'none',
      },
      '.cm-live-blockquote': {
        borderLeft: '3px solid hsl(var(--primary) / 0.35)',
        paddingLeft: '1rem',
        color: 'hsl(var(--muted-foreground))',
        backgroundColor: 'hsl(var(--muted) / 0.22)',
      },
      '.cm-live-table-line': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        backgroundColor: 'hsl(var(--muted) / 0.32)',
      },
    }),
  ];
}

export const __test__ = {
  findFencedCodeBlocksFromText,
};
