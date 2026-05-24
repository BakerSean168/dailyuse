import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@dailyuse/ui-vue-shadcn';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';
import { useRepositoryResourceGateway } from '../../repository/services/repository-resource-gateway';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';

export function useEditorUnsavedChangesGuard() {
  const { t } = useI18n();
  const registry = useEditorDocumentRegistry();
  const resourceGateway = useRepositoryResourceGateway();

  const dirtyDocuments = computed(() => registry.getDirtyDocuments());
  const hasDirtyDocuments = computed(() => dirtyDocuments.value.length > 0);

  function getDocumentName(resourceId: string): string {
    const session = registry.getDocument(resourceId);
    const resource = session?.resource.value ?? resourceGateway.getCachedResource(resourceId);
    return resource ? getResourceDisplayName(resource) : t('editor.container.resource');
  }

  async function confirmCloseResource(resourceId: string | null | undefined) {
    if (!resourceId) {
      return true;
    }

    const session = registry.getDocument(resourceId);
    if (!session?.isDirty.value) {
      return true;
    }

    return useConfirm({
      title: t('editor.container.unsavedCloseTitle'),
      description: t('editor.container.unsavedCloseConfirm', { name: getDocumentName(resourceId) }),
      confirmText: t('common.close'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });
  }

  async function confirmCloseResources(resourceIds: string[]) {
    const dirtyCount = resourceIds.filter(
      (resourceId) => registry.getDocument(resourceId)?.isDirty.value,
    ).length;

    if (dirtyCount === 0) {
      return true;
    }

    return useConfirm({
      title: t('editor.container.unsavedCloseAllTitle'),
      description: t('editor.container.unsavedCloseAllConfirm', { count: dirtyCount }),
      confirmText: t('common.close'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });
  }

  async function confirmLeaveWithDirtyDocuments() {
    if (!hasDirtyDocuments.value) {
      return true;
    }

    return useConfirm({
      title: t('editor.container.unsavedLeaveTitle'),
      description: t('editor.container.unsavedLeaveConfirm', {
        count: dirtyDocuments.value.length,
      }),
      confirmText: t('common.leave'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    });
  }

  return {
    dirtyDocuments,
    hasDirtyDocuments,
    confirmCloseResource,
    confirmCloseResources,
    confirmLeaveWithDirtyDocuments,
  };
}
