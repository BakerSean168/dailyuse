/**
 * ScheduleEventList Component
 *
 * 日程事件列表组件
 * 功能�?
 * 1. 显示日程事件列表
 * 2. 时间排序
 * 3. 快速操作（编辑、删除）
 * 4. 冲突提示
 */

import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleClientDTO } from '../stores/scheduleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { ScrollArea } from '@dailyuse/ui-react-shadcn';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface ScheduleEventListProps {
  schedules: ScheduleClientDTO[];
  isLoading?: boolean;
  title?: string;
  showCreateButton?: boolean;
  onScheduleClick?: (schedule: ScheduleClientDTO) => void;
  onDelete?: (uuid: string) => void;
  onCreate?: () => void;
}

// ===================== 工具函数 =====================

function formatDateTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'M月d�?HH:mm', { locale: zhCN });
}

function getPriorityColor(priority?: number | null): string {
  if (!priority) return 'bg-gray-500';
  if (priority >= 4) return 'bg-red-500';
  if (priority >= 3) return 'bg-orange-500';
  if (priority >= 2) return 'bg-yellow-500';
  return 'bg-blue-500';
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

// ===================== 组件 =====================

export function ScheduleEventList({
  schedules,
  isLoading = false,
  title = '日程事件',
  showCreateButton = true,
  onScheduleClick,
  onDelete,
  onCreate,
}: ScheduleEventListProps) {
  // 按开始时间排�?
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const timeA = typeof a.startTime === 'number' ? a.startTime : new Date(a.startTime).getTime();
      const timeB = typeof b.startTime === 'number' ? b.startTime : new Date(b.startTime).getTime();
      return timeA - timeB;
    });
  }, [schedules]);

  const handleDelete = useCallback((e: React.MouseEvent, uuid: string) => {
    e.stopPropagation();
    onDelete?.(uuid);
  }, [onDelete]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showCreateButton && (
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4 mr-1" />
              创建日程
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">加载�?..</div>
          </div>
        ) : sortedSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-50" />
            <p>暂无日程</p>
            <p className="text-xs mt-1">点击上方按钮创建第一个日�?/p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {sortedSchedules.map((schedule) => (
                <div
                  key={schedule.uuid}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onScheduleClick?.(schedule)}
                >
                  {/* 优先级指示器 */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getPriorityColor(
                      schedule.priority
                    )}`}
                  >
                    <Calendar className="h-5 w-5 text-white" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{schedule.title}</span>
                      {schedule.hasConflict && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          冲突
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {/* 时间 */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(schedule.startTime)}</span>
                        <span>-</span>
                        <span>{formatDateTime(schedule.endTime)}</span>
                        {schedule.duration && (
                          <span className="ml-1">({formatDuration(schedule.duration)})</span>
                        )}
                      </div>

                      {/* 地点 */}
                      {schedule.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{schedule.location}</span>
                        </div>
                      )}

                      {/* 描述 */}
                      {schedule.description && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{schedule.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => handleDelete(e, schedule.uuid)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default ScheduleEventList;
