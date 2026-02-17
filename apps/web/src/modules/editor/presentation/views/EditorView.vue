<!--
  EditorView - Markdown Editor Integration View
  
  Presentation Layer - View
  集成所有编辑器组件的完整示例视图
-->
<template>
  <v-container fluid class="editor-view pa-0">
    <v-card class="editor-card" elevation="0">
      <!-- 工具栏 -->
      <EditorToolbar
        :view-mode="viewMode"
        :is-saving="isSaving"
        :save-status="saveStatus"
        @insert-text="handleInsertText"
        @wrap-selection="handleWrapSelection"
        @view-mode-change="handleViewModeChange"
        @save="handleSave"
      >
        <!-- 添加链接图谱按钮 -->
        <template #append>
          <v-btn
            v-if="documentUuid"
            icon
            size="small"
            variant="text"
            @click="handleOpenLinkGraph"
            title="链接图谱"
          >
            <v-icon>mdi-graph-outline</v-icon>
          </v-btn>
        </template>
      </EditorToolbar>

      <!-- 三栏布局：编辑器 + 预览 + 反向链接面板 -->
      <v-row no-gutters class="editor-content-row">
        <!-- 左侧：编辑器 -->
        <v-col :cols="documentUuid ? 5 : 6" class="editor-col">
          <div class="editor-container">
            <MarkdownEditor
              ref="editorRef"
              v-model="content"
              :dark-mode="isDarkMode"
              @update:model-value="handleContentChange"
              @editor-ready="handleEditorReady"
              @trigger-suggestion="handleTriggerSuggestion"
            />
            
            <!-- 链接建议下拉框 -->
            <LinkSuggestion
              :visible="showSuggestion"
              :search-query="searchQuery"
              :position="suggestionPosition"
              @select="handleLinkSelect"
              @close="showSuggestion = false"
              @create-new="handleCreateNewDocument"
            />
          </div>
        </v-col>

        <!-- 中间：预览 -->
        <v-col :cols="documentUuid ? 4 : 6" class="preview-col">
          <div class="preview-container">
            <EditorPreview 
              :content="content" 
              :dark-mode="isDarkMode"
              @link-click="handleLinkClick"
            />
          </div>
        </v-col>

        <!-- 右侧：反向链接面板（仅在有文档UUID时显示） -->
        <v-col v-if="documentUuid" cols="3" class="backlink-col">
          <BacklinkPanel
            ref="backlinkPanelRef"
            :document-uuid="documentUuid"
            @navigate="navigateToDocument"
          />
        </v-col>
      </v-row>

      <!-- 状态栏 -->
      <v-divider />
      <div class="status-bar">
        <div class="status-left">
          <v-chip size="x-small" variant="text">
            字数: {{ wordCount }}
          </v-chip>
          <v-chip size="x-small" variant="text">
            字符: {{ characterCount }}
          </v-chip>
          <v-chip size="x-small" variant="text">
            行数: {{ lineCount }}
          </v-chip>
        </div>
        <div class="status-right">
          <v-chip v-if="hasUnsavedChanges" size="x-small" color="warning" variant="text">
            未保存
          </v-chip>
          <v-chip v-if="lastSaved" size="x-small" variant="text">
            上次保存: {{ formatLastSaved }}
          </v-chip>
          <v-chip v-if="autoSaveEnabled" size="x-small" color="success" variant="text">
            自动保存已启用
          </v-chip>
        </div>
      </div>
    </v-card>

    <!-- 冲突提示对话框 -->
    <v-dialog v-model="showConflictDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">编辑冲突</v-card-title>
        <v-card-text>
          检测到其他用户正在编辑此文档，您的更改可能会覆盖他们的内容。请刷新页面查看最新版本。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showConflictDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleRefresh">刷新页面</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 链接图谱对话框 -->
    <v-dialog v-model="showLinkGraph" fullscreen transition="dialog-bottom-transition">
      <LinkGraphView
        v-if="documentUuid && showLinkGraph"
        :document-uuid="documentUuid"
        @close="showLinkGraph = false"
        @node-click="handleGraphNodeClick"
      />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';
import {
  MarkdownEditor,
  EditorToolbar,
  EditorPreview,
  EditorSplitView,
  LinkSuggestion,
  BacklinkPanel,
  LinkGraphView
} from '@dailyuse/ui-vue-shadcn';
import { useMarkdownEditor } from '../composables/useMarkdownEditor';
import { useAutoSave } from '../composables/useAutoSave';
// TODO: Document API 已移除，双向链接功能待迁移到 repository 模块
// import { documentApiClient } from '@/modules/document/api/DocumentApiClient';
// import type { DocumentContracts } from '@dailyuse/contracts/document';

// ==================== Props ====================
interface Props {
  /** 文档 UUID（用于保存） */
  documentUuid?: string;
  /** 初始内容 */
  initialContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  documentUuid: '',
  initialContent: '',
});

// ==================== Emits ====================
const emit = defineEmits<{
  'save': [content: string];
  'content-change': [content: string];
}>();

// ==================== Composables ====================
const theme = useTheme();
const {
  content,
  hasUnsavedChanges,
  editorViewRef,
  wordCount,
  characterCount,
  lineCount,
  setEditorView,
  updateContent,
  insertText,
  wrapSelection,
  resetUnsavedChanges,
} = useMarkdownEditor(props.initialContent);

const {
  isSaving,
  lastSaved,
  saveStatus,
  autoSaveEnabled,
  saveError,
  save,
  startAutoSave,
  stopAutoSave,
} = useAutoSave({
  interval: 30000, // 30 秒自动保存
  saveFn: async (content: string) => {
    emit('save', content);
    // 模拟保存逻辑，实际应调用 API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, conflict: false };
  },
  content: () => content.value,
  hasChanges: () => hasUnsavedChanges.value,
});

// ==================== State ====================
const router = useRouter();
const viewMode = ref<'edit' | 'preview' | 'split'>('split');
const showConflictDialog = ref(false);

// Bidirectional Links State
const showSuggestion = ref(false);
const searchQuery = ref('');
const suggestionPosition = ref({ x: 0, y: 0 });
const showLinkGraph = ref(false);
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const backlinkPanelRef = ref<InstanceType<typeof BacklinkPanel> | null>(null);

// ==================== Computed ====================
const isDarkMode = computed(() => theme.global.current.value.dark);

const formatLastSaved = computed(() => {
  if (!lastSaved.value) return '';
  const now = new Date();
  const diff = now.getTime() - lastSaved.value.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
});

// ==================== Methods ====================
function handleEditorReady(view: any) {
  setEditorView(view);
}

function handleContentChange(newContent: string) {
  updateContent(newContent);
  emit('content-change', newContent);
}

function handleInsertText(text: string) {
  insertText(text);
}

function handleWrapSelection(prefix: string, suffix: string) {
  wrapSelection(prefix, suffix);
}

function handleViewModeChange(mode: 'edit' | 'preview' | 'split') {
  viewMode.value = mode;
}

function handleSplitPositionChange(position: number) {
  console.log('Split position changed:', position);
}

async function handleSave() {
  const success = await save();
  if (success) {
    resetUnsavedChanges();
  }
}

function handleRefresh() {
  window.location.reload();
}

// ==================== Bidirectional Links Methods ====================
function handleTriggerSuggestion(position: { x: number; y: number; query: string }) {
  suggestionPosition.value = { x: position.x, y: position.y };
  searchQuery.value = position.query;
  showSuggestion.value = true;
}

// TODO: 双向链接功能待迁移到 repository 模块，暂用 any 类型
function handleLinkSelect(document: { name: string } | null) {
  if (!document || !editorRef.value) return;
  
  // Insert [[name]] at cursor position
  const linkText = `[[${document.name}]]`;
  editorRef.value.insertTextAtCursor(linkText);
  
  showSuggestion.value = false;
  searchQuery.value = '';
}

function handleCreateNewDocument(title: string) {
  // TODO: Implement create new document logic
  console.log('Create new document:', title);
  
  // For now, just insert the link
  if (!editorRef.value) return;
  const linkText = `[[${title}]]`;
  editorRef.value.insertTextAtCursor(linkText);
  
  showSuggestion.value = false;
  searchQuery.value = '';
}

function handleLinkClick(title: string) {
  // Navigate to document by title
  navigateByTitle(title);
}

async function navigateByTitle(title: string) {
  // TODO: 双向链接功能待迁移到 repository 模块
  console.warn('Document navigation not implemented:', title);
  // try {
  //   // Search for document by exact title
  //   const results = await documentApiClient.searchDocuments(title, 1);
  //   if (results.length > 0) {
  //     navigateToDocument(results[0].uuid);
  //   } else {
  //     console.warn('Document not found:', title);
  //   }
  // } catch (error) {
  //   console.error('Error navigating to document:', error);
  // }
}

function navigateToDocument(uuid: string) {
  router.push({ name: 'editor', params: { id: uuid } });
}

function handleOpenLinkGraph() {
  showLinkGraph.value = true;
}

function handleGraphNodeClick(nodeUuid: string) {
  showLinkGraph.value = false;
  navigateToDocument(nodeUuid);
}

// ==================== Watchers ====================
watch(saveStatus, (status) => {
  if (status === 'conflict') {
    showConflictDialog.value = true;
  }
});

// ==================== Lifecycle ====================
// 启动自动保存
startAutoSave();
</script>

<style scoped>
.editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-content-row {
  flex: 1;
  overflow: hidden;
}

.editor-col,
.preview-col,
.backlink-col {
  height: calc(100vh - 120px);
  overflow: hidden;
  border-right: 1px solid #e0e0e0;
}

.backlink-col {
  border-right: none;
}

.editor-container,
.preview-container {
  height: 100%;
  overflow: auto;
  padding: 16px;
  position: relative;
}

/* 暗色模式边框 */
:deep(.v-theme--dark) .editor-col,
:deep(.v-theme--dark) .preview-col {
  border-right-color: #424242;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  background-color: #f5f5f5;
  min-height: 32px;
}

.status-left,
.status-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 暗色模式 */
:deep(.v-theme--dark) .status-bar {
  background-color: #1e1e1e;
}
</style>
