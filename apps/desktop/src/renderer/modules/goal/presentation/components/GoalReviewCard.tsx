/**
 * GoalReviewCard Component
 *
 * 目标复盘卡片组件 - 展示单条复盘记录
 */

import type { GoalReviewClientDTO } from '@dailyuse/contracts/goal';
import { ReviewType } from '@dailyuse/contracts/goal';
import { Card, CardContent } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dailyuse/ui-react-shadcn';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Clock,
  Eye,
  FileText,
  Star,
  Trash2,
} from 'lucide-react';

interface GoalReviewCardProps {
  review: GoalReviewClientDTO;
  goalColor?: string;
  onView?: (reviewUuid: string) => void;
  onDelete?: (reviewUuid: string) => void;
}

// 复盘类型配置
const reviewTypeConfig: Record<ReviewType, {
  label: string;
  color: string;
  icon: typeof Calendar;
}> = {
  [ReviewType.WEEKLY]: {
    label: '周复',
    color: 'text-blue-600 bg-blue-100',
    icon: Calendar,
  },
  [ReviewType.MONTHLY]: {
    label: '月复',
    color: 'text-purple-600 bg-purple-100',
    icon: CalendarDays,
  },
  [ReviewType.QUARTERLY]: {
    label: '季度复盘',
    color: 'text-orange-600 bg-orange-100',
    icon: CalendarRange,
  },
  [ReviewType.ANNUAL]: {
    label: '年度复盘',
    color: 'text-red-600 bg-red-100',
    icon: CalendarCheck,
  },
  [ReviewType.ADHOC]: {
    label: '临时复盘',
    color: 'text-gray-600 bg-gray-100',
    icon: BookOpen,
  },
};

export function GoalReviewCard({
  review,
  goalColor = '#3b82f6',
  onView,
  onDelete,
}: GoalReviewCardProps) {
  const typeConfig = reviewTypeConfig[review.type] || reviewTypeConfig[ReviewType.ADHOC];
  const TypeIcon = typeConfig.icon;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(review.uuid);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(review.uuid);
  };

  // 渲染评分星星
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= review.rating
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-muted-foreground/30'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 左侧信息 */}
          <div className="flex-1 min-w-0">
            {/* 标题和类�?*/}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <h4 className="font-medium truncate">{review.summary}</h4>
              <Badge variant="secondary" className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
            </div>

            {/* 时间和评�?*/}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{review.formattedReviewedAt}</span>
              </div>
              <div className="flex items-center gap-1">
                {renderStars()}
              </div>
            </div>

            {/* 成果预览 */}
            {review.achievements && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  成果: {review.achievements.substring(0, 100)}
                  {review.achievements.length > 100 && '...'}
                </span>
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={handleView}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                </TooltipTrigger>
                <TooltipContent>查看详情</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>删除记录</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GoalReviewCard;
