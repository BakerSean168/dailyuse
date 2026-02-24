/**
 * TaskInfoCard Component
 *
 * 任务信息展示卡片 - 显示任务模板的详细信�?
 * 
 * EPIC-015 重构: 使用 Entity 类型
 */

import type { TaskTemplate } from '@dailyuse/task/domain-client';
import { UrgencyLevel } from '@dailyuse/contracts/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import {
  Calendar,
  Clock,
  Flag,
  Repeat,
  Tag,
  Target,
} from 'lucide-react';

interface TaskInfoCardProps {
  template: TaskTemplate;
  onClick?: (id: string) => void;
}

// 重要性颜�?
const IMPORTANCE_COLORS: Record<string, string> = {
  Vital: 'bg-red-100 text-red-800 border-red-200',
  Important: 'bg-orange-100 text-orange-800 border-orange-200',
  Moderate: 'bg-blue-100 text-blue-800 border-blue-200',
  Minor: 'bg-gray-100 text-gray-800 border-gray-200',
  Trivial: 'bg-gray-50 text-gray-600 border-gray-100',
};

// 紧急度颜色
const URGENCY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-blue-100 text-blue-800',
  None: 'bg-gray-100 text-gray-600',
};

// 状态颜�?
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export function TaskInfoCard({ template, onClick }: TaskInfoCardProps) {
  const handleClick = () => {
    onClick?.(template.id);
  };

  const completionRate = Math.round(template.completionRate * 100);
  const taskColor = template.color || '#3b82f6';

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
      style={
        {
          '--task-color': taskColor,
          borderTopColor: taskColor,
          borderTopWidth: '3px',
        } as React.CSSProperties
      }
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{template.title}</CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          <Badge className={STATUS_COLORS[template.status] || STATUS_COLORS.ACTIVE}>
            {template.statusText}
          </Badge>
        </div>

        {/* Priority Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant="outline"
            className={IMPORTANCE_COLORS[template.importance] || IMPORTANCE_COLORS.Moderate}
          >
            <Flag className="h-3 w-3 mr-1" />
            {template.importanceText}
          </Badge>
          {template.urgency && template.urgency !== UrgencyLevel.None && (
            <Badge className={URGENCY_COLORS[template.urgency] || URGENCY_COLORS[UrgencyLevel.None]}>
              🔥 {template.urgencyText}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Time Display */}
          {template.timeDisplayText && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">{template.timeDisplayText}</span>
            </div>
          )}

          {/* Recurrence */}
          {template.recurrenceText && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Repeat className="h-4 w-4 shrink-0" />
              <span className="truncate">{template.recurrenceText}</span>
            </div>
          )}

          {/* Goal Link */}
          {template.isLinkedToGoal && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4 shrink-0" />
              <span className="truncate">{template.goalLinkText || '关联目标'}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Completion Stats */}
        {template.instanceCount > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">完成</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>已完成 {template.completedInstanceCount} 次</span>
              <span>/ {template.instanceCount} 次</span>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3.5 w-3.5" />
          <span>创建于 {template.formattedCreatedAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskInfoCard;
