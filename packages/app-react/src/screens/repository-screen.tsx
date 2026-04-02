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
  const actionSections = [
    {
      title: 'Workspace',
      description: '仓库的全局入口和快捷操作集中到页面抽屉。',
      items: [
        {
          label: 'Browse folders',
          description: '打开文件夹浏览页。',
          onPress: () => router.push('./repository-folder'),
        },
        {
          label: 'Clear search',
          description: '清空当前搜索词。',
          disabled: searchQuery.trim().length === 0,
          onPress: () => setSearchQuery(''),
        },
      ],
    },
    {
      title: 'Selection',
      description: '当前打开资源的快捷动作。',
      items: activeResource
        ? [
            {
              label: 'Open dedicated editor',
              description: '跳转到独立编辑页。',
              onPress: () => router.push(`./note-editor?resourceId=${activeResource.id}`),
            },
            {
              label: hasUnsavedChanges ? 'Save resource' : 'No unsaved changes',
              description: '保存当前内联编辑内容。',
              disabled: !hasUnsavedChanges || isMutating,
              onPress: handleSaveResource,
            },
            {
              label: 'Delete resource',
              description: '删除当前选中的资源。',
              disabled: isMutating,
              onPress: handleDeleteResource,
            },
          ]
        : [
            {
              label: 'Select a resource',
              description: '先在列表里选中文件，再使用这里的快捷动作。',
              disabled: true,
            },
          ],
    },
  ];

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
      actionMenuSubtitle="仓库中的文件夹入口和资源动作集中到左上角。"
      actionSections={actionSections}
      eyebrow="More"
      title="Repository"
      subtitle="仓库资源、书签和编辑器。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      {!isRemoteAuthenticated ? (
        <SectionCard title="Sign in required" description="登录后可访问仓库和资源。">
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with a remote account to load repository data.
          </ThemedText>
          <PrimaryButton fullWidth label="Go to sign-in" onPress={signOut} />
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
            description="按标题、路径或内容搜索资源。"
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

          <SectionCard title="Bookmarks" description="常用资源。">
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

          <SectionCard title="Create note" description="创建新的 Markdown 笔记。">
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
            description={`从设备选择文件或拍照上传。最大文件大小 ${maxFileSizeText}。`}>
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
            <SectionCard title="Repository request failed" description="Unable to load repository data.">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Remote search results"
            description="远程全文搜索结果。"
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
            description="资源列表和快捷操作。"
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
            description="当前选中资源的编辑区。"
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
                Select a file to start editing.
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
