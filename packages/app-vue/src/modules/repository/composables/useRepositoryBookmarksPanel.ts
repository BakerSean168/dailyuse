import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import { useEditorWorkspaceActions } from '../../editor/composables/useEditorWorkspaceActions';
import { useRepository } from './useRepository';

export function useRepositoryBookmarksPanel() {
  const { t } = useI18n();
  const { bookmarks, bookmarkCapabilities, renameBookmark, reorderBookmarks, removeBookmark } =
    useRepository();
  const { requestOpenResource } = useEditorWorkspaceActions();

  function handleBookmarkSelect(bookmark: ResourceBookmarkClientDTO) {
    void requestOpenResource(bookmark.resourceId);
  }

  async function handleBookmarkRename(payload: {
    bookmark: ResourceBookmarkClientDTO;
    name: string;
  }) {
    const result = await renameBookmark(payload.bookmark, payload.name);
    if (!result) {
      return;
    }

    toast.success(
      result.persisted
        ? t('repository.bookmarksPanel.renamePersisted')
        : t('repository.bookmarksPanel.renameLocalOnly'),
    );
  }

  async function handleBookmarkMoveUp(bookmark: ResourceBookmarkClientDTO) {
    const idx = bookmarks.value.findIndex((item) => item.id === bookmark.id);
    if (idx > 0) {
      const items = [...bookmarks.value];
      [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      await reorderBookmarks(items.map((item) => item.id));
    }
  }

  async function handleBookmarkMoveDown(bookmark: ResourceBookmarkClientDTO) {
    const idx = bookmarks.value.findIndex((item) => item.id === bookmark.id);
    if (idx >= 0 && idx < bookmarks.value.length - 1) {
      const items = [...bookmarks.value];
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      await reorderBookmarks(items.map((item) => item.id));
    }
  }

  async function handleBookmarkRemove(bookmark: ResourceBookmarkClientDTO) {
    await removeBookmark(bookmark.id);
  }

  return {
    bookmarks,
    bookmarkCapabilities,
    handleBookmarkSelect,
    handleBookmarkRename,
    handleBookmarkMoveUp,
    handleBookmarkMoveDown,
    handleBookmarkRemove,
  };
}
