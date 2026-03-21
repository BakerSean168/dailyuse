import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { useConfirm } from '@dailyuse/ui-vue-shadcn';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useEditorWorkspaceActions } from '../../editor/composables/useEditorWorkspaceActions';
import { useEditorWorkspaceStore } from '../../editor/stores/editorWorkspaceStore';
import { useResourceReferenceIndex } from '../../editor/composables/useResourceReferenceIndex';
import { findNotesFolderId } from '../utils/noteFolder';
import { getEditableResourceName, normalizeRenamedResourceName } from '../utils/resourceName';
import { isMarkdownResource } from '../utils/resourcePresentation';
import { useRepository } from './useRepository';

export function useRepositoryResourceCommands(activeResource: Ref<ResourceClientDTO | null>) {
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
    console.info('[RepositoryResourceCommands] handleOpenResource:start', {
      resourceId: resource.id,
      resourceName: resource.displayName || resource.name,
      repositoryId: repository.repositoryId.value,
    });

    const opened = await requestOpenResource(resource.id);
    if (!opened) {
      console.warn('[RepositoryResourceCommands] handleOpenResource:open-failed', {
        resourceId: resource.id,
        repositoryId: repository.repositoryId.value,
      });
    }

    console.info('[RepositoryResourceCommands] handleOpenResource:done', {
      resourceId: resource.id,
      openedTabId: opened?.id ?? null,
    });
  }

  async function handleCreateNote() {
    const noteFolderId = findNotesFolderId(repository.treeNodes.value);

    console.info('[RepositoryResourceCommands] handleCreateNote:start', {
      repositoryId: repository.repositoryId.value,
      noteFolderId,
      resourceCount: repository.resources.value.length,
    });

    const note = await repository.createMarkdownNote(
      undefined,
      '',
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

    console.info('[RepositoryResourceCommands] handleCreateNote:created', {
      noteId: note.id,
      noteName: note.displayName || note.name,
      notePath: note.path,
      repositoryId: repository.repositoryId.value,
    });

    const opened = await requestOpenResource(note.id);
    if (!opened) {
      console.warn('[RepositoryResourceCommands] handleCreateNote:open-failed', {
        noteId: note.id,
        repositoryId: repository.repositoryId.value,
      });
      toast.error(t('repository.workspace.createNoteFailed'));
      return;
    }

    console.info('[RepositoryResourceCommands] handleCreateNote:opened', {
      noteId: note.id,
      tabId: opened.id,
      repositoryId: repository.repositoryId.value,
    });

    toast.success(
      t('repository.workspace.createNoteSuccess', { name: note.displayName || note.name }),
    );
  }

  function handleRefresh() {
    console.info('[RepositoryResourceCommands] handleRefresh', {
      repositoryId: repository.repositoryId.value,
    });
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
      t('repository.resourceDetails.renameSuccess', { name: renamed.displayName || renamed.name }),
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
    renameDialogOpen,
    renameValue,
    normalizedRenameValue,
    renameSaveDisabled,
    handleOpenResource,
    handleCreateNote,
    handleRefresh,
    handleRenameResource,
    confirmRenameResource,
    handleDeleteResource,
    handleDeleteResourceFromTree,
    handleBatchImport,
    resetRenameDialog,
  };
}
