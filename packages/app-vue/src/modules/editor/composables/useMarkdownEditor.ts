/**
 * useMarkdownEditor Composable
 * 
 * Presentation Layer - Composable
 * Markdown 编辑器状态管理和操作方法
 */

import { ref, computed, type Ref } from 'vue';
import type { EditorView } from '@codemirror/view';

export function useMarkdownEditor(initialContent = '') {
  // ==================== State ====================
  const content = ref(initialContent);
  const hasUnsavedChanges = ref(false);
  const editorViewRef: Ref<EditorView | null> = ref(null);

  // ==================== Computed ====================
  const wordCount = computed(() => {
    return content.value.trim().split(/\s+/).length;
  });

  const characterCount = computed(() => {
    return content.value.length;
  });

  const lineCount = computed(() => {
    return content.value.split('\n').length;
  });

  // ==================== Methods ====================
  function setEditorView(view: EditorView) {
    editorViewRef.value = view;
  }

  function updateContent(newContent: string) {
    content.value = newContent;
    hasUnsavedChanges.value = true;
  }

  function insertText(text: string) {
    if (!editorViewRef.value) return;

    const { state } = editorViewRef.value;
    const { from, to } = state.selection.main;

    editorViewRef.value.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });

    editorViewRef.value.focus();
  }

  function wrapSelection(prefix: string, suffix: string) {
    if (!editorViewRef.value) return;

    const { state } = editorViewRef.value;
    const { from, to } = state.selection.main;
    const selectedText = state.doc.sliceString(from, to);
    const wrappedText = `${prefix}${selectedText}${suffix}`;

    editorViewRef.value.dispatch({
      changes: { from, to, insert: wrappedText },
      selection: {
        anchor: from + prefix.length,
        head: from + prefix.length + selectedText.length,
      },
    });

    editorViewRef.value.focus();
  }

  function formatText(format: string) {
    switch (format) {
      case 'bold':
        wrapSelection('**', '**');
        break;
      case 'italic':
        wrapSelection('*', '*');
        break;
      case 'strikethrough':
        wrapSelection('~~', '~~');
        break;
      case 'code':
        wrapSelection('`', '`');
        break;
      default:
        console.warn(`Unknown format: ${format}`);
    }
  }

  function insertHeading(level: number) {
    const prefix = '#'.repeat(level) + ' ';
    insertText(prefix);
  }

  function insertBold() {
    wrapSelection('**', '**');
  }

  function insertItalic() {
    wrapSelection('*', '*');
  }

  function insertStrikethrough() {
    wrapSelection('~~', '~~');
  }

  function insertCode() {
    wrapSelection('`', '`');
  }

  function insertCodeBlock(language = '') {
    const codeBlock = `\n\`\`\`${language}\n\n\`\`\`\n`;
    insertText(codeBlock);
  }

  function insertLink() {
    wrapSelection('[', '](url)');
  }

  function insertImage() {
    wrapSelection('![', '](url)');
  }

  function insertUnorderedList() {
    insertText('\n- ');
  }

  function insertOrderedList() {
    insertText('\n1. ');
  }

  function insertTaskList() {
    insertText('\n- [ ] ');
  }

  function insertQuote() {
    insertText('\n> ');
  }

  function insertDivider() {
    insertText('\n\n---\n\n');
  }

  function insertTable(rows = 2, cols = 3) {
    const headerRow = `| ${Array(cols).fill('列').map((col, i) => `${col}${i + 1}`).join(' | ')} |`;
    const separatorRow = `|${Array(cols).fill('-----').join('|')}|`;
    const dataRows = Array(rows - 1)
      .fill(null)
      .map(() => `| ${Array(cols).fill('内容').join(' | ')} |`)
      .join('\n');

    const table = `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;
    insertText(table);
  }

  function undo() {
    // CodeMirror 的 undo 通过快捷键处理
    console.log('Undo via keyboard shortcut (Ctrl+Z)');
  }

  function redo() {
    // CodeMirror 的 redo 通过快捷键处理
    console.log('Redo via keyboard shortcut (Ctrl+Y)');
  }

  function resetUnsavedChanges() {
    hasUnsavedChanges.value = false;
  }

  function clear() {
    content.value = '';
    hasUnsavedChanges.value = false;
  }

  // ==================== Return ====================
  return {
    // State
    content,
    hasUnsavedChanges,
    editorViewRef,

    // Computed
    wordCount,
    characterCount,
    lineCount,

    // Methods
    setEditorView,
    updateContent,
    insertText,
    wrapSelection,
    formatText,
    undo,
    redo,
    resetUnsavedChanges,
    clear,

    // Toolbar operations
    insertHeading,
    insertBold,
    insertItalic,
    insertStrikethrough,
    insertCode,
    insertCodeBlock,
    insertLink,
    insertImage,
    insertUnorderedList,
    insertOrderedList,
    insertTaskList,
    insertQuote,
    insertDivider,
    insertTable,
  };
}
