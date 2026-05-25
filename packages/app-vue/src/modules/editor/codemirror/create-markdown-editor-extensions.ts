import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  placeholder,
  type ViewUpdate,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { markdownLivePreview } from './markdown-live-preview';

export type MarkdownEditorViewMode = 'source' | 'live';

export interface CreateMarkdownEditorExtensionsOptions {
  placeholderText?: string;
  readonly?: boolean;
  viewMode?: MarkdownEditorViewMode;
  imageSources?: ReadonlyMap<string, string>;
  onUpdate?: (update: ViewUpdate) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
}

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.875rem', fontWeight: '700' },
  { tag: tags.heading2, fontSize: '1.5rem', fontWeight: '700' },
  { tag: tags.heading3, fontSize: '1.25rem', fontWeight: '700' },
  { tag: tags.heading4, fontWeight: '700' },
  { tag: [tags.heading5, tags.heading6], fontWeight: '600' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: 'hsl(var(--primary))', textDecoration: 'underline' },
  { tag: [tags.url, tags.escape, tags.string], color: 'hsl(var(--primary))' },
  { tag: [tags.monospace, tags.processingInstruction], color: 'hsl(var(--foreground))' },
  { tag: [tags.quote, tags.comment], color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
  { tag: [tags.atom, tags.bool, tags.number], color: 'hsl(var(--chart-2))' },
  { tag: [tags.list, tags.separator], color: 'hsl(var(--muted-foreground))' },
]);

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'hsl(var(--foreground))',
    backgroundColor: 'hsl(var(--background))',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily:
      '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", serif',
    fontSize: '1rem',
    lineHeight: '1.75',
  },
  '.cm-content': {
    minHeight: '100%',
    maxWidth: '46rem',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
    caretColor: 'hsl(var(--foreground))',
  },
  '.cm-line': {
    padding: '0 0.125rem',
    borderRadius: '0.375rem',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'hsl(var(--muted) / 0.35)',
  },
  '&.cm-focused .cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'hsl(var(--foreground))',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'hsl(var(--primary) / 0.24)',
  },
  '.cm-placeholder': {
    color: 'hsl(var(--muted-foreground))',
    fontStyle: 'italic',
  },
  '.cm-tooltip': {
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
  },
});

export function createMarkdownEditorExtensions(options: CreateMarkdownEditorExtensionsOptions) {
  const livePreviewCompartment = new Compartment();

  const extensions: Extension[] = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    EditorState.allowMultipleSelections.of(true),
    EditorView.lineWrapping,
    highlightActiveLine(),
    markdown(),
    syntaxHighlighting(markdownHighlightStyle),
    editorTheme,
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged || update.selectionSet) {
        options.onUpdate?.(update);
      }
    }),
    EditorView.domEventHandlers({
      keydown: (event) => {
        options.onKeydown?.(event as KeyboardEvent);
        return false;
      },
      paste: (event) => {
        options.onPaste?.(event as ClipboardEvent);
        return false;
      },
      click: (event) => {
        options.onClick?.(event as MouseEvent);
        return false;
      },
    }),
    livePreviewCompartment.of(
      options.viewMode === 'live'
        ? markdownLivePreview({ imageSources: options.imageSources })
        : [],
    ),
  ];

  if (options.placeholderText) {
    extensions.push(placeholder(options.placeholderText));
  }

  if (options.readonly) {
    extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  }

  return {
    extensions,
    livePreviewCompartment,
  };
}
