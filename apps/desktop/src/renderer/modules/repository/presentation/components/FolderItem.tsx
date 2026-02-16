/**
 * FolderItem Component
 *
 * 文件夹列表项
 * Story-011: Repository Module UI
 */

import { memo } from 'react';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

interface FolderItemProps {
  folder: FolderClientDTO;
  onClick: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FolderItem = memo(function FolderItem({
  folder,
  onClick,
  onRename,
  onDelete,
}: FolderItemProps) {
  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(folder.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除文件夹 "${folder.name}" 及其所有内容吗？`)) {
      onDelete(folder.id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors"
      onClick={() => onClick(folder.id)}
    >
      {/* 文件夹图标 */}
      <div className="text-xl flex-shrink-0">📁</div>

      {/* 名称 */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-900 truncate">{folder.name}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleRename}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="重命名"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

export default FolderItem;
