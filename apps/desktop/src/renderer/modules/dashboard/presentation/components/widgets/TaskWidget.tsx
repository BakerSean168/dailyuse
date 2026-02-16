/**
 * TaskWidget - 今日任务 Widget
 *
 * 显示�?
 * - 今日任务列表
 * - 完成进度
 * - 快速完成操�?
 *
 * @module dashboard/presentation/components/widgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Progress,
  Badge,
  Button,
  Checkbox,
  ScrollArea,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { ListTodo, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { DashboardWidget, type WidgetSize } from '../DashboardWidget';

// ============ Types ============

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
}

export interface TaskWidgetProps {
  /** Widget 尺寸 */
  size?: WidgetSize;
  /** 点击查看更多 */
  onViewMore?: () => void;
  /** 点击任务 */
  onTaskClick?: (taskId: string) => void;
  /** 完成任务 */
  onTaskComplete?: (taskId: string, completed: boolean) => void;
  /** 类名 */
  className?: string;
}

// ============ Mock Data ============

const mockTasks: TaskItem[] = [
  { id: '1', title: '完成代码审查', completed: false, priority: 'high', dueTime: '10:00' },
  { id: '2', title: '更新项目文档', completed: true, priority: 'medium', dueTime: '14:00' },
  { id: '3', title: '团队会议', completed: false, priority: 'high', dueTime: '15:30' },
  { id: '4', title: '邮件回复', completed: false, priority: 'low' },
  { id: '5', title: '测试用例编写', completed: true, priority: 'medium', dueTime: '17:00' },
];

// ============ Component ============

export function TaskWidget({
  size = 'small',
  onViewMore,
  onTaskClick,
  onTaskComplete,
  className,
}: TaskWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTasks(mockTasks);
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
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  }, [tasks]);

  // 处理完成状态切�?
  const handleToggleComplete = useCallback((taskId: string, completed: boolean) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed } : t
    ));
    onTaskComplete?.(taskId, completed);
  }, [onTaskComplete]);

  // 获取优先级颜�?
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <DashboardWidget
      title="今日任务"
      icon={<ListTodo className="h-5 w-5 text-blue-500" />}
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
      {/* 进度�?*/}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            已完�?{stats.completed}/{stats.total}
          </span>
          <span className="text-sm font-semibold">{stats.progress}%</span>
        </div>
        <Progress value={stats.progress} className="h-2" />
      </div>

      {/* 任务列表 */}
      <ScrollArea className="h-[180px]">
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors",
                task.completed && "opacity-60"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => handleToggleComplete(task.id, !!checked)}
              />
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onTaskClick?.(task.id)}
              >
                <p className={cn(
                  "text-sm truncate",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </p>
                {task.dueTime && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{task.dueTime}</span>
                  </div>
                )}
              </div>
              <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority).replace('text-', 'bg-'))} />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <span>今日完成</span>
        </div>
        <Badge variant={stats.progress >= 80 ? 'default' : 'secondary'}>
          {stats.progress}%
        </Badge>
      </div>
    </DashboardWidget>
  );
}

export default TaskWidget;
