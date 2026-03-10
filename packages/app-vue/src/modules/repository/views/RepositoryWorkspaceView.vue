<!--
  RepositoryWorkspaceView - Obsidian-style workspace layout
  Left: resizable sidebar with mode switcher (Files / Search / Bookmarks)
  Right: TabManager + CodeMirror 6 editor (EditorToolbar + EditorSplitView + EditorPreview) / MediaViewer
-->

<template>
  <div class="flex h-full overflow-hidden bg-background">
    <ResizablePanelGroup direction="horizontal">
      <!-- ─── Left Sidebar ─── -->
      <ResizablePanel
        :default-size="22"
        :min-size="15"
        :max-size="40"
        :collapsed-size="0"
        :collapsible="true"
        @collapse="store.sidebarCollapsed = true"
        @expand="store.sidebarCollapsed = false"
      >
        <aside class="flex h-full flex-col border-r bg-sidebar">
          <!-- Sidebar Header: Mode Switcher -->
          <div class="flex items-center border-b h-10 px-1">
            <TooltipProvider :delay-duration="300">
              <Tooltip v-for="mode in sidebarModes" :key="mode.key">
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :class="{ 'bg-accent': store.sidebarMode === mode.key }"
                    @click="store.setSidebarMode(mode.key)"
                  >
                    <component :is="mode.icon" class="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {{ mode.label }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div class="flex-1" />

            <Button variant="ghost" size="icon" class="h-8 w-8" @click="store.toggleSidebar()">
              <PanelLeftClose class="h-4 w-4" />
            </Button>
          </div>

          <!-- Sidebar Content -->
          <div class="flex-1 overflow-hidden">
            <!-- Files Mode: TypedFileTree -->
            <TypedFileTree
              v-if="store.sidebarMode === 'files'"
              :resources-by-type="resourcesByType"
              :is-loading="isLoading"
              :selected-id="store.currentResource?.id ?? null"
              @create-note="handleCreateNote"
              @import="showImportDialog = true"
              @refresh="handleRefresh"
              @select="handleSelectResource"
              @open="handleOpenResource"
            />

            <!-- Search Mode -->
            <SearchPanel
              v-else-if="store.sidebarMode === 'search'"
              :repository-id="repositoryId || ''"
              :results="searchResults"
              :searching="isSearching"
              :has-searched="hasSearched"
              :total-results="searchTotalResults"
              :total-matches="searchTotalMatches"
              :search-time="searchTime"
              @close="store.setSidebarMode('files')"
              @select="handleSearchSelect"
              @search="handleSearch"
            />

            <!-- Bookmarks Mode -->
            <BookmarksPanel
              v-else-if="store.sidebarMode === 'bookmarks'"
              :bookmarks="store.bookmarks"
              @select="handleBookmarkSelect"
              @rename="handleBookmarkRename"
              @move-up="handleBookmarkMoveUp"
              @move-down="handleBookmarkMoveDown"
              @remove="handleBookmarkRemove"
            />
          </div>
        </aside>
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- ─── Main Content Area ─── -->
      <ResizablePanel :default-size="78">
        <main class="flex h-full flex-col overflow-hidden">
          <!-- Tab Bar -->
          <TabManager
            v-if="openTabs.length > 0"
            :tabs="openTabs"
            :active-tab-id="store.activeTabId"
            @switch-tab="handleSwitchTab"
            @close-tab="handleCloseTab"
            @toggle-pin="handleTogglePin"
            @close-others="handleCloseOthers"
            @close-right="handleCloseRight"
            @close-all="handleCloseAll"
          />

          <!-- Editor / Viewer -->
          <div class="flex-1 overflow-hidden relative">
            <!-- Markdown Editor (CodeMirror 6) -->
            <template v-if="activeResource && isMarkdown(activeResource)">
              <div class="flex flex-col h-full">
                <!-- Toolbar -->
                <EditorToolbar
                  :saving="isSaving"
                  @insert-text="handleInsertText"
                  @wrap-selection="handleWrapSelection"
                  @view-mode-change="handleViewModeChange"
                  @save="handleSaveContent(editorContent)"
                />

                <!-- Split View: Editor + Preview -->
                <EditorSplitView :view-mode="viewMode" class="flex-1">
                  <template #editor>
                    <MarkdownEditor
                      ref="markdownEditorRef"
                      v-model="editorContent"
                      :placeholder="t('repository.workspace.startWriting')"
                      @change="handleEditorChange"
                    />
                  </template>
                  <template #preview>
                    <EditorPreview :content="editorContent" @link-click="handleInternalLinkClick" />
                  </template>
                </EditorSplitView>

                <!-- Status Bar -->
                <div
                  class="flex items-center justify-end gap-3 px-4 py-1 border-t text-xs text-muted-foreground"
                >
                  <span v-if="isSaving" class="flex items-center gap-1 text-warning">
                    <Loader2 class="h-3 w-3 animate-spin" />
                    {{ t('repository.workspace.saving') }}
                  </span>
                  <span v-else-if="isDirty" class="text-muted-foreground">{{
                    t('repository.workspace.unsaved')
                  }}</span>
                  <span v-else class="text-success">{{ t('repository.workspace.saved') }}</span>
                  <span class="text-muted-foreground"
                    >{{ editorWordCount }} {{ t('repository.workspace.chars') }}</span
                  >
                </div>
              </div>
            </template>

            <!-- Media Viewer (images, video, audio) -->
            <MediaViewer
              v-else-if="activeResource && getMediaType(activeResource)"
              :file-path="activeResource.path || ''"
              :file-type="getMediaType(activeResource)!"
              :file-name="activeResource.name"
            />

            <!-- Other non-markdown, non-media files -->
            <div
              v-else-if="activeResource"
              class="flex flex-col items-center justify-center h-full gap-4"
            >
              <component
                :is="getResourceIcon(activeResource)"
                class="h-16 w-16 text-muted-foreground/50"
              />
              <div class="text-center">
                <h3 class="text-lg font-medium">
                  {{ activeResource.displayName || activeResource.name }}
                </h3>
                <p class="text-sm text-muted-foreground mt-1">{{ activeResource.mimeType }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ activeResource.formattedSize }}</p>
              </div>
            </div>

            <!-- Empty State (no file selected) -->
            <div
              v-else
              class="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
            >
              <div class="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <BookOpen class="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 class="text-lg font-medium">{{ t('repository.workspace.selectFile') }}</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ t('repository.workspace.selectFileDesc') }}
                </p>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="handleCreateNote">
                  <FilePlus class="h-4 w-4 mr-2" />
                  {{ t('repository.workspace.createNote') }}
                </Button>
                <Button variant="outline" size="sm" @click="showImportDialog = true">
                  <Upload class="h-4 w-4 mr-2" />
                  {{ t('repository.import.title') }}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Batch Import Dialog -->
    <BatchImportDialog v-model:open="showImportDialog" @import="handleBatchImport" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
  BookOpen,
  FilePlus,
  Upload,
  FolderTree,
  Search,
  Bookmark,
  PanelLeftClose,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Loader2,
} from 'lucide-vue-next';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dailyuse/ui-vue-shadcn';
import { useRepositoryStore } from '../stores/repositoryStore';
import { useRepository } from '../composables/useRepository';
import TypedFileTree from '../components/TypedFileTree.vue';
import SearchPanel from '../components/SearchPanel.vue';
import BookmarksPanel from '../components/BookmarksPanel.vue';
import TabManager from '../components/TabManager.vue';
import type { ResourceTab } from '../components/TabManager.vue';
import BatchImportDialog from '../components/BatchImportDialog.vue';

// Editor module components (CodeMirror 6)
import MarkdownEditor from '../../editor/components/MarkdownEditor.vue';
import EditorToolbar from '../../editor/components/EditorToolbar.vue';
import EditorSplitView from '../../editor/components/EditorSplitView.vue';
import EditorPreview from '../../editor/components/EditorPreview.vue';
import MediaViewer from '../../editor/components/MediaViewer.vue';

import type {
  ResourceClientDTO,
  SearchResultItem,
  SearchMode,
  ResourceBookmarkClientDTO,
} from '@dailyuse/contracts/repository';

const props = withDefaults(
  defineProps<{
    initialSidebarMode?: 'files' | 'search' | 'bookmarks';
  }>(),
  {
    initialSidebarMode: 'files',
  },
);

const { t } = useI18n();
const store = useRepositoryStore();
const {
  repositoryId,
  resourcesByType,
  currentResource,
  isLoading,
  isSaving,
  initRepository,
  fetchResources,
  createResource,
  deleteResource,
  saveResourceContent,
  openResource,
} = useRepository();

// ── Local state ──
const showImportDialog = ref(false);
const isDirty = ref(false);
const pinnedTabIds = ref(new Set<string>());

// Editor state
const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const editorContent = ref('');
const viewMode = ref<'edit' | 'split' | 'preview'>('split');

// Search state
const searchResults = ref<SearchResultItem[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const searchTotalResults = ref(0);
const searchTotalMatches = ref(0);
const searchTime = ref(0);

// ── Sidebar mode config ──
const sidebarModes = computed(() => [
  { key: 'files' as const, label: t('repository.sidebar.files'), icon: FolderTree },
  { key: 'search' as const, label: t('repository.sidebar.search'), icon: Search },
  { key: 'bookmarks' as const, label: t('repository.sidebar.bookmarks'), icon: Bookmark },
]);

// ── Active resource ──
const activeResource = computed(() => {
  if (!store.activeTabId) return null;
  return store.resources.find((r) => r.id === store.activeTabId) ?? null;
});

// ── Tabs ──
const openTabs = computed<ResourceTab[]>(
  () =>
    store.openTabIds
      .map((id) => {
        const resource = store.resources.find((r) => r.id === id);
        if (!resource) return null;
        return {
          id: resource.id,
          name: resource.name,
          icon: getResourceIcon(resource),
          isDirty: isDirty.value && store.activeTabId === resource.id,
          isPinned: pinnedTabIds.value.has(resource.id),
        };
      })
      .filter(Boolean) as ResourceTab[],
);

// ── Lifecycle ──
onMounted(async () => {
  store.setSidebarMode(props.initialSidebarMode);
  await initRepository();
  if (repositoryId.value) {
    await fetchResources();
  }
});

// ── File operations ──
function handleSelectResource(resource: ResourceClientDTO) {
  store.setCurrentResource(resource);
}

function handleOpenResource(resource: ResourceClientDTO) {
  openResource(resource);
}

function handleCreateNote() {
  // TODO: Show create note dialog or inline create
  toast.info('创建笔记 — 功能待实现');
}

function handleRefresh() {
  if (repositoryId.value) {
    fetchResources();
  }
}

// ── Save ──
function handleSaveContent(content: string) {
  if (!store.activeTabId) return;
  isDirty.value = false;
  saveResourceContent(store.activeTabId, content);
}

// ── Editor toolbar handlers ──
function handleInsertText(text: string) {
  markdownEditorRef.value?.insertText(text);
}

function handleWrapSelection(prefix: string, suffix: string) {
  markdownEditorRef.value?.wrapSelection(prefix, suffix);
}

function handleViewModeChange(mode: 'edit' | 'split' | 'preview') {
  viewMode.value = mode;
}

function handleEditorChange(content: string) {
  isDirty.value = true;
  editorContent.value = content;
}

function handleInternalLinkClick(title: string) {
  // Find a resource matching the wiki-link title
  const resource = store.resources.find(
    (r) => r.name === title || r.name === `${title}.md` || r.displayName === title,
  );
  if (resource) {
    openResource(resource);
  } else {
    toast.info(`${t('repository.workspace.linkNotFound')}: ${title}`);
  }
}

// ── Word count ──
const editorWordCount = computed(() => {
  const text = editorContent.value || '';
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
});

// ── Sync editor content when active resource changes ──
watch(activeResource, (resource) => {
  if (resource) {
    editorContent.value = resource.content || '';
    isDirty.value = false;
  }
});

// ── Tabs ──
function handleSwitchTab(id: string) {
  store.setActiveTab(id);
  const resource = store.resources.find((r) => r.id === id);
  if (resource) store.setCurrentResource(resource);
}

function handleCloseTab(id: string) {
  store.closeTab(id);
}

function handleTogglePin(id: string) {
  if (pinnedTabIds.value.has(id)) {
    pinnedTabIds.value.delete(id);
  } else {
    pinnedTabIds.value.add(id);
  }
}

function handleCloseOthers(id: string) {
  store.closeOtherTabs(id);
}

function handleCloseRight(id: string) {
  store.closeTabsToRight(id);
}

function handleCloseAll() {
  store.closeAllTabs();
  store.setCurrentResource(null);
}

// ── Search ──
function handleSearch(
  query: string,
  mode: SearchMode,
  options: { caseSensitive: boolean; useRegex: boolean },
) {
  isSearching.value = true;
  hasSearched.value = true;
  // TODO: Call search service
  setTimeout(() => {
    searchResults.value = [];
    searchTotalResults.value = 0;
    searchTotalMatches.value = 0;
    searchTime.value = 0;
    isSearching.value = false;
  }, 300);
}

function handleSearchSelect(result: SearchResultItem) {
  const resource = store.resources.find((r) => r.id === result.resourceId);
  if (resource) {
    openResource(resource);
  }
}

// ── Bookmarks ──
function handleBookmarkSelect(bookmark: ResourceBookmarkClientDTO) {
  const resource = store.resources.find((r) => r.id === bookmark.resourceId);
  if (resource) {
    openResource(resource);
  }
}

function handleBookmarkRename(bookmark: ResourceBookmarkClientDTO) {
  // TODO: Implement rename
  toast.info('重命名书签 — 功能待实现');
}

function handleBookmarkMoveUp(bookmark: ResourceBookmarkClientDTO) {
  const idx = store.bookmarks.findIndex((b) => b.id === bookmark.id);
  if (idx > 0) {
    const items = [...store.bookmarks];
    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
    store.setBookmarks(items);
  }
}

function handleBookmarkMoveDown(bookmark: ResourceBookmarkClientDTO) {
  const idx = store.bookmarks.findIndex((b) => b.id === bookmark.id);
  if (idx >= 0 && idx < store.bookmarks.length - 1) {
    const items = [...store.bookmarks];
    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
    store.setBookmarks(items);
  }
}

function handleBookmarkRemove(bookmark: ResourceBookmarkClientDTO) {
  store.removeBookmark(bookmark.id);
}

// ── Import ──
function handleBatchImport(files: File[], tags: string[]) {
  // TODO: Call upload service
  toast.info(`导入 ${files.length} 个文件，标签: ${tags.join(', ') || '无'} — 上传功能待实现`);
  showImportDialog.value = false;
}

// ── Helpers ──
function isMarkdown(resource: ResourceClientDTO): boolean {
  return (
    resource.mimeType?.startsWith('text/markdown') ||
    resource.extension === '.md' ||
    resource.name?.endsWith('.md') ||
    false
  );
}

function getMediaType(resource: ResourceClientDTO): 'image' | 'video' | 'audio' | null {
  const mime = resource.mimeType || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return null;
}

function getResourceIcon(resource: ResourceClientDTO) {
  const mime = resource.mimeType || '';
  const ext = resource.extension || '';
  if (mime.startsWith('text/markdown') || ext === '.md') return FileText;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('video/')) return FileVideo;
  if (mime.startsWith('audio/')) return FileAudio;
  return File;
}
</script>
