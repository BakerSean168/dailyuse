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
        @collapse="workspaceScene.sidebar.actions.setCollapsed(true)"
        @expand="workspaceScene.sidebar.actions.setCollapsed(false)"
      >
        <aside class="flex h-full flex-col border-r bg-sidebar">
          <!-- Sidebar Header: Mode Switcher -->
          <div class="flex items-center border-b h-10 px-1">
            <TooltipProvider :delay-duration="300">
              <Tooltip v-for="mode in workspaceScene.sidebar.modes" :key="mode.key">
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :class="{
                      'bg-accent': workspaceScene.sidebar.mode === mode.key,
                    }"
                    @click="workspaceScene.sidebar.actions.setMode(mode.key)"
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

            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="workspaceScene.sidebar.actions.toggle()"
            >
              <PanelLeftClose class="h-4 w-4" />
            </Button>
          </div>

          <!-- Sidebar Content -->
          <div class="flex-1 overflow-hidden">
            <!-- Files Mode: TypedFileTree -->
            <TypedFileTree
              v-if="workspaceScene.sidebar.mode === 'files'"
              :resources-by-type="workspaceScene.sidebar.files.resourcesByType"
              :tree-nodes="workspaceScene.sidebar.files.treeNodes"
              :is-loading="workspaceScene.status.isLoading"
              :selected-id="workspaceScene.sidebar.files.selectedId"
              @create-note="workspaceScene.sidebar.files.actions.createNote"
              @import="workspaceScene.dialogs.import.open = true"
              @refresh="workspaceScene.sidebar.files.actions.refresh"
              @open="workspaceScene.sidebar.files.actions.open"
              @rename="workspaceScene.sidebar.files.actions.rename"
              @delete="workspaceScene.sidebar.files.actions.delete"
            />

            <!-- Search Mode -->
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

            <!-- Bookmarks Mode -->
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
          </div>
        </aside>
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- ─── Main Content Area ─── -->
      <ResizablePanel :default-size="78">
        <main class="flex h-full flex-col overflow-hidden">
          <!-- Tab Bar -->
          <TabManager
            v-if="workspaceScene.main.tabs.items.length > 0"
            :tabs="workspaceScene.main.tabs.items"
            :active-tab-id="workspaceScene.main.tabs.activeId"
            @switch-tab="workspaceScene.main.tabs.actions.switch"
            @close-tab="workspaceScene.main.tabs.actions.close"
            @toggle-pin="workspaceScene.main.tabs.actions.togglePin"
            @close-others="workspaceScene.main.tabs.actions.closeOthers"
            @close-right="workspaceScene.main.tabs.actions.closeRight"
            @close-all="workspaceScene.main.tabs.actions.closeAll"
          />

          <!-- Editor / Viewer -->
          <div class="flex-1 overflow-hidden relative">
            <!-- Markdown Editor (CodeMirror 6) -->
            <template
              v-if="
                workspaceScene.main.editor.resource &&
                isMarkdownResource(workspaceScene.main.editor.resource)
              "
            >
              <ActiveDocumentPane
                ref="workspaceScene.main.editor.paneRef"
                :content="workspaceScene.main.editor.content"
                :saving="workspaceScene.main.editor.status.isSaving"
                :dirty="workspaceScene.main.editor.status.isDirty"
                :view-mode="workspaceScene.main.editor.viewMode"
                :placeholder="t('repository.workspace.startWriting')"
                :diagnostics="workspaceScene.main.editor.diagnostics.items"
                :broken-resource-references="
                  workspaceScene.main.editor.diagnostics.brokenReferences
                "
                :char-count="workspaceScene.main.editor.wordCount"
                :saving-label="t('repository.workspace.saving')"
                :unsaved-label="t('repository.workspace.unsaved')"
                :saved-label="t('repository.workspace.saved')"
                :chars-label="t('repository.workspace.chars')"
                @update:content="workspaceScene.main.editor.content = $event"
                @insert-text="workspaceScene.main.editor.actions.insertText"
                @insert-resource="workspaceScene.main.editor.actions.openResourcePicker"
                @insert-existing-image="workspaceScene.main.editor.actions.openImagePicker"
                @export-self-contained="workspaceScene.main.editor.actions.exportSelfContained"
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
              :file-type="getResourceMediaType(workspaceScene.main.editor.resource)!"
              :file-name="workspaceScene.main.editor.resource.name"
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
                  {{
                    workspaceScene.main.editor.resource.displayName ||
                    workspaceScene.main.editor.resource.name
                  }}
                </h3>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ workspaceScene.main.editor.resource.mimeType }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ workspaceScene.main.editor.resource.formattedSize }}
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
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="workspaceScene.sidebar.files.actions.createNote"
                >
                  <FilePlus class="h-4 w-4 mr-2" />
                  {{ t('repository.workspace.createNote') }}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="workspaceScene.dialogs.import.open = true"
                >
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
    <BatchImportDialog
      v-model:open="workspaceScene.dialogs.import.open"
      :importing="workspaceScene.dialogs.import.isUploading"
      :progress="workspaceScene.dialogs.import.progress"
      :summary="workspaceScene.dialogs.import.summary"
      @import="workspaceScene.dialogs.import.actions.submit"
    />

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

    <SelfContainedExportDialog
      v-model:open="workspaceScene.main.editor.dialogs.export.open"
      :result="workspaceScene.main.editor.dialogs.export.result"
      @copy="workspaceScene.main.editor.actions.copyExport"
      @download="workspaceScene.main.editor.actions.downloadExport"
    />

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
import { BookOpen, FilePlus, PanelLeftClose, Upload } from 'lucide-vue-next';
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
} from '@dailyuse/ui-vue-shadcn';
import TypedFileTree from '../components/TypedFileTree.vue';
import SearchPanel from '../components/SearchPanel.vue';
import BookmarksPanel from '../components/BookmarksPanel.vue';
import TabManager from '../components/TabManager.vue';
import BatchImportDialog from '../components/BatchImportDialog.vue';
import ImageResourcePickerDialog from '../../editor/components/ImageResourcePickerDialog.vue';
import ReferenceRepairDialog from '../../editor/components/ReferenceRepairDialog.vue';
import ResourcePickerDialog from '../../editor/components/ResourcePickerDialog.vue';
import SelfContainedExportDialog from '../../editor/components/SelfContainedExportDialog.vue';
import MediaViewer from '../../editor/components/MediaViewer.vue';
import { useRepositoryWorkspaceScene } from '../../editor/composables';
import type { EditorWorkspaceSidebarMode } from '../../editor/stores/editorWorkspaceUiStore';
import {
  getResourceIcon,
  getResourceMediaType,
  isMarkdownResource,
} from '../utils/resourcePresentation';

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
</script>
