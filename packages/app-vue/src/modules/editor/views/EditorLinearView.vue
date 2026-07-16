<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <Teleport defer to="#note-page-toolbar-actions">
      <div class="flex min-w-0 items-center gap-2" data-testid="note-detail-toolbar-actions">
        <div class="hidden min-w-0 max-w-52 @3xl/panel:block">
          <p class="truncate text-sm font-medium">{{ linearScene.header.title }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ linearScene.header.path }}</p>
        </div>
        <Button variant="outline" size="sm" @click="linearScene.header.actions.openWorkspace">
          {{ t('editor.linear.openWorkspace') }}
        </Button>
      </div>
    </Teleport>

    <div
      v-if="linearScene.status.isLoading"
      class="flex-1 flex items-center justify-center text-sm text-muted-foreground"
    >
      {{ t('common.loading') }}
    </div>

    <div v-else-if="linearScene.status.loadError" class="flex-1 overflow-auto">
      <!-- AI 深链可能指向已删资源：给出明确出口（§10-7） -->
      <AppEmptyState
        :icon="FileX"
        :title="t('editor.linear.noteUnavailable')"
        :description="linearScene.status.loadError"
        :action-label="t('editor.linear.backToNotes')"
        testid="note-not-found"
        @action="linearScene.header.actions.openWorkspace"
      />
    </div>

    <div
      v-else-if="linearScene.editor.resource"
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(10rem,35%)] overflow-hidden @3xl/panel:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] @3xl/panel:grid-rows-1"
      data-testid="note-editor-grid"
    >
      <div class="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <ActiveDocumentPane
          :ref="linearScene.editor.bindPaneRef"
          :content="linearScene.editor.content"
          :saving="linearScene.editor.status.isSaving"
          :dirty="linearScene.editor.status.isDirty"
          :view-mode="linearScene.editor.viewMode"
          :placeholder="t('repository.workspace.startWriting')"
          :diagnostics="linearScene.editor.diagnostics.items"
          :broken-resource-references="linearScene.editor.diagnostics.brokenReferences"
          :char-count="linearScene.editor.content.length"
          :saving-label="t('repository.workspace.saving')"
          :unsaved-label="t('repository.workspace.unsaved')"
          :saved-label="t('repository.workspace.saved')"
          :index-state="linearScene.editor.status.knowledgeIndex"
          :index-pending-label="t('repository.workspace.indexPending')"
          :index-ready-label="t('repository.workspace.indexReady')"
          :index-failed-label="t('repository.workspace.indexFailed')"
          :index-error="linearScene.editor.status.knowledgeIndexError"
          :chars-label="t('repository.workspace.chars')"
          @update:content="linearScene.editor.content = $event"
          @insert-text="linearScene.editor.actions.insertText"
          @insert-resource="linearScene.editor.actions.openResourcePicker"
          @insert-existing-image="linearScene.editor.actions.openImagePicker"
          @wrap-selection="linearScene.editor.actions.wrapSelection"
          @view-mode-change="linearScene.editor.actions.setViewMode"
          @save="linearScene.editor.actions.save"
          @paste-files="linearScene.editor.actions.pasteFiles"
          @link-click="linearScene.editor.actions.openInternalLink"
          @repair="linearScene.editor.actions.repairReference"
          @trigger-suggestion="linearScene.suggestions.actions.trigger"
          @close-suggestion="linearScene.suggestions.actions.close"
        >
          <template #editor-overlay>
            <LinkSuggestion
              :visible="linearScene.suggestions.state.visible"
              :search-query="linearScene.suggestions.state.query"
              :position="linearScene.suggestions.state.position"
              :exclude-note-id="linearScene.editor.resource.id"
              @select="linearScene.suggestions.actions.select"
              @create-new="linearScene.suggestions.actions.createLinkedNote"
              @close="linearScene.suggestions.actions.close"
            />
          </template>
        </ActiveDocumentPane>
      </div>

      <aside
        class="flex min-h-0 min-w-0 flex-col border-t bg-muted/10 @3xl/panel:border-l @3xl/panel:border-t-0"
        data-testid="note-context-panel-host"
      >
        <NoteContextPanel
          :note-id="linearScene.sidecar.noteId"
          :show-graph="true"
          @navigate="linearScene.sidecar.actions.navigate"
          @close="linearScene.sidecar.actions.close"
        />
      </aside>
    </div>

    <ImageResourcePickerDialog
      v-model:open="linearScene.editor.dialogs.imagePicker.open"
      :resources="linearScene.editor.resources.imageResources"
      :recent-resources="linearScene.editor.resources.recentImageResources"
      @select="linearScene.editor.actions.insertExistingImage"
    />

    <ResourcePickerDialog
      v-model:open="linearScene.editor.dialogs.resourcePicker.open"
      :items="linearScene.editor.resources.resourceItems"
      :recent-items="linearScene.editor.resources.recentResourceItems"
      @select="linearScene.editor.actions.insertResource"
    />
    <!-- 阶段 0：SelfContainedExportDialog 入口隐藏（V2 §6 Note） -->

    <ReferenceRepairDialog
      v-model:open="linearScene.editor.dialogs.repair.open"
      :reference="linearScene.editor.dialogs.repair.reference"
      :candidates="linearScene.editor.diagnostics.repairCandidates"
      @select="linearScene.editor.actions.applyRepairCandidate"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FileX } from '@lucide/vue';
import { Button } from '@dailyuse/ui-vue-shadcn';
import ActiveDocumentPane from '../components/ActiveDocumentPane.vue';
import ImageResourcePickerDialog from '../components/ImageResourcePickerDialog.vue';
import ReferenceRepairDialog from '../components/ReferenceRepairDialog.vue';
import LinkSuggestion from '../components/LinkSuggestion.vue';
import NoteContextPanel from '../components/NoteContextPanel.vue';
import ResourcePickerDialog from '../components/ResourcePickerDialog.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useEditorLinearScene } from '../composables/useEditorLinearScene';

const { t } = useI18n();
const linearScene = useEditorLinearScene();
</script>
