/**
 * RepositoryExplorer Component
 *
 * 仓库浏览器视�?
 * Story 11-6: Auxiliary Modules
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Grid3X3,
  List,
  Upload,
  FolderPlus,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  ChevronRight,
  Home,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  Separator,
  Skeleton,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@dailyuse/ui-react-shadcn';

import { FolderTree, type FolderNode } from '../components/FolderTree';
import { ResourceCard, type Resource } from '../components/ResourceCard';

interface RepositoryExplorerProps {
  repositoryName?: string;
  folders: FolderNode[];
  resources: Resource[];
  currentFolderId?: string;
  breadcrumbs?: { id: string; name: string }[];
  loading?: boolean;
  onFolderSelect?: (folder: FolderNode) => void;
  onResourceView?: (resource: Resource) => void;
  onResourceDownload?: (resource: Resource) => void;
  onResourceDelete?: (resource: Resource) => void;
  onUpload?: () => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';
type TypeFilter = 'all' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';

export function RepositoryExplorer({
  repositoryName = '我的仓库',
  folders,
  resources,
  currentFolderId,
  breadcrumbs = [],
  loading = false,
  onFolderSelect,
  onResourceView,
  onResourceDownload,
  onResourceDelete,
  onUpload,
  onCreateFolder,
  onRefresh,
}: RepositoryExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let result = [...resources];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [resources, searchQuery, sortBy, sortOrder, typeFilter]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleBreadcrumbClick = useCallback(
    (id: string) => {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        onFolderSelect?.(folder);
      }
    },
    [folders, onFolderSelect]
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{repositoryName}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onUpload}>
              <Upload className="h-4 w-4 mr-1" />
              上传
            </Button>
            <Button variant="outline" size="sm" onClick={() => onCreateFolder?.(currentFolderId || null)}>
              <FolderPlus className="h-4 w-4 mr-1" />
              新建文件�?
            </Button>
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索资源..."
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="document">文档</SelectItem>
              <SelectItem value="image">图片</SelectItem>
              <SelectItem value="video">视频</SelectItem>
              <SelectItem value="audio">音频</SelectItem>
              <SelectItem value="archive">压缩</SelectItem>
              <SelectItem value="code">代码</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 mr-1" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-1" />
                )}
                排序
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>排序方式</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                名称 {sortBy === 'name' && ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                日期 {sortBy === 'date' && ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('size')}>
                大小 {sortBy === 'size' && ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('type')}>
                类型 {sortBy === 'type' && ''}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                {sortOrder === 'asc' ? '降序' : '升序'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar - Folder Tree */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3">文件</h3>
              <FolderTree
                nodes={folders}
                selectedId={currentFolderId}
                onSelect={onFolderSelect}
                onCreateFolder={onCreateFolder}
              />
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 px-4 py-2 border-b text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleBreadcrumbClick('')}
                >
                  <Home className="h-4 w-4" />
                </Button>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleBreadcrumbClick(crumb.id)}
                      disabled={index === breadcrumbs.length - 1}
                    >
                      {crumb.name}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Resources */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                // Loading skeletons
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                      : 'space-y-2'
                  }
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={viewMode === 'grid' ? 'h-48' : 'h-16'}
                    />
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">暂无资源</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery
                      ? '没有找到匹配的资'
                      : '点击上传按钮添加您的第一个资'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={onUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      上传资源
                    </Button>
                  )}
                </div>
              ) : (
                // Resource list
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                      : 'space-y-1'
                  }
                >
                  {filteredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      viewMode={viewMode}
                      onView={onResourceView}
                      onDownload={onResourceDownload}
                      onDelete={onResourceDelete}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer Stats */}
            <div className="border-t px-4 py-2 text-sm text-muted-foreground">
              {filteredResources.length} 个资�?
              {searchQuery && ` · 搜索: "${searchQuery}"`}
              {typeFilter !== 'all' && ` · 类型: ${typeFilter}`}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default RepositoryExplorer;
