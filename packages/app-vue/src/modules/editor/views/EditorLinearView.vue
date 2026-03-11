<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <div class="border-b px-4 py-3 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="text-base font-semibold truncate">{{ documentTitle }}</h1>
        <p class="text-xs text-muted-foreground truncate">
          {{ currentDocument?.path || route.fullPath }}
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

    <div v-else-if="currentDocument" class="flex-1 overflow-hidden flex flex-col lg:flex-row">
      <div class="min-w-0 flex-1 overflow-hidden flex flex-col lg:border-r">
        <EditorToolbar
          :saving="isSaving"
          @insert-text="handleInsertText"
          @insert-existing-image="showImagePicker = true"
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
                :exclude-document-id="currentDocument.id"
                @select="handleSuggestionSelect"
                @create-new="handleCreateLinkedDocument"
                @close="closeSuggestion"
              />
            </div>
          </template>
          <template #preview>
            <EditorPreview :content="editorContent" @link-click="handleInternalLinkClick" />
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
        <div class="flex-1 min-h-[280px]">
          <BacklinkPanel :document-id="currentDocument.id" @navigate="navigateToDocument" />
        </div>
        <div class="h-[360px] border-t">
          <LinkGraphView
            :document-id="currentDocument.id"
            @node-click="navigateToDocument"
            @close="noop"
          />
        </div>
      </aside>
    </div>

    <ImageResourcePickerDialog
      v-model:open="showImagePicker"
      :resources="imageResources"
      @select="handleInsertExistingImage"
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
import ImageResourcePickerDialog from '../components/ImageResourcePickerDialog.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import LinkSuggestion from '../components/LinkSuggestion.vue';
import BacklinkPanel from '../components/BacklinkPanel.vue';
import LinkGraphView from '../components/LinkGraphView.vue';
import { useEditorLinkIndex } from '../composables/useEditorLinkIndex';
import {
  getResourceInsertionFeedback,
  type EditorSelectionRange,
} from '../composables/useResourceInsertion';
import { formatWikiLink } from '../utils/wikiLinks';
import type { LinkIndexDocument } from '../utils/linkIndex';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const {
  ensureResourcesLoaded,
  getDocumentById,
  resolveDocument,
  createMarkdownDocument,
  saveDocumentContent,
  imageResources,
  insertUploadedImages,
  insertExistingImage,
  isSaving,
  error,
} = useEditorLinkIndex();

const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const currentDocument = ref<LinkIndexDocument | null>(null);
const editorContent = ref('');
const isDirty = ref(false);
const viewMode = ref<'edit' | 'split' | 'preview'>('split');
const showImagePicker = ref(false);
const suggestionState = ref({
  visible: false,
  query: '',
  position: { x: 0, y: 0 },
});

const documentId = computed(() => String(route.params.id || ''));
const documentTitle = computed(() => currentDocument.value?.title || t('editor.linear.untitled'));

async function loadDocument() {
  if (!documentId.value) {
    loadError.value = t('editor.linear.notFound');
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    await ensureResourcesLoaded();
    const document = getDocumentById(documentId.value);

    if (!document) {
      loadError.value = t('editor.linear.notFound');
      currentDocument.value = null;
      return;
    }

    currentDocument.value = document;
    editorContent.value = document.content;
    isDirty.value = false;
  } catch (error) {
    console.error('Load document failed:', error);
    loadError.value = error instanceof Error ? error.message : t('editor.linear.loadFailed');
    currentDocument.value = null;
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
  isDirty.value = currentDocument.value != null && content !== currentDocument.value.content;
}

async function handleSave() {
  if (!currentDocument.value) {
    return;
  }

  if (!isDirty.value) {
    return;
  }

  const success = await saveDocumentContent(currentDocument.value.id, editorContent.value);
  if (!success) {
    toast.error(t('editor.linear.saveFailed'));
    return;
  }

  currentDocument.value = {
    ...currentDocument.value,
    content: editorContent.value,
  };
  isDirty.value = false;
  toast.success(t('editor.linear.saveSuccess'));
}

async function handlePasteFiles(files: File[], selection: EditorSelectionRange) {
  if (!currentDocument.value) {
    return;
  }

  try {
    const result = await insertUploadedImages({
      files,
      currentNoteName: currentDocument.value.title,
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

function handleInsertExistingImage(resource: ResourceClientDTO) {
  try {
    insertExistingImage({
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

function handleTriggerSuggestion(payload: { x: number; y: number; query: string }) {
  if (!currentDocument.value) {
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

function handleSuggestionSelect(document: LinkIndexDocument | null) {
  if (!document) {
    return;
  }

  markdownEditorRef.value?.replaceActiveWikiLink(formatWikiLink(document.title));
  closeSuggestion();
  markdownEditorRef.value?.focus();
}

async function handleCreateLinkedDocument(title: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return;
  }

  try {
    const created = await createMarkdownDocument(trimmedTitle);
    if (!created) {
      toast.error(t('editor.linear.createLinkedFailed'));
      return;
    }

    markdownEditorRef.value?.replaceActiveWikiLink(formatWikiLink(trimmedTitle));
    closeSuggestion();
    markdownEditorRef.value?.focus();
    toast.success(t('editor.linear.createLinkedSuccess', { name: trimmedTitle }));
  } catch (error) {
    console.error('Create linked document failed:', error);
    toast.error(t('editor.linear.createLinkedFailed'));
  }
}

function handleInternalLinkClick(title: string) {
  const linkedDocument = resolveDocument(title);
  if (!linkedDocument) {
    toast.info(`${t('repository.workspace.linkNotFound')}: ${title}`);
    return;
  }

  navigateToDocument(linkedDocument.id);
}

function navigateToDocument(id: string) {
  void router.push({ name: 'document-edit', params: { id } });
}

function goToWorkspace() {
  void router.push({ name: 'repository' });
}

function noop() {}

watch(documentId, () => {
  closeSuggestion();
  void loadDocument();
});

watch(error, (message) => {
  if (message && !loadError.value) {
    loadError.value = message;
  }
});

onMounted(() => {
  void loadDocument();
});
</script>
