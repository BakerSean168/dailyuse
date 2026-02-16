/**
 * DAGControls Component
 *
 * DAG 图控制组�?- 缩放、布局、导�?
 * Story 11-7: Advanced Features
 */

import { memo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, RefreshCw, Grid3X3, GitBranch, CircleDot } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

export type LayoutType = 'tree' | 'radial' | 'force';

interface DAGControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onRefresh?: () => void;
  onLayoutChange?: (layout: LayoutType) => void;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
  currentLayout?: LayoutType;
  zoomLevel?: number;
  className?: string;
  showLayoutOptions?: boolean;
  showExportOptions?: boolean;
}

export const DAGControls = memo(function DAGControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onRefresh,
  onLayoutChange,
  onExport,
  currentLayout = 'tree',
  zoomLevel = 100,
  className,
  showLayoutOptions = true,
  showExportOptions = true,
}: DAGControlsProps) {
  const layoutIcons: Record<LayoutType, typeof Grid3X3> = {
    tree: GitBranch,
    radial: CircleDot,
    force: Grid3X3,
  };

  const layoutLabels: Record<LayoutType, string> = {
    tree: '树形布局',
    radial: '放射布局',
    force: '力导向布局',
  };

  const LayoutIcon = layoutIcons[currentLayout];

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm',
          className
        )}
      >
        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>缩小</TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground w-12 text-center">
          {zoomLevel}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>放大</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitView}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>适应视图</TooltipContent>
        </Tooltip>

        {showLayoutOptions && (
          <>
            <Separator orientation="vertical" className="h-6" />

            {/* Layout Selector */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <LayoutIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>布局方式</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuLabel>布局方式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(layoutLabels).map(([key, label]) => {
                  const Icon = layoutIcons[key as LayoutType];
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => onLayoutChange?.(key as LayoutType)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                      {currentLayout === key && (
                        <span className="ml-auto text-primary"></span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>刷新</TooltipContent>
        </Tooltip>

        {showExportOptions && (
          <>
            <Separator orientation="vertical" className="h-6" />

            {/* Export Options */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>导出</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuLabel>导出格式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExport?.('png')}>
                  导出�?PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('svg')}>
                  导出�?SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('json')}>
                  导出�?JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </TooltipProvider>
  );
});

export default DAGControls;
