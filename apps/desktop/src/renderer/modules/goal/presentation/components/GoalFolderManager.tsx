/**
 * Goal Folder Manager Component
 *
 * 目标文件夹管理组件 - 创建、编辑、删除文件夹
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GoalFolder } from '@dailyuse/domain-client/goal';
import { useGoalFolder } from '../hooks';

interface GoalFolderManagerProps {
  open: boolean;
  onClose: () => void;
  onFolderSelect?: (folder: GoalFolder | null) => void;
  selectedFolderUuid?: string | null;
}

export function GoalFolderManager({
  open,
  onClose,
  onFolderSelect,
  selectedFolderUuid,
}: GoalFolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolder, setEditingFolder] = useState<GoalFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 使用 useGoalFolder hook - 内部会自动加载数据
  const { 
    folders, 
    loading, 
    error: hookError, 
    loadFolders: loadFoldersAction, 
    createFolder, 
    updateFolder, 
    deleteFolder 
  } = useGoalFolder();

  // 合并错误状态
  const error = localError || hookError;

  // 使用 ref 保存函数引用，避免循环依赖
  const loadFoldersRef = useRef(loadFoldersAction);
  loadFoldersRef.current = loadFoldersAction;

  const loadFolders = useCallback(async () => {
    try {
      setLocalError(null);
      await loadFoldersRef.current();
    } catch (err) {
      console.error('[GoalFolderManager] Failed to load folders:', err);
      setLocalError('加载文件夹失败');
    }
  }, []); // 空依赖，使用 ref

  // 不再自动加载 - folders 数据由 GoalListView 在初始化时加载
  // GoalFolderManager 只是读取和操作已有的数据

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;

    try {
      setIsSaving(true);
      await createFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
      });
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreating(false);
      // createFolder 已更新 store，无需再调 loadFolders
    } catch (err) {
      console.error('[GoalFolderManager] Failed to create folder:', err);
      setLocalError('创建文件夹失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      setIsSaving(true);
      await updateFolder(editingFolder.uuid, {
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
      });
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderDescription('');
      // updateFolder 已更新 store，无需再调 loadFolders
    } catch (err) {
      console.error('[GoalFolderManager] Failed to update folder:', err);
      setLocalError('更新文件夹失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (folder: GoalFolder) => {
    const confirmed = window.confirm(`确定要删除文件夹“${folder.name}”吗？文件夹内的目标不会被删除。`);
    if (!confirmed) return;

    try {
      await deleteFolder(folder.uuid);
      // deleteFolder 已更新 store，无需再调 loadFolders
    } catch (err) {
      console.error('[GoalFolderManager] Failed to delete folder:', err);
      setLocalError('删除文件夹失败');
    }
  };

  const handleEdit = (folder: GoalFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDescription(folder.description ?? '');
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setIsCreating(false);
    setNewFolderName('');
    setNewFolderDescription('');
  };

  const handleSelect = (folder: GoalFolder | null) => {
    onFolderSelect?.(folder);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">目标文件夹</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Create/Edit Form */}
              {(isCreating || editingFolder) && (
                <div className="space-y-3 p-3 border rounded-md bg-secondary/30">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="文件夹名称"
                    className="w-full p-2 border rounded-md text-sm"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="描述（可选）"
                    className="w-full p-2 border rounded-md text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-3 py-1.5 text-sm border rounded hover:bg-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={editingFolder ? handleUpdate : handleCreate}
                      disabled={isSaving || !newFolderName.trim()}
                      className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : editingFolder ? '更新' : '创建'}
                    </button>
                  </div>
                </div>
              )}

              {/* Folder List */}
              <div className="space-y-2">
                {/* All Goals Option */}
                <div
                  onClick={() => handleSelect(null)}
                  className={`
                    p-3 border rounded-md cursor-pointer transition-colors
                    ${selectedFolderUuid === null ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📁</span>
                    <span className="font-medium">全部目标</span>
                  </div>
                </div>

                {folders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    还没有文件夹
                  </div>
                ) : (
                  folders.map((folder) => (
                    <div
                      key={folder.uuid}
                      className={`
                        p-3 border rounded-md transition-colors
                        ${selectedFolderUuid === folder.uuid ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelect(folder)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📂</span>
                            <span className="font-medium">{folder.name}</span>
                          </div>
                          {folder.description && (
                            <p className="text-sm text-muted-foreground mt-1 ml-7">
                              {folder.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(folder);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                            title="编辑"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(folder);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          {!isCreating && !editingFolder && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              + 新建文件夹
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalFolderManager;
