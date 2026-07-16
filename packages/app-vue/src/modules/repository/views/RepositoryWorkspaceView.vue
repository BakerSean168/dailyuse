<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden bg-background"
    data-testid="repository-workspace-view"
  >
    <Teleport defer to="#note-page-toolbar-actions">
      <div class="flex min-w-0 items-center gap-1" data-testid="note-workspace-toolbar-actions">
        <Button
          v-for="mode in workspaceScene.sidebar.modes"
          :key="mode.key"
          variant="ghost"
          size="sm"
          class="h-8 gap-1.5 px-2"
          :class="{ 'bg-accent font-medium': workspaceScene.sidebar.mode === mode.key }"
          :aria-label="mode.label"
          :data-testid="`repository-sidebar-mode-${mode.key}`"
          @click="workspaceScene.sidebar.actions.setMode(mode.key)"
        >
          <component :is="mode.icon" class="h-4 w-4" />
          <span class="hidden text-xs @3xl/panel:inline">{{ mode.label }}</span>
        </Button>
        <span class="hidden text-xs text-muted-foreground @xl/panel:inline">
          {{ repositoryResourceCount }}
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('common.retry')"
          data-testid="repository-refresh"
          @click="workspaceScene.sidebar.files.actions.refresh"
        >
          <RefreshCw class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          class="h-8 px-2 @xl/panel:px-3"
          :aria-label="t('repository.workspace.createNote')"
          :disabled="!workspaceScene.status.isReady"
          data-primary-action="create-note"
          data-testid="repository-create-note"
          @click="workspaceScene.sidebar.files.actions.createNote"
        >
          <FilePlus class="h-4 w-4 @xl/panel:mr-1.5" />
          <span class="hidden @xl/panel:inline">{{ t('repository.workspace.createNote') }}</span>
        </Button>
      </div>
    </Teleport>

    <div
      class="grid min-h-0 flex-1 grid-rows-[minmax(10rem,35%)_minmax(0,1fr)] @3xl/panel:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] @3xl/panel:grid-rows-1"
      data-testid="repository-workspace-grid"
    >
      <aside
        class="min-h-0 overflow-hidden border-b bg-sidebar @3xl/panel:border-b-0 @3xl/panel:border-r"
        data-testid="repository-group-sidebar"
      >
        <TypedFileTree
          v-if="workspaceScene.sidebar.mode === 'files'"
          :resources-by-type="workspaceScene.sidebar.files.resourcesByType"
          :tree-nodes="workspaceScene.sidebar.files.treeNodes"
          :is-loading="workspaceScene.status.isLoading"
          :selected-id="workspaceScene.sidebar.files.selectedId"
          @refresh="workspaceScene.sidebar.files.actions.refresh"
          @open="workspaceScene.sidebar.files.actions.open"
          @rename="workspaceScene.sidebar.files.actions.rename"
          @delete="workspaceScene.sidebar.files.actions.delete"
        />
        <SearchPanel
          v-else-if="workspaceScene.sidebar.mode === 'search'"
          :repository-id="workspaceScene.sidebar.search.repositoryId || ''"
          :results="workspaceScene.sidebar.search.results"
          :searching="workspaceScene.sidebar.search.status.isSearching"
          :has-searched="workspaceScene.sidebar.search.status.hasSearched"
          :total-results="workspaceScene.sidebar.search.status.totalResults"
          :total-matches="workspaceScene.sidebar.search.status.totalMatches"
          :search-time="workspaceScene.sidebar.search.status.searchTime"
          @close="workspaceScene.sidebar.search.actions.close"
          @select="workspaceScene.sidebar.search.actions.select"
          @search="workspaceScene.sidebar.search.actions.search"
        />
        <BookmarksPanel
          v-else-if="workspaceScene.sidebar.mode === 'bookmarks'"
          :bookmarks="workspaceScene.sidebar.bookmarks.items"
          :can-rename="workspaceScene.sidebar.bookmarks.capabilities.canRename"
          :can-reorder="workspaceScene.sidebar.bookmarks.capabilities.canReorder"
          :can-remove="workspaceScene.sidebar.bookmarks.capabilities.canRemove"
          @select="workspaceScene.sidebar.bookmarks.actions.select"
          @rename="workspaceScene.sidebar.bookmarks.actions.rename"
          @move-up="workspaceScene.sidebar.bookmarks.actions.moveUp"
          @move-down="workspaceScene.sidebar.bookmarks.actions.moveDown"
          @remove="workspaceScene.sidebar.bookmarks.actions.remove"
        />
      </aside>

      <main
        class="flex min-h-0 min-w-0 flex-col overflow-hidden"
        data-testid="repository-editor-pane"
      >
        <div class="relative flex-1 overflow-hidden">
          <!-- Markdown Editor (CodeMirror 6) -->
          <template
            v-if="
              workspaceScene.main.editor.resource &&
              isMarkdownResource(workspaceScene.main.editor.resource)
            "
          >
            <ActiveDocumentPane
              :ref="workspaceScene.main.editor.bindPaneRef"
              :content="workspaceScene.main.editor.content"
              :saving="workspaceScene.main.editor.status.isSaving"
              :dirty="workspaceScene.main.editor.status.isDirty"
              :view-mode="workspaceScene.main.editor.viewMode"
              :placeholder="t('repository.workspace.startWriting')"
              :diagnostics="workspaceScene.main.editor.diagnostics.items"
              :broken-resource-references="workspaceScene.main.editor.diagnostics.brokenReferences"
              :char-count="workspaceScene.main.editor.wordCount"
              :saving-label="t('repository.workspace.saving')"
              :unsaved-label="t('repository.workspace.unsaved')"
              :saved-label="t('repository.workspace.saved')"
              :index-state="workspaceScene.main.editor.status.knowledgeIndex"
              :index-pending-label="t('repository.workspace.indexPending')"
              :index-ready-label="t('repository.workspace.indexReady')"
              :index-failed-label="t('repository.workspace.indexFailed')"
              :index-error="workspaceScene.main.editor.status.knowledgeIndexError"
              :chars-label="t('repository.workspace.chars')"
              @update:content="workspaceScene.main.editor.content = $event"
              @insert-text="workspaceScene.main.editor.actions.insertText"
              @insert-resource="workspaceScene.main.editor.actions.openResourcePicker"
              @insert-existing-image="workspaceScene.main.editor.actions.openImagePicker"
              @wrap-selection="workspaceScene.main.editor.actions.wrapSelection"
              @view-mode-change="workspaceScene.main.editor.actions.setViewMode"
              @save="workspaceScene.main.editor.actions.save"
              @paste-files="workspaceScene.main.editor.actions.pasteFiles"
              @link-click="workspaceScene.main.editor.actions.openInternalLink"
              @repair="workspaceScene.main.editor.actions.repairReference"
            />
          </template>

          <!-- Media Viewer (images, video, audio) -->
          <MediaViewer
            v-else-if="
              workspaceScene.main.editor.resource &&
              getResourceMediaType(workspaceScene.main.editor.resource)
            "
            :file-path="workspaceScene.main.editor.resource.path || ''"
            :file-content="workspaceScene.main.editor.resource.content"
            :file-type="getResourceMediaType(workspaceScene.main.editor.resource)!"
            :file-name="workspaceScene.main.editor.resource.name"
            :mime-type="workspaceScene.main.editor.resource.mimeType"
            :file-size="workspaceScene.main.editor.resource.size"
          />

          <!-- Other non-markdown, non-media files -->
          <div
            v-else-if="workspaceScene.main.editor.resource"
            class="flex flex-col items-center justify-center h-full gap-4"
          >
            <component
              :is="getResourceIcon(workspaceScene.main.editor.resource)"
              class="h-16 w-16 text-muted-foreground/50"
            />
            <div class="text-center">
              <h3 class="text-lg font-medium">
                {{ getResourceDisplayName(workspaceScene.main.editor.resource) }}
              </h3>
              <p class="text-sm text-muted-foreground mt-1">
                {{ workspaceScene.main.editor.resource.mimeType }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ getResourceFormattedSize(workspaceScene.main.editor.resource) }}
              </p>
            </div>
          </div>

          <!-- Empty State (no file selected) -->
          <div
            v-else-if="!workspaceScene.status.repositoryId && !workspaceScene.status.isLoading"
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
          </div>
        </div>
      </main>
    </div>
    <!-- 阶段 0：BatchImportDialog 退役（V2 §6 Note / V1 §9） -->

    <Dialog v-model:open="workspaceScene.dialogs.createNote.open">
      <DialogContent
        class="sm:max-w-md"
        data-testid="repository-create-note-dialog"
        @close-auto-focus="workspaceScene.dialogs.createNote.actions.handleCloseAutoFocus"
      >
        <DialogHeader>
          <DialogTitle>{{ t('repository.workspace.createNoteTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('repository.workspace.createNoteDescription') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label for="repository-note-title">{{ t('repository.workspace.noteTitle') }}</Label>
          <Input
            id="repository-note-title"
            v-model="workspaceScene.dialogs.createNote.title"
            autofocus
            :placeholder="t('repository.workspace.noteTitlePlaceholder')"
            data-testid="repository-create-note-title"
            @keyup.enter="workspaceScene.dialogs.createNote.actions.confirm"
          />
          <p
            v-if="workspaceScene.dialogs.createNote.fileName"
            class="text-xs text-muted-foreground"
            data-testid="repository-create-note-file-name"
          >
            {{
              t('repository.workspace.noteFileNamePreview', {
                name: workspaceScene.dialogs.createNote.fileName,
              })
            }}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="workspaceScene.dialogs.createNote.actions.close">
            {{ t('common.cancel') }}
          </Button>
          <Button
            :disabled="workspaceScene.dialogs.createNote.saveDisabled"
            data-testid="repository-create-note-confirm"
            @click="workspaceScene.dialogs.createNote.actions.confirm"
          >
            <Loader2
              v-if="workspaceScene.dialogs.createNote.isCreating"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ t('common.create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ImageResourcePickerDialog
      v-model:open="workspaceScene.main.editor.dialogs.imagePicker.open"
      :resources="workspaceScene.main.editor.resources.imageResources"
      :recent-resources="workspaceScene.main.editor.resources.recentImageResources"
      @select="workspaceScene.main.editor.actions.insertExistingImage"
    />

    <ResourcePickerDialog
      v-model:open="workspaceScene.main.editor.dialogs.resourcePicker.open"
      :items="workspaceScene.main.editor.resources.resourceItems"
      :recent-items="workspaceScene.main.editor.resources.recentResourceItems"
      @select="workspaceScene.main.editor.actions.insertResource"
    />
    <!-- 阶段 0：SelfContainedExportDialog 入口隐藏（V2 §6 Note / V1 §9） -->

    <ReferenceRepairDialog
      v-model:open="workspaceScene.main.editor.dialogs.repair.open"
      :reference="workspaceScene.main.editor.dialogs.repair.reference"
      :candidates="workspaceScene.main.editor.diagnostics.repairCandidates"
      @select="workspaceScene.main.editor.actions.applyRepairCandidate"
    />

    <Dialog v-model:open="workspaceScene.dialogs.rename.open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('repository.resourceDetails.renameTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('repository.resourceDetails.renameDescription') }}
          </DialogDescription>
        </DialogHeader>

        <Input
          v-model="workspaceScene.dialogs.rename.value"
          :placeholder="t('repository.resourceDetails.renamePlaceholder')"
          @keyup.enter="workspaceScene.dialogs.rename.actions.confirm"
        />

        <DialogFooter>
          <Button variant="outline" @click="workspaceScene.dialogs.rename.actions.close">
            {{ t('common.cancel') }}
          </Button>
          <Button
            :disabled="workspaceScene.dialogs.rename.saveDisabled"
            @click="workspaceScene.dialogs.rename.actions.confirm"
            >{{ t('common.save') }}</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BookOpen, FilePlus, Loader2, RefreshCw } from '@lucide/vue';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import TypedFileTree from '../components/TypedFileTree.vue';
import SearchPanel from '../components/SearchPanel.vue';
import BookmarksPanel from '../components/BookmarksPanel.vue';
import ImageResourcePickerDialog from '../../editor/components/ImageResourcePickerDialog.vue';
import ReferenceRepairDialog from '../../editor/components/ReferenceRepairDialog.vue';
import ResourcePickerDialog from '../../editor/components/ResourcePickerDialog.vue';
import MediaViewer from '../../editor/components/MediaViewer.vue';
import ActiveDocumentPane from '../../editor/components/ActiveDocumentPane.vue';
import { useRepositoryWorkspaceScene } from '../../editor/composables';
import type { EditorWorkspaceSidebarMode } from '../../editor/stores/editor-workspace-ui-store';
import {
  getResourceDisplayName,
  getResourceFormattedSize,
  getResourceIcon,
  getResourceMediaType,
  isMarkdownResource,
} from '../utils/resource-presentation';

const props = withDefaults(
  defineProps<{
    initialSidebarMode?: 'files' | 'search' | 'bookmarks';
  }>(),
  {
    initialSidebarMode: 'files',
  },
);

const { t } = useI18n();
const workspaceScene = useRepositoryWorkspaceScene(
  computed(() => props.initialSidebarMode as EditorWorkspaceSidebarMode),
);
const repositoryResourceCount = computed(() =>
  Object.values(workspaceScene.sidebar.files.resourcesByType).reduce(
    (count, resources) => count + resources.length,
    0,
  ),
);
</script>
