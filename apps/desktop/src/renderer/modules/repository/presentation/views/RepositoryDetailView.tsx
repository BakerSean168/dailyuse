/**
 * RepositoryDetailView Component
 *
 * 仓库详情/文件浏览页面
 * Story-011: Repository Module UI
 */

import { useState, useCallback, useMemo } from 'react';
import { useRepository } from '../hooks/useRepository';
import { Breadcrumb, SearchBar, FolderItem, ResourceItem } from '../components';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export function RepositoryDetailView() {
  const {
    currentRepository,
    currentFolder,
    folders,
    resources,
    loading,
    error,
    selectFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    renameResource,
    deleteResource,
    search,
    goToRoot,
    refresh,
  } = useRepository();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ResourceClientDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<{
    type: 'folder' | 'resource';
    id: string;
    name: string;
  } | null>(null);

  // 面包屑路径
  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (currentRepository) {
      items.push({ id: currentRepository.id, name: currentRepository.name });
    }
    if (currentFolder) {
      items.push({ id: currentFolder.id, name: currentFolder.name });
    }
    return items;
  }, [currentRepository, currentFolder]);

  // 搜索
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await search(query);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    },
    [search]
  );

  // 创建文件夹
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName.trim(), currentFolder?.id);
    setIsCreatingFolder(false);
    setNewFolderName('');
  }, [newFolderName, currentFolder, createFolder]);

  // 重命名
  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameTarget.name.trim()) return;

    if (renameTarget.type === 'folder') {
      await renameFolder(renameTarget.id, renameTarget.name.trim());
    } else {
      await renameResource(renameTarget.id, renameTarget.name.trim());
    }

    setRenameTarget(null);
  }, [renameTarget, renameFolder, renameResource]);

  // 打开重命名对话框
  const openRenameDialog = useCallback(
    (type: 'folder' | 'resource', id: string) => {
      const item =
        type === 'folder'
          ? folders.find((f) => f.id === id)
          : resources.find((r) => r.id === id);

      if (item) {
        setRenameTarget({ type, id, name: item.name });
      }
    },
    [folders, resources]
  );

  // 资源点击
  const handleResourceClick = useCallback((id: string) => {
    // TODO: 打开资源详情或编辑器
    console.log('Open resource:', id);
  }, []);

  if (!currentRepository) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">请先选择一个仓库</p>
      </div>
    );
  }

  // 显示搜索结果还是普通列表
  const showSearchResults = searchQuery && searchResults.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb
          items={breadcrumbItems}
          onNavigate={selectFolder}
          onGoHome={goToRoot}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新"
          >
            🔄
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            📁 新建文件夹
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <SearchBar
          placeholder="搜索资源..."
          onSearch={handleSearch}
          isLoading={isSearching}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 内容区域 */}
      {!loading && (
        <div className="space-y-1">
          {showSearchResults ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  搜索 "{searchQuery}" 找到 {searchResults.length} 个结果
                </p>
              </div>
              {searchResults.map((resource) => (
                <ResourceItem
                  key={resource.id}
                  resource={resource}
                  onClick={handleResourceClick}
                  onRename={(id) => openRenameDialog('resource', id)}
                  onDelete={deleteResource}
                />
              ))}
            </>
          ) : (
            <>
              {/* 文件夹列表 */}
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  onClick={selectFolder}
                  onRename={(id) => openRenameDialog('folder', id)}
                  onDelete={deleteFolder}
                />
              ))}

              {/* 资源列表 */}
              {resources.map((resource) => (
                <ResourceItem
                  key={resource.id}
                  resource={resource}
                  onClick={handleResourceClick}
                  onRename={(id) => openRenameDialog('resource', id)}
                  onDelete={deleteResource}
                />
              ))}

              {/* 空状态 */}
              {folders.length === 0 && resources.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📂</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    文件夹为空
                  </h3>
                  <p className="text-gray-600">创建文件夹或上传资源来开始</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 创建文件夹对话框 */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">新建文件夹</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="文件夹名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名对话框 */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              重命名{renameTarget.type === 'folder' ? '文件夹' : '资源'}
            </h2>
            <input
              type="text"
              value={renameTarget.name}
              onChange={(e) =>
                setRenameTarget({ ...renameTarget, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRename}
                disabled={!renameTarget.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepositoryDetailView;
