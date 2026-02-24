/**
 * StatisticsWidget - 统计数据 Widget
 *
 * 显示�?
 * - �?月完成统�?
 * - 趋势图表（简化版柱状图）
 * - 关键指标
 *
 * @module dashboard/presentation/components/widgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { BarChart3, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardWidget, type WidgetSize } from '../DashboardWidget';

// ============ Types ============

interface DailyStats {
  date: string;
  label: string;
  tasksCompleted: number;
  goalsProgress: number;
}

type TimeRange = 'week' | 'month';

export interface StatisticsWidgetProps {
  /** Widget 尺寸 */
  size?: WidgetSize;
  /** 点击查看更多 */
  onViewMore?: () => void;
  /** 类名 */
  className?: string;
}

// ============ Mock Data ============

const mockWeekData: DailyStats[] = [
  { date: '2024-12-08', label: '周日', tasksCompleted: 3, goalsProgress: 5 },
  { date: '2024-12-09', label: '周一', tasksCompleted: 8, goalsProgress: 12 },
  { date: '2024-12-10', label: '周二', tasksCompleted: 6, goalsProgress: 8 },
  { date: '2024-12-11', label: '周三', tasksCompleted: 10, goalsProgress: 15 },
  { date: '2024-12-12', label: '周四', tasksCompleted: 7, goalsProgress: 10 },
  { date: '2024-12-13', label: '周五', tasksCompleted: 9, goalsProgress: 14 },
  { date: '2024-12-14', label: '周六', tasksCompleted: 5, goalsProgress: 7 },
];

const mockMonthData: DailyStats[] = Array.from({ length: 30 }, (_, i) => ({
  date: `2024-11-${15 + i}`,
  label: `${15 + i}`,
  tasksCompleted: Math.floor(Math.random() * 10) + 2,
  goalsProgress: Math.floor(Math.random() * 15) + 3,
}));

// ============ Component ============

export function StatisticsWidget({
  size = 'medium',
  onViewMore,
  className,
}: StatisticsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [data, setData] = useState<DailyStats[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(timeRange === 'week' ? mockWeekData : mockMonthData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 统计
  const stats = useMemo(() => {
    const totalTasks = data.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const totalProgress = data.reduce((sum, d) => sum + d.goalsProgress, 0);
    const avgTasks = data.length > 0 ? Math.round(totalTasks / data.length) : 0;
    const maxTasks = Math.max(...data.map(d => d.tasksCompleted), 1);
    
    // 趋势计算（比较前后两半）
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half).reduce((sum, d) => sum + d.tasksCompleted, 0);
    const secondHalf = data.slice(half).reduce((sum, d) => sum + d.tasksCompleted, 0);
    const trend = secondHalf - firstHalf;

    return { totalTasks, totalProgress, avgTasks, maxTasks, trend };
  }, [data]);

  // 获取趋势图标和颜�?
  const getTrendInfo = () => {
    if (stats.trend > 0) {
      return { icon: TrendingUp, color: 'text-green-500', label: '上升' };
    } else if (stats.trend < 0) {
      return { icon: TrendingDown, color: 'text-red-500', label: '下降' };
    }
    return { icon: Minus, color: 'text-gray-400', label: '持平' };
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  return (
    <DashboardWidget
      title="统计数据"
      icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
      size={size}
      loading={loading}
      error={error}
      onRefresh={loadData}
      className={className}
      headerActions={
        <>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-2 h-6"></TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2 h-6"></TabsTrigger>
            </TabsList>
          </Tabs>
          {onViewMore && (
            <Button variant="ghost" size="sm" onClick={onViewMore}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </>
      }
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-2xl font-bold text-primary">{stats.totalTasks}</p>
          <p className="text-xs text-muted-foreground">任务完成</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-2xl font-bold text-green-500">{stats.totalProgress}%</p>
          <p className="text-xs text-muted-foreground">目标进度</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-accent">
          <div className="flex items-center justify-center gap-1">
            <TrendIcon className={cn("h-5 w-5", trendInfo.color)} />
            <span className={cn("text-lg font-bold", trendInfo.color)}>
              {Math.abs(stats.trend)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">趋势{trendInfo.label}</p>
        </div>
      </div>

      {/* 简化柱状图 */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">每日完成任务</p>
        <div className="flex items-end gap-1 h-24">
          {(timeRange === 'week' ? data : data.slice(-14)).map((day, index) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "w-full rounded-t transition-all hover:bg-primary",
                  index === data.length - 1 ? "bg-primary" : "bg-primary/60"
                )}
                style={{
                  height: `${(day.tasksCompleted / stats.maxTasks) * 100}%`,
                  minHeight: '4px',
                }}
                title={`${day.label}: ${day.tasksCompleted} 任务`}
              />
              {timeRange === 'week' && (
                <span className="text-[10px] text-muted-foreground">
                  {day.label.slice(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部总结 */}
      <div className="pt-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          日均完成 <span className="font-semibold text-foreground">{stats.avgTasks}</span> 个任务
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <TrendIcon className={cn("h-3 w-3", trendInfo.color)} />
          {trendInfo.label}
        </Badge>
      </div>
    </DashboardWidget>
  );
}

export default StatisticsWidget;
