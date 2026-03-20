import { computed, type ComputedRef } from 'vue';
import { toast } from 'vue-sonner';
import type { ComposerTranslation } from 'vue-i18n';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import {
  getResourceInsertionFeedback,
  type EditorSelectionRange,
  type ResourceInsertionItem,
} from './useResourceInsertion';

interface RecentResourceEntry {
  resource: ResourceClientDTO;
  item: ResourceInsertionItem;
}

interface UseEditorSceneInsertionOptions {
  t: ComposerTranslation;
  currentResource: ComputedRef<ResourceClientDTO | null>;
  recentResources: ComputedRef<RecentResourceEntry[]>;
  insertUploadedImages: (options: {
    files: File[];
    currentNoteName?: string | null;
    insertText: (text: string, selection?: EditorSelectionRange) => void;
    selection?: EditorSelectionRange;
  }) => Promise<unknown>;
  insertTextAtSelection: (text: string, selection?: EditorSelectionRange) => void;
}

export function useEditorSceneInsertion(options: UseEditorSceneInsertionOptions) {
  const recentImageResources = computed(() =>
    options.recentResources.value
      .filter((item) => item.item.kind === 'image')
      .map((item) => item.resource),
  );

  const recentResourceItems = computed(() =>
    options.recentResources.value.map((item) => item.item),
  );

  async function handlePasteFiles(files: File[], selection: EditorSelectionRange) {
    if (!options.currentResource.value) {
      return;
    }

    try {
      const result = await options.insertUploadedImages({
        files,
        currentNoteName:
          options.currentResource.value.displayName || options.currentResource.value.name,
        insertText: options.insertTextAtSelection,
        selection,
      });
      const feedback = getResourceInsertionFeedback(result as never);

      if (feedback.hasSuccess) {
        toast.success(
          options.t('editor.resourceInsertion.pasteSuccess', { count: feedback.successCount }),
        );
      }

      if (feedback.hasFailure) {
        toast.warning(
          options.t('editor.resourceInsertion.partialFailure', { count: feedback.failureCount }),
        );
      }
    } catch (cause) {
      console.error('Editor scene paste upload failed:', cause);
      toast.error(options.t('editor.resourceInsertion.uploadFailed'));
    }
  }

  return {
    recentImageResources,
    recentResourceItems,
    handlePasteFiles,
  };
}
