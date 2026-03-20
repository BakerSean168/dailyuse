import { toast } from 'vue-sonner';
import type { ComposerTranslation } from 'vue-i18n';

interface UseEditorSceneNavigationOptions {
  t: ComposerTranslation;
  resolveNote: (title: string) => { id: string } | null;
  onOpenLinkedResource?: (resourceId: string) => void | Promise<void>;
}

export function useEditorSceneNavigation(options: UseEditorSceneNavigationOptions) {
  function handleInternalLinkClick(title: string) {
    const linkedNote = options.resolveNote(title);
    if (!linkedNote) {
      toast.info(`${options.t('repository.workspace.linkNotFound')}: ${title}`);
      return;
    }

    void options.onOpenLinkedResource?.(linkedNote.id);
  }

  return {
    handleInternalLinkClick,
  };
}
