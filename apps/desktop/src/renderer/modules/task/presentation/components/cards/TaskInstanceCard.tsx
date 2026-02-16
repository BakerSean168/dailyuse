/**
 * TaskInstanceCard Component
 *
 * 任务实例卡片 - 显示单个任务实例的状态和操作
 * 
 * EPIC-015 重构: 使用 Entity 类型
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TaskInstance, TaskTemplate } from '@dailyuse/task/domain-client';
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
  CheckCircle,
  Circle,
  Clock,
  MoreHorizontal,
  SkipForward,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dailyuse/ui-react-shadcn';

interface TaskInstanceCardProps {
  instance: TaskInstance;
  template?: TaskTemplate | null;
  onComplete?: (uuid: string) => void;
  onSkip?: (uuid: string) => void;
  onClick?: (uuid: string) => void;
}

// 状态颜色配�?
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Circle },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  SKIPPED: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: SkipForward },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: X },
};

export function TaskInstanceCard({
  instance,
  template,
  onComplete,
  onSkip,
  onClick,
}: TaskInstanceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = STATUS_COLORS[instance.status] || STATUS_COLORS.PENDING;
  const StatusIcon = statusConfig.icon;

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

    if (timeConfig.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
      const startHours = Math.floor(timeConfig.timeRange.start / 60);
      const startMinutes = timeConfig.timeRange.start % 60;
      const endHours = Math.floor(timeConfig.timeRange.end / 60);
      const endMinutes = timeConfig.timeRange.end % 60;
      return `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }

    return '全天';
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border bg-card transition-all cursor-pointer
        hover:shadow-md hover:border-primary/30
        ${instance.isCompleted ? 'opacity-70' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Complete Button / Status Icon */}
      <div className="shrink-0">
        {instance.isPending ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                  onClick={handleComplete}
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>完成任务</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.text}`} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${instance.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {template?.title || '未知任务'}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {instance.isCompleted
              ? `完成`${instance.actualEndTime ? format(instance.actualEndTime, 'HH:mm', { locale: zhCN }) : ''}`
              : getTimeLabel()}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <Badge className={`${statusConfig.bg} ${statusConfig.text} shrink-0`}>
        {instance.statusText}
      </Badge>

      {/* Actions (show on hover for pending tasks) */}
      {instance.isPending && (
        <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
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

export default TaskInstanceCard;
