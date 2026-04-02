import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAppSession } from '../hooks/use-app-session';
import { useFolderNavigation } from '../hooks/use-folder-navigation';
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

type EditMode = 'none' | 'rename-folder' | 'rename-resource' | 'create-folder' | 'move';

interface EditTarget {
  id: string;
  name: string;
  type: 'folder' | 'file';
}

export function RepositoryFolderScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { repository, isRemoteAuthenticated } = useRepositoryWorkspace();

  const {
    breadcrumbs,
    createFolder,
    deleteFolder,
    deleteResource,
    error,
    isAtRoot,
    isLoading,
    isMutating,
    items,
    moveFolder,
    moveResource,
    navigateToFolder,
    navigateUp,
    refresh,
    renameFolder,
    renameResource,
  } = useFolderNavigation(repository ? String(repository.id) : undefined);

  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);

  // ===== Rename handlers =====

  function startRenameFolder(item: EditTarget) {
    setEditMode('rename-folder');
    setEditTarget(item);
    setInputValue(item.name);
  }

  function startRenameResource(item: EditTarget) {
    setEditMode('rename-resource');
    setEditTarget(item);
    setInputValue(item.name);
  }

  async function confirmRename() {
    if (!editTarget || inputValue.trim().length === 0) {
      return;
    }

    const newName = inputValue.trim();
    let success = false;

    if (editMode === 'rename-folder') {
      success = await renameFolder(editTarget.id, newName);
    } else if (editMode === 'rename-resource') {
      success = await renameResource(editTarget.id, newName);
    }

    if (success) {
      cancelEdit();
    }
  }

  // ===== Create folder handlers =====

  function startCreateFolder() {
    setEditMode('create-folder');
    setEditTarget(null);
    setInputValue('');
  }

  async function confirmCreateFolder() {
    const name = inputValue.trim();
    if (name.length === 0) {
      return;
    }

    const success = await createFolder(name);
    if (success) {
      cancelEdit();
    }
  }

  // ===== Move handlers =====

  function startMove(item: EditTarget) {
    setEditMode('move');
    setEditTarget(item);
    setMoveTargetId(null);
  }

  async function confirmMove() {
    if (!editTarget || !moveTargetId) {
      return;
    }

    let success = false;
    if (editTarget.type === 'folder') {
      success = await moveFolder(editTarget.id, moveTargetId);
    } else {
      success = await moveResource(editTarget.id, moveTargetId);
    }

    if (success) {
      cancelEdit();
    }
  }

  // ===== Delete handlers =====

  async function handleDeleteFolder(folderId: string) {
    await deleteFolder(folderId);
  }

  async function handleDeleteResource(resourceId: string) {
    await deleteResource(resourceId);
  }

  // ===== General =====

  function cancelEdit() {
    setEditMode('none');
    setEditTarget(null);
    setInputValue('');
    setMoveTargetId(null);
  }

  function handleItemPress(item: (typeof items)[0]) {
    if (item.type === 'folder') {
      void navigateToFolder(item.id, item.name);
    } else {
      // Navigate to note editor
      router.push(`./note-editor?resourceId=${item.id}`);
    }
  }

  return (
    <PageShell
      eyebrow="Repository"
      title="Folder Browser"
      subtitle="浏览文件夹结构，支持创建、重命名、移动和删除。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <SectionCard title="Navigation">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
          {!isAtRoot && <PrimaryButton label="Go up" onPress={navigateUp} variant="secondary" />}
          <PrimaryButton
            label="To Repository"
            onPress={() => router.push('./repository')}
            variant="ghost"
          />
        </View>
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="需要远程登录才能访问仓库。">
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : !repository ? (
        <SectionCard title="No repository" description="当前账户没有关联仓库。" />
      ) : (
        <>
          {/* Breadcrumbs */}
          <SectionCard title="Location">
            <View style={styles.breadcrumbRow}>
              {breadcrumbs.map((crumb, index) => (
                <View key={crumb.id ?? 'root'} style={styles.breadcrumbItem}>
                  <PrimaryButton
                    label={crumb.name}
                    onPress={() => navigateToFolder(crumb.id, crumb.name)}
                    variant={index === breadcrumbs.length - 1 ? 'solid' : 'ghost'}
                    disabled={index === breadcrumbs.length - 1}
                  />
                  {index < breadcrumbs.length - 1 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {' '}
                      /{' '}
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Actions */}
          <SectionCard title="Actions">
            <View style={styles.actionRow}>
              <PrimaryButton
                label="New folder"
                onPress={startCreateFolder}
                disabled={isMutating || editMode !== 'none'}
              />
            </View>
          </SectionCard>

          {/* Edit panel */}
          {editMode !== 'none' && (
            <SectionCard
              title={
                editMode === 'create-folder'
                  ? 'Create folder'
                  : editMode === 'move'
                    ? `Move: ${editTarget?.name ?? ''}`
                    : `Rename: ${editTarget?.name ?? ''}`
              }
            >
              {editMode === 'move' ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    选择目标文件夹（点击下方文件夹）：
                  </ThemedText>
                  <View style={styles.listColumn}>
                    {items
                      .filter((item) => item.type === 'folder' && item.id !== editTarget?.id)
                      .map((folder) => (
                        <ThemedView
                          key={folder.id}
                          type={moveTargetId === folder.id ? 'tint' : 'backgroundSelected'}
                          style={styles.itemCard}
                        >
                          <PrimaryButton
                            label={folder.name}
                            onPress={() => setMoveTargetId(folder.id)}
                            variant={moveTargetId === folder.id ? 'solid' : 'secondary'}
                          />
                        </ThemedView>
                      ))}
                    {items.filter((i) => i.type === 'folder' && i.id !== editTarget?.id).length ===
                      0 && (
                      <ThemedText type="small" themeColor="textSecondary">
                        当前目录下没有可选择的文件夹。
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.actionRow}>
                    <PrimaryButton
                      label={isMutating ? 'Moving…' : 'Confirm move'}
                      onPress={confirmMove}
                      disabled={isMutating || !moveTargetId}
                    />
                    <PrimaryButton label="Cancel" onPress={cancelEdit} variant="ghost" />
                  </View>
                </>
              ) : (
                <>
                  <PrimaryTextField
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={editMode === 'create-folder' ? 'Folder name' : 'New name'}
                    autoFocus
                  />
                  <View style={styles.actionRow}>
                    <PrimaryButton
                      label={
                        isMutating ? 'Saving…' : editMode === 'create-folder' ? 'Create' : 'Rename'
                      }
                      onPress={editMode === 'create-folder' ? confirmCreateFolder : confirmRename}
                      disabled={isMutating || inputValue.trim().length === 0}
                    />
                    <PrimaryButton label="Cancel" onPress={cancelEdit} variant="ghost" />
                  </View>
                </>
              )}
            </SectionCard>
          )}

          {/* Error display */}
          {error && (
            <SectionCard title="Error">
              <ThemedText type="small" themeColor="warning">
                {error}
              </ThemedText>
            </SectionCard>
          )}

          {/* Contents */}
          <SectionCard
            title={`Contents (${items.length})`}
            description="点击文件夹进入，点击文件打开编辑器。"
          >
            <View style={styles.listColumn}>
              {items.length > 0 ? (
                items.map((item) => (
                  <ThemedView key={item.id} type="backgroundSelected" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <StatusPill label={item.type === 'folder' ? 'Folder' : 'File'} tone="tint" />
                      <ThemedText type="smallBold">{item.name}</ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.path}
                    </ThemedText>
                    {item.type === 'file' && item.size !== undefined && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatBytes(item.size)}
                      </ThemedText>
                    )}
                    <View style={styles.actionRow}>
                      <PrimaryButton
                        label={item.type === 'folder' ? 'Open' : 'Edit'}
                        onPress={() => handleItemPress(item)}
                        variant="secondary"
                        disabled={isMutating}
                      />
                      <PrimaryButton
                        label="Rename"
                        onPress={() =>
                          item.type === 'folder'
                            ? startRenameFolder(item)
                            : startRenameResource(item)
                        }
                        variant="ghost"
                        disabled={isMutating || editMode !== 'none'}
                      />
                      <PrimaryButton
                        label="Move"
                        onPress={() => startMove(item)}
                        variant="ghost"
                        disabled={isMutating || editMode !== 'none'}
                      />
                      <PrimaryButton
                        label="Delete"
                        onPress={() =>
                          item.type === 'folder'
                            ? handleDeleteFolder(item.id)
                            : handleDeleteResource(item.id)
                        }
                        variant="ghost"
                        disabled={isMutating}
                      />
                    </View>
                  </ThemedView>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {isLoading ? 'Loading…' : 'This folder is empty.'}
                </ThemedText>
              )}
            </View>
          </SectionCard>
        </>
      )}
    </PageShell>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listColumn: {
    gap: Spacing.three,
  },
  itemCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
