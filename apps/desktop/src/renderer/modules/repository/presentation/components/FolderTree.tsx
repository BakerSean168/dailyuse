/**
 * FolderTree Component
 *
 * 文件夹树形结构组�?
 * Story 11-6: Auxiliary Modules
 */

import { useState, useCallback, memo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

export interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  icon?: string;
  resourceCount?: number;
}

interface FolderTreeProps {
  nodes: FolderNode[];
  selectedId?: string;
  onSelect?: (node: FolderNode) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRename?: (node: FolderNode) => void;
  onDelete?: (node: FolderNode) => void;
  className?: string;
}

interface FolderItemProps {
  node: FolderNode;
  level: number;
  selectedId?: string;
  onSelect?: (node: FolderNode) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRename?: (node: FolderNode) => void;
  onDelete?: (node: FolderNode) => void;
}

const FolderItem = memo(function FolderItem({
  node,
  level,
  selectedId,
  onSelect,
  onCreateFolder,
  onRename,
  onDelete,
}: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';

  const handleSelect = useCallback(() => {
    onSelect?.(node);
  }, [node, onSelect]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  const handleCreateFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateFolder?.(node.id);
  }, [node.id, onCreateFolder]);

  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRename?.(node);
  }, [node, onRename]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(node);
  }, [node, onDelete]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Toggle */}
        {isFolder && hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={handleToggle}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
          )
        ) : (
          <File className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 truncate text-sm">{node.name}</span>

        {/* Resource Count */}
        {isFolder && node.resourceCount !== undefined && node.resourceCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {node.resourceCount}
          </span>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isFolder && (
              <>
                <DropdownMenuItem onClick={handleCreateFolder}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建子文件夹
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleRename}>
              <Edit2 className="mr-2 h-4 w-4" />
              重命�?
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isFolder && hasChildren && (
        <CollapsibleContent>
          {node.children?.map((child) => (
            <FolderItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
});

export function FolderTree({
  nodes,
  selectedId,
  onSelect,
  onCreateFolder,
  onRename,
  onDelete,
  className,
}: FolderTreeProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      {/* Root level add button */}
      {onCreateFolder && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => onCreateFolder(null)}
        >
          <Plus className="h-4 w-4" />
          新建文件�?
        </Button>
      )}

      {/* Tree nodes */}
      {nodes.map((node) => (
        <FolderItem
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>暂无文件</p>
        </div>
      )}
    </div>
  );
}

export default FolderTree;
