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
              :tree-nodes="treeNodes"
              :is-loading="isLoading"
              :selected-id="editorWorkspaceStore.activeResourceId"
              @create-note="handleCreateNote"
              @import="showImportDialog = true"
              @refresh="handleRefresh"
              @select="handleSelectResource"
              @open="handleOpenResource"
              @rename="handleRenameResource"
              @delete="handleDeleteResourceFromTree"
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
              :bookmarks="bookmarks"
              :can-rename="bookmarkCapabilities.canRename"
              :can-reorder="bookmarkCapabilities.canReorder"
              :can-remove="bookmarkCapabilities.canRemove"
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
      <ResizablePanel :default-size="resourceDetailOpen ? 58 : 78">
        <main class="flex h-full flex-col overflow-hidden">
          <!-- Tab Bar -->
          <TabManager
            v-if="openTabs.length > 0"
            :tabs="openTabs"
            :active-tab-id="editorWorkspaceStore.activeTabId"
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
                  @insert-resource="showResourcePicker = true"
                  @insert-existing-image="showImagePicker = true"
                  @export-self-contained="handleExportSelfContained"
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
                      @paste-files="handlePasteFiles"
                    />
                  </template>
                  <template #preview>
                    <EditorPreview
                      :content="editorContent"
                      :broken-resource-references="activeBrokenReferences"
                      @link-click="handleInternalLinkClick"
                    />
                  </template>
                </EditorSplitView>

                <div class="border-t p-4">
                  <BrokenResourceDiagnostics
                    :diagnostics="activeBrokenDiagnostics"
                    @repair="handleRepairReference"
                  />
                </div>

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
              v-else-if="!repositoryId && !isLoading"
              class="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
            >
              <div class="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <BookOpen class="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 class="text-lg font-medium">{{ t('repository.workspace.noRepository') }}</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ t('repository.workspace.noRepositoryDesc') }}
                </p>
              </div>
            </div>

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

      <template v-if="resourceDetailOpen">
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="20" :min-size="18" :max-size="32">
          <ResourceDetailPanel
            :resource="activeResource"
            :inbound-references="activeInboundReferences"
            @navigate-note="handleNavigateToNote"
            @delete-resource="handleDeleteResource"
          />
        </ResizablePanel>
      </template>
    </ResizablePanelGroup>

    <!-- Batch Import Dialog -->
    <BatchImportDialog
      v-model:open="showImportDialog"
      :importing="isUploading"
      :progress="uploadProgress"
      :summary="importSummary"
      @import="handleBatchImport"
    />

    <ImageResourcePickerDialog
      v-model:open="showImagePicker"
      :resources="imageResources"
      :recent-resources="recentImageResources"
      @select="handleInsertExistingImage"
    />

    <ResourcePickerDialog
      v-model:open="showResourcePicker"
      :items="resourceItems"
      :recent-items="recentResourceItems"
      @select="handleInsertResource"
    />

    <SelfContainedExportDialog
      v-model:open="showExportDialog"
      :result="exportResult"
      @copy="handleCopyExport"
      @download="handleDownloadExport"
    />

    <ReferenceRepairDialog
      v-model:open="showRepairDialog"
      :reference="pendingRepairReference"
      :candidates="repairCandidates"
      @select="applyRepairCandidate"
    />

    <Dialog v-model:open="renameDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('repository.resourceDetails.renameTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('repository.resourceDetails.renameDescription') }}
          </DialogDescription>
        </DialogHeader>

        <Input
          v-model="renameValue"
          :placeholder="t('repository.resourceDetails.renamePlaceholder')"
          @keyup.enter="confirmRenameResource"
        />

        <DialogFooter>
          <Button variant="outline" @click="renameDialogOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button :disabled="renameSaveDisabled" @click="confirmRenameResource">{{
            t('common.save')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useConfirm,
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
import BrokenResourceDiagnostics from '../../editor/components/BrokenResourceDiagnostics.vue';
import EditorToolbar from '../../editor/components/EditorToolbar.vue';
import EditorSplitView from '../../editor/components/EditorSplitView.vue';
import EditorPreview from '../../editor/components/EditorPreview.vue';
import ImageResourcePickerDialog from '../../editor/components/ImageResourcePickerDialog.vue';
import ReferenceRepairDialog from '../../editor/components/ReferenceRepairDialog.vue';
import ResourcePickerDialog from '../../editor/components/ResourcePickerDialog.vue';
import SelfContainedExportDialog from '../../editor/components/SelfContainedExportDialog.vue';
import MediaViewer from '../../editor/components/MediaViewer.vue';
import { useEditorWorkspaceBootstrap, useResourceReferenceIndex } from '../../editor/composables';
import {
  useResourceInsertion,
  getResourceInsertionFeedback,
  type EditorSelectionRange,
  type ResourceInsertionItem,
  type ResourceInsertionMode,
  type ResourceInsertionTemplate,
  type SelfContainedExportResult,
} from '../../editor/composables/useResourceInsertion';
import type { ResolvedMarkdownResourceReference } from '../../editor/utils/markdownResourceReferences';
import { repairBrokenMarkdownReference } from '../../editor/utils/resourceReferenceIndex';
import ResourceDetailPanel from '../components/ResourceDetailPanel.vue';
import { useEditorWorkspaceStore } from '../../editor/stores/editorWorkspaceStore';
import { findNotesFolderId } from '../utils/noteFolder';
import { normalizeRenamedResourceName } from '../utils/resourceName';

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
const editorWorkspaceStore = useEditorWorkspaceStore();
const {
  repositoryId,
  bookmarks,
  resourcesByType,
  treeNodes,
  isLoading,
  isSaving,
  isUploading,
  uploadProgress,
  bookmarkCapabilities,
  initRepository,
  fetchResources,
  fetchTreeNodes,
  fetchBookmarks,
  createMarkdownNote,
  renameResource,
  saveResourceContent,
  uploadResources,
  searchResources,
  renameBookmark,
  reorderBookmarks,
  removeBookmark,
  openResource,
  deleteResource,
} = useRepository();
const {
  imageResources,
  resourceItems,
  recentResources,
  insertUploadedImages,
  insertExistingImage,
  insertExistingResource,
  exportMarkdownAsSelfContained,
} = useResourceInsertion();
const { getInboundReferences, getUnresolvedReferences, getDeleteImpact } =
  useResourceReferenceIndex();
const { hydrateWorkspace, bindWorkspaceLifecycle } = useEditorWorkspaceBootstrap(repositoryId);

// ── Local state ──
const showImportDialog = ref(false);
const showImagePicker = ref(false);
const showResourcePicker = ref(false);
const showRepairDialog = ref(false);
const showExportDialog = ref(false);
const isDirty = ref(false);
const pinnedTabIds = ref(new Set<string>());
const exportResult = ref<SelfContainedExportResult | null>(null);
const pendingRepairReference = ref<ResolvedMarkdownResourceReference | null>(null);

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
const importSummary = ref<{
  successes: ResourceClientDTO[];
  failures: Array<{ fileName: string; message: string; code: string }>;
} | null>(null);
const renameDialogOpen = ref(false);
const renameValue = ref('');
const renameTarget = ref<ResourceClientDTO | null>(null);

// ── Sidebar mode config ──
const sidebarModes = computed(() => [
  { key: 'files' as const, label: t('repository.sidebar.files'), icon: FolderTree },
  { key: 'search' as const, label: t('repository.sidebar.search'), icon: Search },
  { key: 'bookmarks' as const, label: t('repository.sidebar.bookmarks'), icon: Bookmark },
]);

// ── Active resource ──
const activeResource = computed(() => {
  if (!editorWorkspaceStore.activeResourceId) return null;
  return store.resources.find((r) => r.id === editorWorkspaceStore.activeResourceId) ?? null;
});
const resourceDetailOpen = computed(() => activeResource.value != null);
const activeInboundReferences = computed(() =>
  activeResource.value ? getInboundReferences(activeResource.value.id) : [],
);
const activeBrokenDiagnostics = computed(() =>
  activeResource.value && isMarkdown(activeResource.value)
    ? getUnresolvedReferences(activeResource.value.id)
    : [],
);
const activeBrokenReferences = computed(() =>
  activeBrokenDiagnostics.value.map((item) => item.reference),
);
const recentImageResources = computed(() =>
  recentResources.value.filter((item) => item.item.kind === 'image').map((item) => item.resource),
);
const recentResourceItems = computed(() => recentResources.value.map((item) => item.item));
const normalizedRenameValue = computed(() =>
  renameTarget.value ? normalizeRenamedResourceName(renameTarget.value, renameValue.value) : '',
);
const renameSaveDisabled = computed(
  () =>
    !renameTarget.value ||
    !normalizedRenameValue.value ||
    normalizedRenameValue.value === renameTarget.value.name,
);
const repairCandidates = computed(() => {
  if (!pendingRepairReference.value) {
    return [];
  }

  const replacementKind = pendingRepairReference.value.kind === 'image' ? 'image' : 'other';
  return resourceItems.value
    .filter(
      (item) =>
        item.kind === replacementKind &&
        item.resource.id !== pendingRepairReference.value?.resourceId,
    )
    .map((item) => item.resource);
});

// ── Tabs ──
const openTabs = computed<ResourceTab[]>(
  () =>
    editorWorkspaceStore.openTabs
      .map((tab) => {
        if (!tab.resourceId) return null;
        const resource = store.resources.find((r) => r.id === tab.resourceId);
        if (!resource) return null;
        return {
          id: tab.id,
          name: resource.name,
          icon: getResourceIcon(resource),
          isDirty:
            tab.isDirty || (isDirty.value && editorWorkspaceStore.activeResourceId === resource.id),
          isPinned: tab.isPinned || pinnedTabIds.value.has(resource.id),
        };
      })
      .filter(Boolean) as ResourceTab[],
);

// ── Lifecycle ──
onMounted(async () => {
  store.setSidebarMode(props.initialSidebarMode);
  await initRepository();
  if (repositoryId.value) {
    await hydrateWorkspace();
    await fetchResources();
    await fetchBookmarks();
  }
});

bindWorkspaceLifecycle();

// ── File operations ──
async function handleSelectResource(resource: ResourceClientDTO) {
  await openResource(resource);
}

async function handleOpenResource(resource: ResourceClientDTO) {
  await openResource(resource);
}

async function handleCreateNote() {
  const noteFolderId = findNotesFolderId(treeNodes.value);
  if (!noteFolderId) {
    toast.error(t('repository.workspace.createNoteFailed'));
    return;
  }

  const note = await createMarkdownNote(undefined, '', noteFolderId);
  if (!note) {
    toast.error(t('repository.workspace.createNoteFailed'));
    return;
  }

  const opened = await openResource(note);
  if (!opened) {
    toast.error(t('repository.workspace.createNoteFailed'));
    return;
  }

  toast.success(
    t('repository.workspace.createNoteSuccess', { name: note.displayName || note.name }),
  );
}

function handleRefresh() {
  if (repositoryId.value) {
    void Promise.all([fetchResources(), fetchTreeNodes()]);
  }
}

async function handleRenameResource(resource: ResourceClientDTO) {
  renameTarget.value = resource;
  renameValue.value = resource.name;
  renameDialogOpen.value = true;
}

async function confirmRenameResource() {
  const resource = renameTarget.value;
  const nextName = normalizedRenameValue.value;

  if (!resource || !nextName || nextName === resource.name) {
    return;
  }

  const renamed = await renameResource(resource.id, nextName);
  if (!renamed) {
    toast.error(t('repository.resourceDetails.renameFailed'));
    return;
  }

  if (editorWorkspaceStore.activeResourceId === resource.id) {
    await openResource(renamed);
  }

  renameDialogOpen.value = false;
  renameTarget.value = null;
  renameValue.value = '';
  toast.success(
    t('repository.resourceDetails.renameSuccess', { name: renamed.displayName || renamed.name }),
  );
}

watch(renameDialogOpen, (open) => {
  if (open) {
    return;
  }

  renameTarget.value = null;
  renameValue.value = '';
});

async function handleDeleteResourceFromTree(resource: ResourceClientDTO) {
  store.setCurrentResource(resource);
  await handleDeleteResource();
}

// ── Save ──
function handleSaveContent(content: string) {
  if (!editorWorkspaceStore.activeResourceId) return;
  isDirty.value = false;
  saveResourceContent(editorWorkspaceStore.activeResourceId, content);
}

// ── Editor toolbar handlers ──
function handleInsertText(text: string) {
  markdownEditorRef.value?.insertText(text);
}

function insertTextAtSelection(text: string, selection?: EditorSelectionRange) {
  markdownEditorRef.value?.insertTextAtSelection(text, selection);
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
    void openResource(resource);
  } else {
    toast.info(`${t('repository.workspace.linkNotFound')}: ${title}`);
  }
}

async function handlePasteFiles(files: File[], selection: EditorSelectionRange) {
  if (!activeResource.value || !isMarkdown(activeResource.value)) {
    return;
  }

  try {
    const result = await insertUploadedImages({
      files,
      currentNoteName: activeResource.value.name,
      insertText: insertTextAtSelection,
      selection,
    });
    const feedback = getResourceInsertionFeedback(result);

    if (feedback.hasSuccess) {
      toast.success(t('editor.resourceInsertion.pasteSuccess', { count: feedback.successCount }));
    }

    if (feedback.hasFailure) {
      toast.warning(t('editor.resourceInsertion.partialFailure', { count: feedback.failureCount }));
    }
  } catch (error) {
    console.error('Paste image upload failed:', error);
    toast.error(t('editor.resourceInsertion.uploadFailed'));
  }
}

async function handleInsertExistingImage(resource: ResourceClientDTO) {
  try {
    await insertExistingImage({
      resource,
      insertText: insertTextAtSelection,
    });
    showImagePicker.value = false;
    markdownEditorRef.value?.focus();
    toast.success(t('editor.resourceInsertion.insertExistingSuccess'));
  } catch (error) {
    console.error('Insert existing image failed:', error);
    showImagePicker.value = false;
    toast.error(t('editor.resourceInsertion.insertExistingFailed'));
  }
}

async function handleInsertResource(payload: {
  item: ResourceInsertionItem;
  mode: ResourceInsertionMode;
  template: ResourceInsertionTemplate;
}) {
  try {
    await insertExistingResource({
      resource: payload.item.resource,
      mode: payload.mode,
      template: payload.template ?? 'auto',
      insertText: insertTextAtSelection,
    });
    showResourcePicker.value = false;
    markdownEditorRef.value?.focus();
    toast.success(t('editor.resourceInsertion.insertExistingSuccess'));
  } catch (error) {
    console.error('Insert resource failed:', error);
    showResourcePicker.value = false;
    toast.error(
      payload.mode === 'base64'
        ? t('editor.resourceInsertion.insertBase64Failed')
        : t('editor.resourceInsertion.insertExistingFailed'),
    );
  }
}

async function handleExportSelfContained() {
  if (!activeResource.value || !isMarkdown(activeResource.value)) {
    return;
  }

  try {
    exportResult.value = await exportMarkdownAsSelfContained({ markdown: editorContent.value });
    showExportDialog.value = true;
  } catch (error) {
    console.error('Export failed:', error);
    toast.error(t('editor.exportDialog.exportFailed'));
  }
}

async function handleCopyExport() {
  if (!exportResult.value) {
    return;
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    toast.error(t('editor.exportDialog.exportFailed'));
    return;
  }

  await navigator.clipboard.writeText(exportResult.value.markdown);
  toast.success(t('editor.exportDialog.copySuccess'));
}

function handleDownloadExport() {
  if (!exportResult.value || !activeResource.value) {
    return;
  }

  const blob = new Blob([exportResult.value.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${activeResource.value.displayName || activeResource.value.name}-self-contained.md`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(t('editor.exportDialog.downloadSuccess'));
}

function handleRepairReference(reference: ResolvedMarkdownResourceReference) {
  pendingRepairReference.value = reference;

  if (repairCandidates.value.length === 0) {
    pendingRepairReference.value = null;
    toast.error(t('editor.diagnostics.noReplacement'));
    return;
  }

  showRepairDialog.value = true;
}

function applyRepairCandidate(replacement: ResourceClientDTO) {
  const reference = pendingRepairReference.value;
  if (!reference) {
    return;
  }

  editorContent.value = repairBrokenMarkdownReference({
    markdown: editorContent.value,
    reference,
    replacement,
  });
  isDirty.value = true;
  showRepairDialog.value = false;
  pendingRepairReference.value = null;
  toast.success(t('editor.diagnostics.repaired'));
}

function handleNavigateToNote(noteId: string) {
  const resource = store.resources.find((item) => item.id === noteId);
  if (resource) {
    void openResource(resource);
  }
}

async function handleDeleteResource() {
  if (!activeResource.value) {
    return;
  }

  const impact = getDeleteImpact(activeResource.value.id);
  const confirmed = await useConfirm({
    title: t('repository.resourceDetails.deleteConfirmTitle'),
    description:
      impact.referenceCount > 0
        ? t('repository.resourceDetails.deleteImpact', {
            count: impact.referenceCount,
            notes: impact.notes.length,
          })
        : t('repository.resourceDetails.deleteConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) {
    return;
  }

  const success = await deleteResource(activeResource.value.id);
  if (success) {
    toast.success(t('repository.resourceDetails.deleteSuccess'));
  } else {
    toast.error(t('repository.resourceDetails.deleteFailed'));
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
  } else {
    editorContent.value = '';
    isDirty.value = false;
  }
  showExportDialog.value = false;
  exportResult.value = null;
});

// ── Tabs ──
async function handleSwitchTab(id: string) {
  await editorWorkspaceStore.setActiveTab(id);
  const resourceId = editorWorkspaceStore.activeResourceId;
  const resource = store.resources.find((r) => r.id === resourceId);
  if (resource) store.setCurrentResource(resource);
}

async function handleCloseTab(id: string) {
  await editorWorkspaceStore.closeTab(id);
}

function handleTogglePin(id: string) {
  if (pinnedTabIds.value.has(id)) {
    pinnedTabIds.value.delete(id);
  } else {
    pinnedTabIds.value.add(id);
  }
}

async function handleCloseOthers(id: string) {
  await editorWorkspaceStore.closeOtherTabs(id);
}

async function handleCloseRight(id: string) {
  await editorWorkspaceStore.closeTabsToRight(id);
}

async function handleCloseAll() {
  await editorWorkspaceStore.closeAllTabs();
  store.setCurrentResource(null);
}

// ── Search ──
async function handleSearch(
  query: string,
  mode: SearchMode,
  options: { caseSensitive: boolean; useRegex: boolean },
) {
  isSearching.value = true;
  hasSearched.value = true;

  try {
    if (!repositoryId.value) {
      searchResults.value = [];
      searchTotalResults.value = 0;
      searchTotalMatches.value = 0;
      searchTime.value = 0;
      return;
    }

    const result = await searchResources({
      repositoryId: repositoryId.value,
      query,
      mode,
      caseSensitive: options.caseSensitive,
      useRegex: options.useRegex,
    });

    searchResults.value = result.results;
    searchTotalResults.value = result.totalResults;
    searchTotalMatches.value = result.totalMatches;
    searchTime.value = result.searchTime;
  } finally {
    isSearching.value = false;
  }
}

function handleSearchSelect(result: SearchResultItem) {
  const resource = store.resources.find((r) => r.id === result.resourceId);
  if (resource) {
    void openResource(resource);
  }
}

// ── Bookmarks ──
function handleBookmarkSelect(bookmark: ResourceBookmarkClientDTO) {
  const resource = store.resources.find((r) => r.id === bookmark.resourceId);
  if (resource) {
    openResource(resource);
  }
}

async function handleBookmarkRename(payload: {
  bookmark: ResourceBookmarkClientDTO;
  name: string;
}) {
  const result = await renameBookmark(payload.bookmark, payload.name);
  if (!result) {
    return;
  }

  toast.success(
    result.persisted
      ? t('repository.bookmarksPanel.renamePersisted')
      : t('repository.bookmarksPanel.renameLocalOnly'),
  );
}

async function handleBookmarkMoveUp(bookmark: ResourceBookmarkClientDTO) {
  const idx = bookmarks.value.findIndex((b) => b.id === bookmark.id);
  if (idx > 0) {
    const items = [...bookmarks.value];
    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
    await reorderBookmarks(items.map((item) => item.id));
  }
}

async function handleBookmarkMoveDown(bookmark: ResourceBookmarkClientDTO) {
  const idx = bookmarks.value.findIndex((b) => b.id === bookmark.id);
  if (idx >= 0 && idx < bookmarks.value.length - 1) {
    const items = [...bookmarks.value];
    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
    await reorderBookmarks(items.map((item) => item.id));
  }
}

async function handleBookmarkRemove(bookmark: ResourceBookmarkClientDTO) {
  await removeBookmark(bookmark.id);
}

// ── Import ──
async function handleBatchImport(files: File[], tags: string[]) {
  importSummary.value = null;

  const result = await uploadResources(files, tags);
  importSummary.value = result;

  if (result.successes.length > 0) {
    await fetchResources();
    const firstMarkdown = result.successes.find((resource) => isMarkdown(resource));
    if (firstMarkdown) {
      void openResource(firstMarkdown);
    }
  }

  if (result.failures.length === 0) {
    showImportDialog.value = false;
    toast.success(t('repository.import.importSuccess', { count: result.successes.length }));
    return;
  }

  toast.warning(t('repository.import.partialSuccess'));
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
