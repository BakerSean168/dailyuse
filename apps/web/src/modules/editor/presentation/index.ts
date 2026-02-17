/**
 * Editor 模块导出
 */

// 组件（从 ui-vue-shadcn 重新导出）
export {
  EditorContainer,
  EditorTabBar,
  MarkdownEditor,
  MediaViewer,
  EditorToolbar,
  BacklinkPanel,
  EditorPreview,
  EditorSplitView,
  LinkGraphView,
  LinkSuggestion,
  type EditorTab
} from '@dailyuse/ui-vue-shadcn';

// Composable
export { useEditor } from './composables/useEditor';
