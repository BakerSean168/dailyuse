/**
 * GoalInfoCard Component
 *
 * 目标信息展示卡片组件 - 展示目标的整体信息和关键结果列表
 * 用于首页或列表视图中的紧凑展�?
 */

import { useState } from 'react';
import type { Goal } from '@dailyuse/goal/domain-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import { ScrollArea, ScrollBar } from '@dailyuse/ui-react-shadcn';
import { Target, TrendingUp } from 'lucide-react';
import { KeyResultCard } from './KeyResultCard';

interface GoalInfoCardProps {
  goal: Goal;
  onClick?: (goalId: string) => void;
  onKeyResultClick?: (keyResultId: string) => void;
  onAddRecord?: (keyResultId: string) => void;
  onDeleteKeyResult?: (keyResultId: string) => void;
}

export function GoalInfoCard({
  goal,
  onClick,
  onKeyResultClick,
  onAddRecord,
  onDeleteKeyResult,
}: GoalInfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const goalColor = goal.color || '#3b82f6';
  
  // 计算今日进度 (TODO: 实现实际逻辑)
  const todayProgress = 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是关键结果卡片区域，不触发目标点击
    if ((e.target as HTMLElement).closest('.key-results-section')) {
      return;
    }
    onClick?.(goal.id);
  };

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={
        {
          '--goal-color': goalColor,
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 顶部装饰�?*/}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
        style={{
          background: `linear-gradient(90deg, ${goalColor}, transparent)`,
        }}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate mb-1">
              {goal.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: `${goalColor}20`, color: goalColor }}
            >
              <Target className="h-3 w-3 mr-1" />
              进行�?
            </Badge>
          </div>

          {/* 今日进度徽章 */}
          {todayProgress > 0 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-pulse">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{Math.round(todayProgress)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {/* 主进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">完成</span>
            <span
              className="text-sm font-bold"
              style={{ color: goalColor }}
            >
              {goal.overallProgress}%
            </span>
          </div>
          <Progress
            value={goal.overallProgress}
            className="h-2"
            style={
              {
                '--progress-color': goalColor,
              } as React.CSSProperties
            }
          />
        </div>

        {/* 关键结果水平滚动区域 */}
        <div className="key-results-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" style={{ color: goalColor }} />
              <span className="text-sm font-medium">关键结果</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {goal.keyResultCount}
            </Badge>
          </div>

          {/* 水平滚动的关键结果容�?*/}
          {goal.keyResults && goal.keyResults.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {goal.keyResults.map((keyResult) => (
                  <div key={keyResult.id} className="w-64 shrink-0">
                    <KeyResultCard
                      keyResult={keyResult}
                      goal={goal}
                      onClick={onKeyResultClick}
                      onAddRecord={onAddRecord}
                      onDelete={onDeleteKeyResult}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              暂无关键结果
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GoalInfoCard;
