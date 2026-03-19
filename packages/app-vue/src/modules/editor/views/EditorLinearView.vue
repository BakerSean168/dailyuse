<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <div class="border-b px-4 py-3 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="text-base font-semibold truncate">{{ noteTitle }}</h1>
        <p class="text-xs text-muted-foreground truncate">
          {{ currentNote?.path || route.fullPath }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="goToWorkspace">
        {{ t('editor.linear.openWorkspace') }}
      </Button>
    </div>

    <div
      v-if="isLoading"
      class="flex-1 flex items-center justify-center text-sm text-muted-foreground"
    >
      {{ t('common.loading') }}
    </div>

    <div v-else-if="loadError" class="flex-1 flex items-center justify-center p-6">
      <Alert variant="destructive" class="max-w-lg">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{{ loadError }}</AlertDescription>
      </Alert>
    </div>

    <div v-else-if="currentNote" class="flex-1 overflow-hidden flex flex-col lg:flex-row">
      <div class="min-w-0 flex-1 overflow-hidden flex flex-col lg:border-r">
        <EditorToolbar
          :saving="isSaving"
          @insert-text="handleInsertText"
          @insert-resource="showResourcePicker = true"
          @insert-existing-image="showImagePicker = true"
          @export-self-contained="handleExportSelfContained"
          @wrap-selection="handleWrapSelection"
          @view-mode-change="handleViewModeChange"
          @save="handleSave"
        />

        <EditorSplitView :view-mode="viewMode" class="flex-1">
          <template #editor>
            <div class="relative h-full">
              <MarkdownEditor
                ref="markdownEditorRef"
                v-model="editorContent"
                :placeholder="t('repository.workspace.startWriting')"
                @change="handleEditorChange"
                @paste-files="handlePasteFiles"
                @trigger-suggestion="handleTriggerSuggestion"
                @close-suggestion="closeSuggestion"
              />
              <LinkSuggestion
                :visible="suggestionState.visible"
                :search-query="suggestionState.query"
                :position="suggestionState.position"
                :exclude-note-id="currentNote.id"
                @select="handleSuggestionSelect"
                @create-new="handleCreateLinkedNote"
                @close="closeSuggestion"
              />
            </div>
          </template>
          <template #preview>
            <EditorPreview
              :content="editorContent"
              :broken-resource-references="brokenReferences"
              @link-click="handleInternalLinkClick"
            />
          </template>
        </EditorSplitView>

        <div
          class="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>{{
            isDirty ? t('repository.workspace.unsaved') : t('repository.workspace.saved')
          }}</span>
          <span>{{ editorContent.length }} {{ t('repository.workspace.chars') }}</span>
        </div>
      </div>

      <aside
        class="w-full lg:w-[360px] xl:w-[400px] border-t lg:border-t-0 bg-muted/10 flex flex-col"
      >
        <div class="flex-1 min-h-[280px] p-4">
          <BrokenResourceDiagnostics
            :diagnostics="brokenDiagnostics"
            @repair="handleRepairReference"
          />
        </div>
        <div class="flex-1 min-h-[280px]">
          <BacklinkPanel :note-id="currentNote.id" @navigate="navigateToNote" />
        </div>
        <div class="h-[360px] border-t">
          <LinkGraphView :note-id="currentNote.id" @node-click="navigateToNote" @close="noop" />
        </div>
      </aside>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { AlertCircle } from 'lucide-vue-next';
import { Alert, AlertDescription, Button } from '@dailyuse/ui-vue-shadcn';
import EditorToolbar from '../components/EditorToolbar.vue';
import EditorSplitView from '../components/EditorSplitView.vue';
import EditorPreview from '../components/EditorPreview.vue';
import BrokenResourceDiagnostics from '../components/BrokenResourceDiagnostics.vue';
import ImageResourcePickerDialog from '../components/ImageResourcePickerDialog.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import ReferenceRepairDialog from '../components/ReferenceRepairDialog.vue';
import LinkSuggestion from '../components/LinkSuggestion.vue';
import BacklinkPanel from '../components/BacklinkPanel.vue';
import LinkGraphView from '../components/LinkGraphView.vue';
import ResourcePickerDialog from '../components/ResourcePickerDialog.vue';
import SelfContainedExportDialog from '../components/SelfContainedExportDialog.vue';
import { useEditorLinkIndex } from '../composables/useEditorLinkIndex';
import { useResourceReferenceIndex } from '../composables/useResourceReferenceIndex';
import {
  getResourceInsertionFeedback,
  type EditorSelectionRange,
} from '../composables/useResourceInsertion';
import { formatWikiLink } from '../utils/wikiLinks';
import type { LinkIndexNote } from '../utils/linkIndex';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { ResolvedMarkdownResourceReference } from '../utils/markdownResourceReferences';
import type {
  ResourceInsertionItem,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
  SelfContainedExportResult,
} from '../composables/useResourceInsertion';
import { repairBrokenMarkdownReference } from '../utils/resourceReferenceIndex';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const {
  ensureResourcesLoaded,
  getNoteById,
  resolveNote,
  createMarkdownNote,
  saveNoteContent,
  imageResources,
  resourceItems,
  recentResources,
  insertUploadedImages,
  insertExistingImage,
  insertExistingResource,
  exportMarkdownAsSelfContained,
  isSaving,
  error,
} = useEditorLinkIndex();
const { getUnresolvedReferences } = useResourceReferenceIndex();

const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const currentNote = ref<LinkIndexNote | null>(null);
const editorContent = ref('');
const isDirty = ref(false);
const viewMode = ref<'edit' | 'split' | 'preview'>('split');
const showImagePicker = ref(false);
const showResourcePicker = ref(false);
const showRepairDialog = ref(false);
const showExportDialog = ref(false);
const exportResult = ref<SelfContainedExportResult | null>(null);
const pendingRepairReference = ref<ResolvedMarkdownResourceReference | null>(null);
const suggestionState = ref({
  visible: false,
  query: '',
  position: { x: 0, y: 0 },
});

const noteId = computed(() => String(route.params.id || ''));
const noteTitle = computed(() => currentNote.value?.title || t('editor.linear.untitled'));
const brokenDiagnostics = computed(() =>
  currentNote.value ? getUnresolvedReferences(currentNote.value.id) : [],
);
const brokenReferences = computed(() => brokenDiagnostics.value.map((item) => item.reference));
const recentImageResources = computed(() =>
  recentResources.value.filter((item) => item.item.kind === 'image').map((item) => item.resource),
);
const recentResourceItems = computed(() => recentResources.value.map((item) => item.item));
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

async function loadNote() {
  if (!noteId.value) {
    loadError.value = t('editor.linear.notFound');
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    await ensureResourcesLoaded();
    const note = getNoteById(noteId.value);

    if (!note) {
      loadError.value = t('editor.linear.notFound');
      currentNote.value = null;
      return;
    }

    currentNote.value = note;
    editorContent.value = note.content;
    isDirty.value = false;
  } catch (error) {
    console.error('Load note failed:', error);
    loadError.value = error instanceof Error ? error.message : t('editor.linear.loadFailed');
    currentNote.value = null;
  } finally {
    isLoading.value = false;
  }
}

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
  editorContent.value = content;
  isDirty.value = currentNote.value != null && content !== currentNote.value.content;
}

async function handleSave() {
  if (!currentNote.value) {
    return;
  }

  if (!isDirty.value) {
    return;
  }

  const success = await saveNoteContent(currentNote.value.id, editorContent.value);
  if (!success) {
    toast.error(t('editor.linear.saveFailed'));
    return;
  }

  currentNote.value = {
    ...currentNote.value,
    content: editorContent.value,
  };
  isDirty.value = false;
  toast.success(t('editor.linear.saveSuccess'));
}

async function handlePasteFiles(files: File[], selection: EditorSelectionRange) {
  if (!currentNote.value) {
    return;
  }

  try {
    const result = await insertUploadedImages({
      files,
      currentNoteName: currentNote.value.title,
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
    console.error('Linear editor paste upload failed:', error);
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
    console.error('Linear editor insert existing image failed:', error);
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
  try {
    exportResult.value = await exportMarkdownAsSelfContained({ markdown: editorContent.value });
    showExportDialog.value = true;
  } catch (error) {
    console.error('Self-contained export failed:', error);
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
  if (!exportResult.value || !currentNote.value) {
    return;
  }

  const blob = new Blob([exportResult.value.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentNote.value.title || 'note'}-self-contained.md`;
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
  isDirty.value = currentNote.value != null && editorContent.value !== currentNote.value.content;
  showRepairDialog.value = false;
  pendingRepairReference.value = null;
  toast.success(t('editor.diagnostics.repaired'));
}

function handleTriggerSuggestion(payload: { x: number; y: number; query: string }) {
  if (!currentNote.value) {
    return;
  }

  suggestionState.value = {
    visible: true,
    query: payload.query,
    position: { x: payload.x, y: payload.y },
  };
}

function closeSuggestion() {
  suggestionState.value = {
    ...suggestionState.value,
    visible: false,
  };
}

function handleSuggestionSelect(note: LinkIndexNote | null) {
  if (!note) {
    return;
  }

  markdownEditorRef.value?.replaceActiveWikiLink(formatWikiLink(note.title));
  closeSuggestion();
  markdownEditorRef.value?.focus();
}

async function handleCreateLinkedNote(title: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return;
  }

  try {
    const created = await createMarkdownNote(trimmedTitle);
    if (!created) {
      toast.error(t('editor.linear.createLinkedFailed'));
      return;
    }

    markdownEditorRef.value?.replaceActiveWikiLink(formatWikiLink(trimmedTitle));
    closeSuggestion();
    markdownEditorRef.value?.focus();
    toast.success(t('editor.linear.createLinkedSuccess', { name: trimmedTitle }));
  } catch (error) {
    console.error('Create linked note failed:', error);
    toast.error(t('editor.linear.createLinkedFailed'));
  }
}

function handleInternalLinkClick(title: string) {
  const linkedNote = resolveNote(title);
  if (!linkedNote) {
    toast.info(`${t('repository.workspace.linkNotFound')}: ${title}`);
    return;
  }

  navigateToNote(linkedNote.id);
}

function navigateToNote(id: string) {
  void router.push({ name: 'note-edit', params: { id } });
}

function goToWorkspace() {
  void router.push({ name: 'repository' });
}

function noop() {}

watch(noteId, () => {
  closeSuggestion();
  showExportDialog.value = false;
  exportResult.value = null;
  void loadNote();
});

watch(error, (message) => {
  if (message && !loadError.value) {
    loadError.value = message;
  }
});

onMounted(() => {
  void loadNote();
});
</script>
