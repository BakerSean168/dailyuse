import { toast } from 'vue-sonner';
import type { ComposerTranslation } from 'vue-i18n';

interface UseEditorSceneSaveOptions {
  t: ComposerTranslation;
  isDirty: { value: boolean };
  save: () => Promise<boolean>;
  saveSuccessMessage?: string;
  saveFailureMessage?: string;
}

export function useEditorSceneSave(options: UseEditorSceneSaveOptions) {
  async function handleSave() {
    if (!options.isDirty.value) {
      return false;
    }

    const success = await options.save();
    if (!success) {
      if (options.saveFailureMessage) {
        toast.error(options.saveFailureMessage);
      }
      return false;
    }

    if (options.saveSuccessMessage) {
      toast.success(options.saveSuccessMessage);
    }

    return true;
  }

  return {
    handleSave,
  };
}
