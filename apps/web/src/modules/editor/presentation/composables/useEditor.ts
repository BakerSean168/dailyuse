/**
 * useEditor Composable
 * 编辑器状态管理
 */

import { ref, computed } from 'vue';
// import type { EditorTab } from '../components/EditorTabBar.vue';
type EditorTab = any; // TODO: Define proper type

/**
 * 编辑器实例引用
 */
const editorInstanceRef = ref<any>(null);

/**
 * useEditor
 */
export function useEditor() {
  /**
   * 设置编辑器实例
   */
  function setEditorInstance(instance: any) {
    editorInstanceRef.value = instance;
  }

  /**
   * 打开文件
   */
  function openFile(file: {
    id?: string;
    title: string;
    fileType: 'markdown' | 'image' | 'video' | 'audio';
    filePath: string;
    content?: string;
  }) {
    if (!editorInstanceRef.value) {
      console.warn('Editor instance not initialized');
      return null;
    }
    return editorInstanceRef.value.openFile(file);
  }

  /**
   * 关闭文件
   */
  function closeFile(tabId: string) {
    if (!editorInstanceRef.value) return;
    editorInstanceRef.value.closeTab(tabId);
  }

  /**
   * 关闭所有文件
   */
  function closeAllFiles() {
    if (!editorInstanceRef.value) return;
    editorInstanceRef.value.closeAllTabs();
  }

  /**
   * 保存当前文件
   */
  function saveCurrentFile() {
    if (!editorInstanceRef.value) return;
    editorInstanceRef.value.saveCurrentFile();
  }

  /**
   * 保存所有文件
   */
  function saveAllFiles() {
    if (!editorInstanceRef.value) return;
    editorInstanceRef.value.saveAllFiles();
  }

  /**
   * 获取当前打开的标签页
   */
  const openTabs = computed<EditorTab[]>(() => {
    if (!editorInstanceRef.value) return [];
    return editorInstanceRef.value.tabs || [];
  });

  /**
   * 获取当前激活的标签
   */
  const activeTab = computed<EditorTab | null>(() => {
    if (!editorInstanceRef.value) return null;
    return editorInstanceRef.value.activeTab || null;
  });

  /**
   * 是否有未保存的更改
   */
  const hasUnsavedChanges = computed(() => {
    return openTabs.value.some((tab) => tab.isDirty);
  });

  return {
    setEditorInstance,
    openFile,
    closeFile,
    closeAllFiles,
    saveCurrentFile,
    saveAllFiles,
    openTabs,
    activeTab,
    hasUnsavedChanges,
  };
}
