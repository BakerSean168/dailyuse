import { computed, ref, type ComputedRef, type WritableComputedRef } from 'vue';
import { toast } from 'vue-sonner';
import type { ComposerTranslation } from 'vue-i18n';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';
import type { ResolvedMarkdownResourceReference } from '../utils/markdown-resource-references';
import { repairBrokenMarkdownReference } from '../utils/resource-reference-index';
import type {
  EditorSelectionRange,
  ResourceInsertionItem,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
  SelfContainedExportResult,
} from './useResourceInsertion';

interface UseEditorSceneDialogsOptions {
  t: ComposerTranslation;
  currentResource: ComputedRef<ResourceClientDTO | null>;
  editorContent: WritableComputedRef<string>;
  resourceItems: ComputedRef<ResourceInsertionItem[]>;
  insertTextAtSelection: (text: string, selection?: EditorSelectionRange) => void;
  insertExistingImage: (options: {
    resource: ResourceClientDTO;
    insertText: (text: string, selection?: EditorSelectionRange) => void;
  }) => Promise<unknown>;
  insertExistingResource: (options: {
    resource: ResourceClientDTO;
    mode: ResourceInsertionMode;
    template: ResourceInsertionTemplate;
    insertText: (text: string, selection?: EditorSelectionRange) => void;
  }) => Promise<unknown>;
  exportMarkdownAsSelfContained: (options: {
    markdown: string;
  }) => Promise<SelfContainedExportResult>;
  focusPane: () => void;
}

export function useEditorSceneDialogs(options: UseEditorSceneDialogsOptions) {
  const showImagePicker = ref(false);
  const showResourcePicker = ref(false);
  const showRepairDialog = ref(false);
  const showExportDialog = ref(false);
  const exportResult = ref<SelfContainedExportResult | null>(null);
  const pendingRepairReference = ref<ResolvedMarkdownResourceReference | null>(null);

  const repairCandidates = computed(() => {
    if (!pendingRepairReference.value) {
      return [];
    }

    const replacementKind = pendingRepairReference.value.kind === 'image' ? 'image' : 'other';
    return options.resourceItems.value
      .filter(
        (item) =>
          item.kind === replacementKind &&
          item.resource.id !== pendingRepairReference.value?.resourceId,
      )
      .map((item) => item.resource);
  });

  async function handleInsertExistingImage(resource: ResourceClientDTO) {
    try {
      await options.insertExistingImage({
        resource,
        insertText: options.insertTextAtSelection,
      });
      showImagePicker.value = false;
      options.focusPane();
      toast.success(options.t('editor.resourceInsertion.insertExistingSuccess'));
    } catch (cause) {
      console.error('Insert existing image failed:', cause);
      showImagePicker.value = false;
      toast.error(options.t('editor.resourceInsertion.insertExistingFailed'));
    }
  }

  async function handleInsertResource(payload: {
    item: ResourceInsertionItem;
    mode: ResourceInsertionMode;
    template: ResourceInsertionTemplate;
  }) {
    try {
      await options.insertExistingResource({
        resource: payload.item.resource,
        mode: payload.mode,
        template: payload.template ?? 'auto',
        insertText: options.insertTextAtSelection,
      });
      showResourcePicker.value = false;
      options.focusPane();
      toast.success(options.t('editor.resourceInsertion.insertExistingSuccess'));
    } catch (cause) {
      console.error('Insert resource failed:', cause);
      showResourcePicker.value = false;
      toast.error(
        payload.mode === 'base64'
          ? options.t('editor.resourceInsertion.insertBase64Failed')
          : options.t('editor.resourceInsertion.insertExistingFailed'),
      );
    }
  }

  async function handleExportSelfContained() {
    try {
      exportResult.value = await options.exportMarkdownAsSelfContained({
        markdown: options.editorContent.value,
      });
      showExportDialog.value = true;
    } catch (cause) {
      console.error('Self-contained export failed:', cause);
      toast.error(options.t('editor.exportDialog.exportFailed'));
    }
  }

  async function handleCopyExport() {
    if (!exportResult.value) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error(options.t('editor.exportDialog.exportFailed'));
      return;
    }

    await navigator.clipboard.writeText(exportResult.value.markdown);
    toast.success(options.t('editor.exportDialog.copySuccess'));
  }

  function handleDownloadExport() {
    if (!exportResult.value || !options.currentResource.value) {
      return;
    }

    const blob = new Blob([exportResult.value.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getResourceDisplayName(options.currentResource.value)}-self-contained.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(options.t('editor.exportDialog.downloadSuccess'));
  }

  function handleRepairReference(reference: ResolvedMarkdownResourceReference) {
    pendingRepairReference.value = reference;

    if (repairCandidates.value.length === 0) {
      pendingRepairReference.value = null;
      toast.error(options.t('editor.diagnostics.noReplacement'));
      return;
    }

    showRepairDialog.value = true;
  }

  function applyRepairCandidate(replacement: ResourceClientDTO) {
    const reference = pendingRepairReference.value;
    if (!reference) {
      return;
    }

    options.editorContent.value = repairBrokenMarkdownReference({
      markdown: options.editorContent.value,
      reference,
      replacement,
    });
    showRepairDialog.value = false;
    pendingRepairReference.value = null;
    toast.success(options.t('editor.diagnostics.repaired'));
  }

  function resetTransientUi() {
    showExportDialog.value = false;
    exportResult.value = null;
    showImagePicker.value = false;
    showResourcePicker.value = false;
    showRepairDialog.value = false;
    pendingRepairReference.value = null;
  }

  return {
    showImagePicker,
    showResourcePicker,
    showRepairDialog,
    showExportDialog,
    exportResult,
    pendingRepairReference,
    repairCandidates,
    handleInsertExistingImage,
    handleInsertResource,
    handleExportSelfContained,
    handleCopyExport,
    handleDownloadExport,
    handleRepairReference,
    applyRepairCandidate,
    resetTransientUi,
  };
}
