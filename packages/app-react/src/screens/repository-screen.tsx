import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAppSession } from '../hooks/use-app-session';
import { useFileUpload } from '../hooks/use-file-upload';
import { useRepositoryWorkspace } from '../hooks/use-repository-workspace';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

export function RepositoryScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const {
    activeResource,
    bookmarkedResourceIds,
    bookmarks,
    createNote,
    deleteSelectedResource,
    error,
    filteredResources,
    isLoading,
    isMutating,
    isRemoteAuthenticated,
    isSearching,
    refresh,
    remoteSearchResults,
    repository,
    runRemoteSearch,
    saveResource,
    searchQuery,
    selectResource,
    setSearchQuery,
    toggleBookmark,
    uploadFiles,
  } = useRepositoryWorkspace();
  const {
    state: uploadState,
    isUploading,
    pickDocuments,
    pickImages,
    takePhoto,
    maxFileSizeText,
  } = useFileUpload({
    hasRepository: repository !== null,
    uploadFiles,
  });
  const [newNoteName, setNewNoteName] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    setEditorContent(activeResource?.content ?? '');
  }, [activeResource?.id, activeResource?.content]);

  const hasUnsavedChanges = useMemo(
    () => (activeResource?.content ?? '') !== editorContent,
    [activeResource?.content, editorContent],
  );

  async function handleCreateNote() {
    const name = newNoteName.trim();
    if (name.length === 0) {
      return;
    }

    const ok = await createNote(name, newNoteContent);
    if (ok) {
      setNewNoteName('');
      setNewNoteContent('');
    }
  }

  async function handleSaveResource() {
    await saveResource(editorContent);
  }

  async function handleDeleteResource() {
    const ok = await deleteSelectedResource();
    if (ok) {
      setEditorContent('');
    }
  }

  return (
    <PageShell
      eyebrow="More"
      title="Repository"
      subtitle="仓库页现在支持 bookmark、远程搜索、独立 note editor route 和资源删除。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <SectionCard
        title="Navigation"
        description="仓库和编辑器先收在 More 栈，按移动端多步流重做。"
      >
        <View style={styles.actionRow}>
          <PrimaryButton label="Back to More" onPress={() => router.back()} variant="secondary" />
          <PrimaryButton
            label="Browse folders"
            onPress={() => router.push('./repository-folder')}
            variant="secondary"
          />
        </View>
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="仓库模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看仓库和资源。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          {repository ? (
            <SectionCard
              title={repository.name}
              description={repository.description ?? 'No repository description yet.'}
            >
              <View style={styles.pillRow}>
                <StatusPill label={repository.statusText} tone="tint" />
                <StatusPill label={`${repository.resourceCount} resources`} tone="success" />
                <StatusPill label={`${repository.folderCount} folders`} tone="textSecondary" />
                <StatusPill label={`${bookmarks.length} bookmarks`} tone="textSecondary" />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Updated {repository.updatedAtText}
              </ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Search resources"
            description="本地列表过滤和远程全文搜索现在分开处理。"
          >
            <PrimaryTextField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title, path, or content"
            />
            <View style={styles.actionRow}>
              <PrimaryButton
                label={isSearching ? 'Searching…' : 'Run remote search'}
                onPress={runRemoteSearch}
                disabled={isSearching || searchQuery.trim().length === 0}
              />
              <PrimaryButton
                label="Clear search"
                onPress={() => setSearchQuery('')}
                variant="ghost"
              />
            </View>
          </SectionCard>

          <SectionCard title="Bookmarks" description="高频资源先通过书签固定到移动端入口。">
            <View style={styles.listColumn}>
              {bookmarks.length > 0 ? (
                bookmarks.map((bookmark) => (
                  <ThemedView key={bookmark.id} type="backgroundSelected" style={styles.itemCard}>
                    <ThemedText type="smallBold">{bookmark.displayName}</ThemedText>
                    <View style={styles.actionRow}>
                      <PrimaryButton
                        label="Open"
                        onPress={() => selectResource(String(bookmark.resourceId))}
                        variant="secondary"
                      />
                      <PrimaryButton
                        label="Open editor route"
                        onPress={() =>
                          router.push(`./note-editor?resourceId=${bookmark.resourceId}`)
                        }
                        variant="ghost"
                      />
                    </View>
                  </ThemedView>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  当前还没有书签资源，可以在下方资源列表中直接收藏。
                </ThemedText>
              )}
            </View>
          </SectionCard>

          <SectionCard title="Create note" description="先提供最小可用的新建 markdown 入口。">
            <PrimaryTextField
              value={newNoteName}
              onChangeText={setNewNoteName}
              placeholder="weekly-review.md"
            />
            <PrimaryTextField
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              placeholder="# Weekly review"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={styles.multilineField}
            />
            <PrimaryButton
              label={isMutating ? 'Creating…' : 'Create note'}
              onPress={handleCreateNote}
              disabled={isMutating || newNoteName.trim().length === 0}
            />
          </SectionCard>

          <SectionCard
            title="Upload files"
            description={`从设备选择文件或拍照上传到仓库。当前最大文件大小 ${maxFileSizeText}。`}>
            <View style={styles.actionRow}>
              <PrimaryButton
                label={isUploading ? 'Uploading…' : 'Choose files'}
                onPress={pickDocuments}
                disabled={isUploading || isMutating || repository === null}
              />
              <PrimaryButton
                label="Choose images"
                onPress={pickImages}
                disabled={isUploading || isMutating || repository === null}
                variant="secondary"
              />
              <PrimaryButton
                label="Take photo"
                onPress={takePhoto}
                disabled={isUploading || isMutating || repository === null}
                variant="secondary"
              />
            </View>
            {uploadState.message ? (
              <ThemedText
                type="small"
                themeColor={
                  uploadState.status === 'error'
                    ? 'warning'
                    : 'textSecondary'
                }
              >
                {uploadState.message}
              </ThemedText>
            ) : null}
            {uploadState.progress ? (
              <ThemedText type="small" themeColor="textSecondary">
                {`Progress ${uploadState.progress.current}/${uploadState.progress.total}`}
              </ThemedText>
            ) : null}
          </SectionCard>

          {error ? (
            <SectionCard title="Repository request failed" description="当前先直接展示错误。">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Remote search results"
            description="全文搜索结果保留匹配摘要，方便移动端快速跳转。"
          >
            <View style={styles.listColumn}>
              {remoteSearchResults.length > 0 ? (
                remoteSearchResults.map((result) => (
                  <ThemedView
                    key={`${result.resourceId}-${result.matchType}`}
                    type="backgroundSelected"
                    style={styles.itemCard}
                  >
                    <ThemedText type="smallBold">{result.resourceName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {result.resourcePath}
                    </ThemedText>
                    <View style={styles.pillRow}>
                      <StatusPill label={result.matchType} tone="tint" />
                      <StatusPill label={`${result.matchCount} matches`} tone="textSecondary" />
                    </View>
                    {result.matches[0] ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {result.matches[0].lineContent.trim()}
                      </ThemedText>
                    ) : null}
                    <View style={styles.actionRow}>
                      <PrimaryButton
                        label="Open result"
                        onPress={() => selectResource(result.resourceId)}
                        variant="secondary"
                      />
                      <PrimaryButton
                        label="Open editor route"
                        onPress={() => router.push(`./note-editor?resourceId=${result.resourceId}`)}
                        variant="ghost"
                      />
                    </View>
                  </ThemedView>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {searchQuery.trim().length === 0
                    ? '输入关键词后再执行远程搜索。'
                    : '当前没有远程搜索结果。'}
                </ThemedText>
              )}
            </View>
          </SectionCard>

          <SectionCard
            title="Resources"
            description="资源列表现在支持打开、收藏和跳转独立编辑 route。"
          >
            <View style={styles.listColumn}>
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => {
                  const isBookmarked = bookmarkedResourceIds.has(String(resource.id));

                  return (
                    <ThemedView key={resource.id} type="backgroundSelected" style={styles.itemCard}>
                      <ThemedText type="smallBold">{resource.displayName}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {resource.path}
                      </ThemedText>
                      <View style={styles.pillRow}>
                        <StatusPill label={resource.typeText} tone="tint" />
                        <StatusPill label={resource.statusText} tone="textSecondary" />
                        {isBookmarked ? <StatusPill label="Bookmarked" tone="success" /> : null}
                      </View>
                      <View style={styles.actionRow}>
                        <PrimaryButton
                          label={
                            activeResource?.id === resource.id ? 'Editing' : 'Open inline editor'
                          }
                          onPress={() => selectResource(String(resource.id))}
                          disabled={isMutating || activeResource?.id === resource.id}
                          variant={activeResource?.id === resource.id ? 'ghost' : 'secondary'}
                        />
                        <PrimaryButton
                          label="Dedicated editor"
                          onPress={() => router.push(`./note-editor?resourceId=${resource.id}`)}
                          disabled={isMutating}
                          variant="ghost"
                        />
                        <PrimaryButton
                          label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                          onPress={() => toggleBookmark(resource)}
                          disabled={isMutating}
                          variant="ghost"
                        />
                      </View>
                    </ThemedView>
                  );
                })
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  当前没有匹配的资源。
                </ThemedText>
              )}
            </View>
          </SectionCard>

          <SectionCard
            title={
              activeResource ? `Inline editor: ${activeResource.displayName}` : 'Inline editor'
            }
            description="内联编辑仍然保留，同时支持跳转独立 note editor route。"
          >
            {activeResource ? (
              <>
                <View style={styles.pillRow}>
                  <StatusPill label={activeResource.typeText} tone="tint" />
                  <StatusPill label={activeResource.statusText} tone="textSecondary" />
                  <StatusPill label={activeResource.formattedSize} tone="textSecondary" />
                  <StatusPill
                    label={hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
                    tone={hasUnsavedChanges ? 'warning' : 'success'}
                  />
                </View>
                <PrimaryTextField
                  value={editorContent}
                  onChangeText={setEditorContent}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                  style={styles.editorField}
                />
                <View style={styles.actionRow}>
                  <PrimaryButton
                    label="Open dedicated editor"
                    onPress={() => router.push(`./note-editor?resourceId=${activeResource.id}`)}
                    disabled={isMutating}
                    variant="secondary"
                  />
                  <PrimaryButton
                    label={isMutating ? 'Saving…' : 'Save resource'}
                    onPress={handleSaveResource}
                    disabled={isMutating || !hasUnsavedChanges}
                  />
                  <PrimaryButton
                    label={isMutating ? 'Deleting…' : 'Delete resource'}
                    onPress={handleDeleteResource}
                    disabled={isMutating}
                    variant="ghost"
                  />
                </View>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                先从上面的资源列表或搜索结果选择一个文件进入编辑器。
              </ThemedText>
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
  itemCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  multilineField: {
    minHeight: 120,
  },
  editorField: {
    minHeight: 240,
  },
});
