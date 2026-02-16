/**
 * ReminderInstanceSidebar - 即将到来的提醒侧边栏
 *
 * 显示即将触发的提醒列表：
 * - 统计信息（总数、今天、逾期�?
 * - 按日期分组的提醒列表
 * - 支持筛选和刷新
 * - 提醒操作（延期、完成、忽略）
 *
 * @module reminder/presentation/components
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ScrollArea,
  cn,
} from '@dailyuse/ui-react-shadcn';

import {
  Bell,
  RefreshCw,
  Settings,
  ChevronDown,
  AlertCircle,
  BellOff,
  Clock,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { format, isToday, isBefore, startOfDay, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ============ Types ============

export interface UpcomingReminder {
  id: string;
  title: string;
  message?: string;
  nextTriggerAt: string | Date;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  templateId?: string;
  metadata?: {
    tags?: string[];
  };
}

export interface GroupedReminders {
  date: string;
  reminders: UpcomingReminder[];
}

export interface UpcomingData {
  total: number;
  reminders: UpcomingReminder[];
}

export interface ReminderInstanceSidebarProps {
  /** 即将到来的提醒数�?*/
  upcomingData?: UpcomingData | null;
  /** 加载状�?*/
  isLoading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 刷新回调 */
  onRefresh?: () => Promise<void>;
  /** 打开设置 */
  onOpenSettings?: () => void;
  /** 点击提醒 */
  onReminderClick?: (reminder: UpcomingReminder) => void;
  /** 延期提醒 */
  onSnooze?: (reminder: UpcomingReminder, minutes: number) => Promise<void>;
  /** 完成提醒 */
  onComplete?: (reminder: UpcomingReminder) => Promise<void>;
  /** 忽略提醒 */
  onDismiss?: (reminder: UpcomingReminder) => Promise<void>;
}

// ============ Utils ============

function parseDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const parsed = parseISO(dateInput);
  return isValid(parsed) ? parsed : new Date();
}

function formatTime(dateInput: string | Date): string {
  const date = parseDate(dateInput);
  return format(date, 'HH:mm', { locale: zhCN });
}

function formatGroupDate(dateString: string): string {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  
  if (isToday(date)) {
    return '今天';
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (startOfDay(date).getTime() === startOfDay(tomorrow).getTime()) {
    return '明天';
  }
  
  return format(date, 'M月d'EEEE', { locale: zhCN });
}

function isOverdue(dateInput: string | Date): boolean {
  const date = parseDate(dateInput);
  return isBefore(date, new Date());
}

function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'urgent': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'normal': return 'text-blue-500';
    case 'low': return 'text-gray-400';
    default: return 'text-blue-500';
  }
}

// ============ Component ============

export function ReminderInstanceSidebar({
  upcomingData,
  isLoading = false,
  error,
  onRefresh,
  onOpenSettings,
  onReminderClick,
  onSnooze,
  onComplete,
  onDismiss,
}: ReminderInstanceSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    days: 7,
    priorities: [] as string[],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 按日期分组提�?
  const groupedReminders = useMemo((): GroupedReminders[] => {
    if (!upcomingData?.reminders) return [];

    const groups: Record<string, UpcomingReminder[]> = {};

    upcomingData.reminders.forEach((reminder) => {
      const date = parseDate(reminder.nextTriggerAt);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reminder);
    });

    // 按日期排�?
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, reminders]) => ({
        date,
        reminders: reminders.sort((a, b) => {
          const dateA = parseDate(a.nextTriggerAt);
          const dateB = parseDate(b.nextTriggerAt);
          return dateA.getTime() - dateB.getTime();
        }),
      }));
  }, [upcomingData]);

  // 统计数据
  const todayCount = useMemo(() => {
    if (!upcomingData?.reminders) return 0;
    return upcomingData.reminders.filter(r => isToday(parseDate(r.nextTriggerAt))).length;
  }, [upcomingData]);

  const overdueCount = useMemo(() => {
    if (!upcomingData?.reminders) return 0;
    return upcomingData.reminders.filter(r => isOverdue(r.nextTriggerAt)).length;
  }, [upcomingData]);

  // 刷新
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // 点击提醒
  const handleReminderClick = useCallback((reminder: UpcomingReminder) => {
    onReminderClick?.(reminder);
  }, [onReminderClick]);

  return (
    <div className="w-[380px] h-full flex flex-col border-l bg-background">
      {/* 标题�?*/}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="font-semibold">即将到来的提</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between rounded-none border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>筛</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 border-b space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">时间范围</label>
            <Select
              value={String(filters.days)}
              onValueChange={(value) => setFilters(prev => ({ ...prev, days: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">今天</SelectItem>
                <SelectItem value="3">3天内</SelectItem>
                <SelectItem value="7">一周内</SelectItem>
                <SelectItem value="30">一个月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 统计信息 */}
      {upcomingData && (
        <div className="grid grid-cols-3 gap-4 p-4 border-b">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{upcomingData.total || 0}</p>
            <p className="text-xs text-muted-foreground">总数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{todayCount}</p>
            <p className="text-xs text-muted-foreground">今天</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">逾期</p>
          </div>
        </div>
      )}

      {/* 提醒列表 */}
      <ScrollArea className="flex-1">
        {/* 加载状�?*/}
        {isLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* 错误状�?*/}
        {!isLoading && error && (
          <div className="p-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              重试
            </Button>
          </div>
        )}

        {/* 空状�?*/}
        {!isLoading && !error && groupedReminders.length === 0 && (
          <div className="p-4 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无即将到来的提</p>
          </div>
        )}

        {/* 提醒列表 */}
        {!isLoading && !error && groupedReminders.length > 0 && (
          <div className="divide-y">
            {groupedReminders.map((group) => (
              <div key={group.date}>
                {/* 日期分组头部 */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                  <span className="text-sm font-medium">{formatGroupDate(group.date)}</span>
                  <Badge variant="outline" className="text-xs">
                    {group.reminders.length}
                  </Badge>
                </div>

                {/* 该日期的提醒列表 */}
                <div className="divide-y divide-dashed">
                  {group.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors",
                        isOverdue(reminder.nextTriggerAt) && "bg-red-50"
                      )}
                      onClick={() => handleReminderClick(reminder)}
                    >
                      <div className="flex items-start gap-2">
                        {/* 优先级指示器 */}
                        <div className={cn("mt-1.5 w-2 h-2 rounded-full", getPriorityColor(reminder.priority).replace('text-', 'bg-'))} />

                        {/* 主要内容 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {reminder.title || reminder.message}
                          </p>
                          {reminder.message && reminder.title && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {reminder.message}
                            </p>
                          )}

                          {/* 时间和标�?*/}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={isOverdue(reminder.nextTriggerAt) ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(reminder.nextTriggerAt)}
                            </Badge>

                            {reminder.metadata?.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(reminder.metadata?.tags?.length ?? 0) > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{(reminder.metadata?.tags?.length ?? 0) - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 底部操作 */}
      <div className="p-3 border-t flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-1" />
          筛�?
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
          刷新
        </Button>
      </div>
    </div>
  );
}

export default ReminderInstanceSidebar;
