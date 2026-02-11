/**
 * ResourceCard Component
 *
 * 资源卡片组件
 * Story 11-6: Auxiliary Modules
 */

import { memo, useMemo } from 'react';
import { FileText, Image, Video, Music, Archive, Code, FileJson, MoreHorizontal, Eye, Download, Trash2, Copy, ExternalLink, type LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface Resource {
  uuid: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

interface ResourceCardProps {
  resource: Resource;
  viewMode?: 'grid' | 'list';
  onView?: (resource: Resource) => void;
  onDownload?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onCopy?: (resource: Resource) => void;
  onOpenExternal?: (resource: Resource) => void;
}

// Icon mapping for resource types
const iconMap: Record<Resource['type'], LucideIcon> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  code: Code,
  other: FileJson,
};

// Get color for resource type
function getTypeColor(type: Resource['type']) {
  switch (type) {
    case 'document':
      return 'bg-blue-100 text-blue-700';
    case 'image':
      return 'bg-green-100 text-green-700';
    case 'video':
      return 'bg-purple-100 text-purple-700';
    case 'audio':
      return 'bg-orange-100 text-orange-700';
    case 'archive':
      return 'bg-gray-100 text-gray-700';
    case 'code':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// Format file size
function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Type labels
const typeLabels: Record<Resource['type'], string> = {
  document: '文档',
  image: '图片',
  video: '视频',
  audio: '音频',
  archive: '压缩�?,
  code: '代码',
  other: '其他',
};

export const ResourceCard = memo(function ResourceCard({
  resource,
  viewMode = 'grid',
  onView,
  onDownload,
  onDelete,
  onCopy,
  onOpenExternal,
}: ResourceCardProps) {
  // 使用 useMemo 避免在每次渲染时重新获取图标
  const Icon = useMemo(() => iconMap[resource.type] || FileJson, [resource.type]);
  const typeColor = getTypeColor(resource.type);

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
        {/* Icon or Thumbnail */}
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
            typeColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{resource.name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{typeLabels[resource.type]}</span>
            {resource.size && (
              <>
                <span>·</span>
                <span>{formatFileSize(resource.size)}</span>
              </>
            )}
            <span>·</span>
            <span>
              {format(new Date(resource.createdAt), 'MM/dd', { locale: zhCN })}
            </span>
          </div>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="hidden md:flex gap-1">
            {resource.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(resource)}>
              <Eye className="mr-2 h-4 w-4" />
              预览
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload?.(resource)}>
              <Download className="mr-2 h-4 w-4" />
              下载
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy?.(resource)}>
              <Copy className="mr-2 h-4 w-4" />
              复制链接
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenExternal?.(resource)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              外部打开
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(resource)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Grid view
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-0">
        {/* Thumbnail / Preview */}
        <div
          className="relative h-32 bg-muted flex items-center justify-center"
          onClick={() => onView?.(resource)}
        >
          {resource.thumbnailUrl && resource.type === 'image' ? (
            <img
              src={resource.thumbnailUrl}
              alt={resource.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className="h-12 w-12 text-muted-foreground/50" />
          )}

          {/* Type Badge */}
          <Badge
            className={cn('absolute top-2 left-2 text-xs', typeColor)}
            variant="secondary"
          >
            {typeLabels[resource.type]}
          </Badge>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(resource);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(resource);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h4 className="font-medium truncate text-sm" title={resource.name}>
            {resource.name}
          </h4>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{formatFileSize(resource.size)}</span>
            <span>
              {format(new Date(resource.createdAt), 'MM/dd HH:mm', {
                locale: zhCN,
              })}
            </span>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default ResourceCard;
