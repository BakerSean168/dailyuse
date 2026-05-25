/**
 * Editor Module - Public Exports
 *
 * @module modules/editor
 */

// Composables
export { useEditor } from './composables/useEditor';
export { useAutoSave } from './composables/useAutoSave';
export type { AutoSaveConfig } from './composables/useAutoSave';
export { useMarkdownEditor } from './composables/useMarkdownEditor';
export { useEditorLinkIndex } from './composables/useEditorLinkIndex';
export { useResourceInsertion } from './composables/useResourceInsertion';
export { useResourceReferenceIndex } from './composables/useResourceReferenceIndex';
export { setEditorRuntimeService, getEditorRuntimeService } from './services/editor-service-runtime';
export type { EditorController, EditorOpenFileInput, EditorTab } from './types';

// Components
export * from './components';
