/**
 * DraggableTaskCard Component
 *
 * 可拖拽的任务卡片 - 支持拖拽排序
 * 使用 @dnd-kit/sortable
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-client';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dailyuse/ui-react-shadcn';
import {
  Check,
  Circle,
  Clock,
  GripVertical,
  MoreHorizontal,
  SkipForward,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dailyuse/ui-react-shadcn';

interface DraggableTaskCardProps {
  id: string;
  instance: TaskInstance;
  template?: TaskTemplate | null;
  onComplete?: (uuid: string) => void;
  onSkip?: (uuid: string) => void;
  onClick?: (uuid: string) => void;
}

// 状态颜色配�?
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
  SKIPPED: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function DraggableTaskCard({
  id,
  instance,
  template,
  onComplete,
  onSkip,
  onClick,
}: DraggableTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusConfig = STATUS_COLORS[instance.status] || STATUS_COLORS.PENDING;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(instance.uuid);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkip?.(instance.uuid);
  };

  const handleClick = () => {
    onClick?.(instance.uuid);
  };

  // 格式化时间显�?
  const getTimeLabel = () => {
    const timeConfig = instance.timeConfig;

    if (timeConfig.timeType === 'ALL_DAY') {
      return '全天';
    }

    if (timeConfig.timeType === 'TIME_POINT' && timeConfig.timePoint != null) {
      const hours = Math.floor(timeConfig.timePoint / 60);
      const minutes = timeConfig.timePoint % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return '全天';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-3 rounded-lg border bg-card transition-all
        hover:shadow-md hover:border-primary/30
        ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
        ${instance.isCompleted ? 'opacity-70' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Complete Button / Status Indicator */}
      <div className="shrink-0">
        {instance.isPending ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full hover:bg-green-100 hover:text-green-600"
                  onClick={handleComplete}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>完成任务</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
            <Check className={`h-4 w-4 ${statusConfig.text}`} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm truncate ${instance.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {template?.title || '未知任务'}
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{getTimeLabel()}</span>
        </div>
      </div>

      {/* Status Badge */}
      <Badge className={`${statusConfig.bg} ${statusConfig.text} text-xs shrink-0`}>
        {instance.statusText}
      </Badge>

      {/* Actions Menu */}
      {instance.isPending && (
        <div className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleComplete}>
                <Check className="h-4 w-4 mr-2" />
                完成
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-2" />
                跳过
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

export default DraggableTaskCard;
