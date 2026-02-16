/**
 * ReminderWidget - 即将到来的提�?Widget
 *
 * 显示�?
 * - 即将触发的提醒列�?
 * - 时间倒计�?
 * - 快速确�?延期操作
 *
 * @module dashboard/presentation/components/widgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Badge,
  Button,
  ScrollArea,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { Bell, ArrowRight, Clock, Check, AlarmClockPlus } from 'lucide-react';
import { format, formatDistanceToNow, isBefore, addMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DashboardWidget, type WidgetSize } from '../DashboardWidget';

// ============ Types ============

interface ReminderItem {
  id: string;
  title: string;
  triggerAt: Date;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

export interface ReminderWidgetProps {
  /** Widget 尺寸 */
  size?: WidgetSize;
  /** 点击查看更多 */
  onViewMore?: () => void;
  /** 点击提醒 */
  onReminderClick?: (reminderId: string) => void;
  /** 确认提醒 */
  onConfirm?: (reminderId: string) => void;
  /** 延期提醒 */
  onSnooze?: (reminderId: string, minutes: number) => void;
  /** 类名 */
  className?: string;
}

// ============ Mock Data ============

const mockReminders: ReminderItem[] = [
  { id: '1', title: '喝水提醒', triggerAt: addMinutes(new Date(), 15), priority: 'normal' },
  { id: '2', title: '会议开', triggerAt: addMinutes(new Date(), 45), priority: 'high' },
  { id: '3', title: '休息提醒', triggerAt: addMinutes(new Date(), 90), priority: 'low' },
  { id: '4', title: '项目截止', triggerAt: addMinutes(new Date(), 180), priority: 'urgent' },
];

// ============ Component ============

export function ReminderWidget({
  size = 'small',
  onViewMore,
  onReminderClick,
  onConfirm,
  onSnooze,
  className,
}: ReminderWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setReminders(mockReminders);
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
    const now = new Date();
    const upcoming = reminders.filter(r => !isBefore(r.triggerAt, now)).length;
    const urgent = reminders.filter(r => r.priority === 'urgent').length;
    return { upcoming, urgent, total: reminders.length };
  }, [reminders]);

  // 获取优先级颜色和标签
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'bg-red-500', label: '紧' };
      case 'high':
        return { color: 'bg-orange-500', label: '' };
      case 'normal':
        return { color: 'bg-blue-500', label: '普' };
      case 'low':
        return { color: 'bg-gray-400', label: '' };
      default:
        return { color: 'bg-gray-400', label: '未知' };
    }
  };

  // 格式化时�?
  const formatTriggerTime = (date: Date) => {
    const now = new Date();
    if (isBefore(date, now)) {
      return '已过';
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  };

  // 处理确认
  const handleConfirm = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReminders(prev => prev.filter(r => r.id !== id));
    onConfirm?.(id);
  }, [onConfirm]);

  // 处理延期
  const handleSnooze = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, triggerAt: addMinutes(r.triggerAt, 15) } : r
    ));
    onSnooze?.(id, 15);
  }, [onSnooze]);

  return (
    <DashboardWidget
      title="即将到来"
      icon={<Bell className="h-5 w-5 text-orange-500" />}
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
      {/* 统计 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-2 rounded-lg bg-accent">
          <p className="text-xl font-bold text-primary">{stats.upcoming}</p>
          <p className="text-xs text-muted-foreground">待触</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-accent">
          <p className="text-xl font-bold text-red-500">{stats.urgent}</p>
          <p className="text-xs text-muted-foreground">紧</p>
        </div>
      </div>

      {/* 提醒列表 */}
      <ScrollArea className="h-[160px]">
        <div className="space-y-2">
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无即将到来的提</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const priorityInfo = getPriorityInfo(reminder.priority);
              return (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onReminderClick?.(reminder.id)}
                >
                  <div className={cn("w-2 h-2 rounded-full", priorityInfo.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reminder.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatTriggerTime(reminder.triggerAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleSnooze(reminder.id, e)}
                      title="延期15分钟"
                    >
                      <AlarmClockPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-500"
                      onClick={(e) => handleConfirm(reminder.id, e)}
                      title="确认"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </DashboardWidget>
  );
}

export default ReminderWidget;
