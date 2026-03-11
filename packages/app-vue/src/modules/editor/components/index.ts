export { default as EditorToolbar } from './EditorToolbar.vue';
export { default as BacklinkPanel } from './BacklinkPanel.vue';
export { default as BrokenResourceDiagnostics } from './BrokenResourceDiagnostics.vue';
export { default as EditorContainer } from './EditorContainer.vue';
export { default as EditorPreview } from './EditorPreview.vue';
export { default as ReferenceRepairDialog } from './ReferenceRepairDialog.vue';
export { default as EditorSplitView } from './EditorSplitView.vue';
export { default as EditorTabBar } from './EditorTabBar.vue';
export { default as ImageResourcePickerDialog } from './ImageResourcePickerDialog.vue';
export { default as LinkGraphView } from './LinkGraphView.vue';
export { default as LinkSuggestion } from './LinkSuggestion.vue';
export { default as MarkdownEditor } from './MarkdownEditor.vue';
export { default as MediaViewer } from './MediaViewer.vue';
export { default as ResourcePickerDialog } from './ResourcePickerDialog.vue';
export { default as SelfContainedExportDialog } from './SelfContainedExportDialog.vue';

// Re-export the EditorTab type directly from contracts (avoids tsc's
// inability to resolve named type exports from .vue SFC files).
export type { EditorController, EditorOpenFileInput, EditorTab } from '../types';
