/**
 * GoalWidget - 目标进度摘要 Widget
 *
 * 显示�?
 * - 活跃目标数量
 * - 总体进度
 * - 最近更新的目标列表
 *
 * @module dashboard/presentation/components/widgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Progress,
  Badge,
  Button,
  ScrollArea,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { Target, TrendingUp, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { DashboardWidget, type WidgetSize } from '../DashboardWidget';

// ============ Types ============

interface GoalSummary {
  id: string;
  title: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  updatedAt: Date;
}

export interface GoalWidgetProps {
  /** Widget 尺寸 */
  size?: WidgetSize;
  /** 点击查看更多 */
  onViewMore?: () => void;
  /** 点击目标 */
  onGoalClick?: (goalId: string) => void;
  /** 类名 */
  className?: string;
}

// ============ Mock Data ============

const mockGoals: GoalSummary[] = [
  { id: '1', title: '完成项目迁移', progress: 75, status: 'active', updatedAt: new Date() },
  { id: '2', title: '学习新技术栈', progress: 45, status: 'active', updatedAt: new Date(Date.now() - 86400000) },
  { id: '3', title: '健身计划', progress: 30, status: 'active', updatedAt: new Date(Date.now() - 172800000) },
];

// ============ Component ============

export function GoalWidget({
  size = 'small',
  onViewMore,
  onGoalClick,
  className,
}: GoalWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalSummary[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: 实际调用 API
      await new Promise(resolve => setTimeout(resolve, 500));
      setGoals(mockGoals);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 统计
  const stats = useMemo(() => {
    const activeCount = goals.filter(g => g.status === 'active').length;
    const completedCount = goals.filter(g => g.status === 'completed').length;
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;
    return { activeCount, completedCount, avgProgress };
  }, [goals]);

  // 获取状态颜�?
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-500';
    if (progress >= 50) return 'text-blue-500';
    if (progress >= 30) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <DashboardWidget
      title="目标进度"
      icon={<Target className="h-5 w-5 text-primary" />}
      size={size}
      loading={loading}
      error={error}
      onRefresh={loadData}
      className={className}
      headerActions={
        onViewMore && (
          <Button variant="ghost" size="sm" onClick={onViewMore}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )
      }
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.activeCount}</p>
          <p className="text-xs text-muted-foreground">进行</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{stats.completedCount}</p>
          <p className="text-xs text-muted-foreground">已完</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.avgProgress}%</p>
          <p className="text-xs text-muted-foreground">平均进度</p>
        </div>
      </div>

      {/* 目标列表 */}
      <ScrollArea className="h-[150px]">
        <div className="space-y-3">
          {goals.slice(0, 5).map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onGoalClick?.(goal.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <Progress value={goal.progress} className="h-2 mt-1" />
              </div>
              <span className={cn("text-sm font-semibold", getProgressColor(goal.progress))}>
                {goal.progress}%
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 总体进度 */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>总体进度</span>
        </div>
        <Badge variant="secondary">{stats.avgProgress}%</Badge>
      </div>
    </DashboardWidget>
  );
}

export default GoalWidget;
