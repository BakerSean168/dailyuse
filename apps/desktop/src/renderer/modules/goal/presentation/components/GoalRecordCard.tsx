/**
 * GoalRecordCard Component
 *
 * 目标进度记录卡片组件 - 展示单条进度记录
 */

import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import { Card, CardContent } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dailyuse/ui-react-shadcn';
import { Plus, Clock, FileText, Trash2 } from 'lucide-react';

interface GoalRecordCardProps {
  record: GoalRecordClientDTO;
  goalColor?: string;
  onDelete?: (recordUuid: string) => void;
  onClick?: (recordUuid: string) => void;
}

export function GoalRecordCard({
  record,
  goalColor = '#3b82f6',
  onDelete,
  onClick,
}: GoalRecordCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(record.uuid);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(record.uuid);
  };

  return (
    <Card
      className="group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* 记录�?*/}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: `${goalColor}20` }}
            >
              <Plus className="h-4 w-4" style={{ color: goalColor }} />
            </div>
            <div>
              <div className="text-lg font-bold">{record.value}</div>
              <div className="text-xs text-muted-foreground">本次记录�?/div>
            </div>
          </div>

          {/* 分隔�?*/}
          <div className="h-8 w-px bg-border" />

          {/* 记录时间 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {record.formattedRecordedAt}
            </span>
          </div>

          {/* 删除按钮 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除记录</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 备注信息 */}
        {record.note && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {record.note}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GoalRecordCard;
