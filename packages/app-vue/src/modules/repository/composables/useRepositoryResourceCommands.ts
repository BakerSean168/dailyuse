import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { useConfirm } from '@dailyuse/ui-vue-shadcn';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useEditorWorkspaceActions } from '../../editor/composables/useEditorWorkspaceActions';
import { useEditorWorkspaceStore } from '../../editor/stores/editor-workspace-store';
import { useResourceReferenceIndex } from '../../editor/composables/useResourceReferenceIndex';
import { findNotesFolderId } from '../utils/note-folder';
import { getEditableResourceName, normalizeRenamedResourceName } from '../utils/resource-name';
import { getResourceDisplayName, isMarkdownResource } from '../utils/resource-presentation';
import { useRepository } from './useRepository';
import { buildNoteNameFromTitle } from './repositoryHelpers';

export function useRepositoryResourceCommands(
  activeResource: Ref<ResourceClientDTO | null>,
  options: { onResourceOpened?: () => void | Promise<void> } = {},
) {
  const { t } = useI18n();
  const editorWorkspaceStore = useEditorWorkspaceStore();
  const repository = useRepository();
  const { getDeleteImpact } = useResourceReferenceIndex();
  const { requestOpenResource } = useEditorWorkspaceActions();

  const showImportDialog = ref(false);
  const importSummary = ref<{
    successes: ResourceClientDTO[];
    failures: Array<{ fileName: string; message: string; code: string }>;
  } | null>(null);
  const renameDialogOpen = ref(false);
  const renameValue = ref('');
  const renameTarget = ref<ResourceClientDTO | null>(null);
  const createNoteDialogOpen = ref(false);
  const createNoteTitle = ref('');
  const isCreatingNote = ref(false);
  let focusEditorAfterCreate = false;

  const createNoteName = computed(() =>
    createNoteTitle.value.trim() ? buildNoteNameFromTitle(createNoteTitle.value) : '',
  );
  const createNoteDisabled = computed(
    () => !createNoteTitle.value.trim() || !createNoteName.value || isCreatingNote.value,
  );

  const normalizedRenameValue = computed(() =>
    renameTarget.value ? normalizeRenamedResourceName(renameTarget.value, renameValue.value) : '',
  );
  const renameSaveDisabled = computed(
    () =>
      !renameTarget.value ||
      !normalizedRenameValue.value ||
      normalizedRenameValue.value === renameTarget.value.name,
  );

  async function handleOpenResource(resource: ResourceClientDTO) {
    const opened = await requestOpenResource(resource.id);
    if (!opened) {
      console.warn('[RepositoryResourceCommands] handleOpenResource:open-failed', {
        resourceId: resource.id,
        repositoryId: repository.repositoryId.value,
      });
    }
  }

  function handleCreateNote() {
    createNoteTitle.value = '';
    createNoteDialogOpen.value = true;
  }

  async function confirmCreateNote() {
    if (createNoteDisabled.value) {
      return;
    }

    const noteFolderId = findNotesFolderId(repository.treeNodes.value);
    isCreatingNote.value = true;

    try {
      const note = await repository.createMarkdownNote(
        createNoteName.value,
        undefined,
        noteFolderId ?? undefined,
      );
      if (!note) {
        console.error('[RepositoryResourceCommands] handleCreateNote:create-failed', {
          repositoryId: repository.repositoryId.value,
          noteFolderId,
        });
        toast.error(t('repository.workspace.createNoteFailed'));
        return;
      }
      const opened = await requestOpenResource(note.id);
      if (!opened) {
        console.warn('[RepositoryResourceCommands] handleCreateNote:open-failed', {
          noteId: note.id,
          repositoryId: repository.repositoryId.value,
        });
        toast.error(t('repository.workspace.createNoteFailed'));
        return;
      }
      focusEditorAfterCreate = true;
      createNoteDialogOpen.value = false;
      createNoteTitle.value = '';
      toast.success(
        t('repository.workspace.createNoteSuccess', { name: getResourceDisplayName(note) }),
      );
    } finally {
      isCreatingNote.value = false;
    }
  }

  function handleCreateNoteCloseAutoFocus(event: Event) {
    if (!focusEditorAfterCreate) {
      return;
    }

    // A successful create transfers focus into the newly opened document.
    // Prevent Radix from restoring focus to the create trigger after its close
    // animation, then focus CodeMirror at the dialog lifecycle boundary.
    event.preventDefault();
    focusEditorAfterCreate = false;
    void options.onResourceOpened?.();
  }

  function handleRefresh() {
    if (repository.repositoryId.value) {
      void Promise.all([repository.fetchResources(), repository.fetchTreeNodes()]);
    }
  }

  async function handleRenameResource(resource: ResourceClientDTO) {
    renameTarget.value = resource;
    renameValue.value = getEditableResourceName(resource);
    renameDialogOpen.value = true;
  }

  async function confirmRenameResource() {
    const resource = renameTarget.value;
    const nextName = normalizedRenameValue.value;

    if (!resource || !nextName || nextName === resource.name) {
      return;
    }

    const renamed = await repository.renameResource(resource.id, nextName);
    if (!renamed) {
      toast.error(t('repository.resourceDetails.renameFailed'));
      return;
    }

    if (editorWorkspaceStore.activeResourceId === resource.id) {
      await requestOpenResource(renamed.id);
    }

    renameDialogOpen.value = false;
    renameTarget.value = null;
    renameValue.value = '';
    toast.success(
      t('repository.resourceDetails.renameSuccess', { name: getResourceDisplayName(renamed) }),
    );
  }

  async function handleDeleteResource(resource = activeResource.value) {
    if (!resource) {
      return;
    }

    const impact = getDeleteImpact(resource.id);
    const confirmed = await useConfirm({
      title: t('repository.resourceDetails.deleteConfirmTitle'),
      description:
        impact.referenceCount > 0
          ? t('repository.resourceDetails.deleteImpact', {
              count: impact.referenceCount,
              notes: impact.notes.length,
            })
          : t('repository.resourceDetails.deleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    const success = await repository.deleteResource(resource.id);
    if (success) {
      toast.success(t('repository.resourceDetails.deleteSuccess'));
    } else {
      toast.error(t('repository.resourceDetails.deleteFailed'));
    }
  }

  async function handleDeleteResourceFromTree(resource: ResourceClientDTO) {
    await handleDeleteResource(resource);
  }

  async function handleBatchImport(files: File[], tags: string[]) {
    importSummary.value = null;

    const result = await repository.uploadResources(files, tags);
    importSummary.value = result;

    if (result.successes.length > 0) {
      await repository.fetchResources();
      const firstMarkdown = result.successes.find((resource) => isMarkdownResource(resource));
      if (firstMarkdown) {
        void requestOpenResource(firstMarkdown.id);
      }
    }

    if (result.failures.length === 0) {
      showImportDialog.value = false;
      toast.success(t('repository.import.importSuccess', { count: result.successes.length }));
      return;
    }

    toast.warning(t('repository.import.partialSuccess'));
  }

  function resetRenameDialog() {
    renameTarget.value = null;
    renameValue.value = '';
  }

  return {
    isUploading: repository.isUploading,
    uploadProgress: repository.uploadProgress,
    showImportDialog,
    importSummary,
    createNoteDialogOpen,
    createNoteTitle,
    createNoteName,
    createNoteDisabled,
    isCreatingNote,
    renameDialogOpen,
    renameValue,
    normalizedRenameValue,
    renameSaveDisabled,
    handleOpenResource,
    handleCreateNote,
    confirmCreateNote,
    handleCreateNoteCloseAutoFocus,
    handleRefresh,
    handleRenameResource,
    confirmRenameResource,
    handleDeleteResource,
    handleDeleteResourceFromTree,
    handleBatchImport,
    resetRenameDialog,
  };
}
