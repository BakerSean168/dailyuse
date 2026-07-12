<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <div class="border-b px-4 py-3 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="text-base font-semibold truncate">{{ linearScene.header.title }}</h1>
        <p class="text-xs text-muted-foreground truncate">
          {{ linearScene.header.path }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="linearScene.header.actions.openWorkspace">
        {{ t('editor.linear.openWorkspace') }}
      </Button>
    </div>

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
      class="flex-1 overflow-hidden flex flex-col lg:flex-row"
    >
      <div class="min-w-0 flex-1 overflow-hidden flex flex-col lg:border-r">
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
          :chars-label="t('repository.workspace.chars')"
          @update:content="linearScene.editor.content = $event"
          @insert-text="linearScene.editor.actions.insertText"
          @insert-resource="linearScene.editor.actions.openResourcePicker"
          @insert-existing-image="linearScene.editor.actions.openImagePicker"
          @export-self-contained="linearScene.editor.actions.exportSelfContained"
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
        class="flex w-full flex-col border-t bg-muted/10 max-lg:max-h-[320px] lg:w-[360px] lg:border-t-0 xl:w-[400px]"
      >
        <!-- 反链/图谱 Tabs：图谱点击才渲染；<lg 图谱不渲染（§10-5/§10-8） -->
        <NoteContextPanel
          :note-id="linearScene.sidecar.noteId"
          :show-graph="isLgUp"
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

    <SelfContainedExportDialog
      v-model:open="linearScene.editor.dialogs.export.open"
      :result="linearScene.editor.dialogs.export.result"
      @copy="linearScene.editor.actions.copyExport"
      @download="linearScene.editor.actions.downloadExport"
    />

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
import { FileX } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import ActiveDocumentPane from '../components/ActiveDocumentPane.vue';
import ImageResourcePickerDialog from '../components/ImageResourcePickerDialog.vue';
import ReferenceRepairDialog from '../components/ReferenceRepairDialog.vue';
import LinkSuggestion from '../components/LinkSuggestion.vue';
import NoteContextPanel from '../components/NoteContextPanel.vue';
import ResourcePickerDialog from '../components/ResourcePickerDialog.vue';
import SelfContainedExportDialog from '../components/SelfContainedExportDialog.vue';
import AppEmptyState from '../../../components/shared/AppEmptyState.vue';
import { useViewportBreakpoint } from '../../../shared/composables/useViewportBreakpoint';
import { useEditorLinearScene } from '../composables/useEditorLinearScene';

const { t } = useI18n();
const { isLgUp } = useViewportBreakpoint();
const linearScene = useEditorLinearScene();
</script>
