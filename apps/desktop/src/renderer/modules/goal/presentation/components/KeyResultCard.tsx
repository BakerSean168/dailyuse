/**
 * KeyResultCard Component
 *
 * 关键结果卡片组件 - 展示单个关键结果的进度和操作
 */

import { useState } from 'react';
import type { KeyResult, Goal } from '@dailyuse/goal/domain-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dailyuse/ui-react-shadcn';
import {
  Target,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface KeyResultCardProps {
  keyResult: KeyResult;
  goal?: Goal | null;
  onAddRecord?: (keyResultId: string) => void;
  onDelete?: (keyResultId: string) => void;
  onClick?: (keyResultId: string) => void;
}

export function KeyResultCard({
  keyResult,
  goal,
  onAddRecord,
  onDelete,
  onClick,
}: KeyResultCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = keyResult.progressPercentage >= 100;
  const goalColor = goal?.color || '#3b82f6'; // 默认蓝色

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发卡片点击
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(keyResult.id);
  };

  const handleAddRecord = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddRecord?.(keyResult.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(keyResult.id);
  };

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${isCompleted ? 'border-green-500/50' : 'border-border'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 进度背景�?*/}
      <div
        className="absolute top-0 left-0 h-full opacity-10 transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, ${goalColor} 0%, ${goalColor}88 100%)`,
          width: `${keyResult.progressPercentage}%`,
        }}
      />

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold truncate">
              {keyResult.title}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Target className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                权重: {keyResult.weight}
              </span>
            </div>
          </div>

          {/* 进度圆环 */}
          <div
            className="relative flex items-center justify-center w-12 h-12 rounded-full"
            style={{
              background: `conic-gradient(${goalColor} ${keyResult.progressPercentage * 3.6}deg, rgba(0,0,0,0.1) 0deg)`,
            }}
          >
            <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center">
              <span className="text-xs font-bold">
                {Math.round(keyResult.progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">
        {/* 数值显�?*/}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="font-bold"
              style={{ backgroundColor: `${goalColor}20`, color: goalColor }}
            >
              {keyResult.progress.currentValue}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="font-bold">
              {keyResult.progress.targetValue}
            </Badge>
          </div>

          {/* 操作按钮 */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    style={{ color: goalColor }}
                    onClick={handleAddRecord}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>添加进度记录</TooltipContent>
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
                <TooltipContent>删除关键结果</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* 描述 */}
        {keyResult.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {keyResult.description}
          </p>
        )}

        {/* 聚合方式说明 */}
        {keyResult.calculationExplanation && (
          <div className="text-xs text-muted-foreground/70 mt-2">
            {keyResult.calculationExplanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KeyResultCard;
