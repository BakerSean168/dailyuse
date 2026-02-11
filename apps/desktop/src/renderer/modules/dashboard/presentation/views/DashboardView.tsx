/**
 * DashboardView - 仪表板主视图
 *
 * 功能�?
 * - Widget 网格布局
 * - 响应式设�?
 * - Widget 配置面板
 * - 刷新所�?Widget
 *
 * @module dashboard/presentation/views
 */

import { useState, useCallback } from 'react';
import {
  Button,
  Skeleton,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Switch,
  Label,
  Separator,
  cn,
} from '@dailyuse/ui-react-shadcn';

import {
  LayoutDashboard,
  RefreshCw,
  Settings,
  Target,
  ListTodo,
  Bell,
  BarChart3,
} from 'lucide-react';

// Widget components
import {
  GoalWidget,
  TaskWidget,
  ReminderWidget,
  StatisticsWidget,
} from '../components';

// ============ Types ============

interface WidgetConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
}

// ============ Component ============

export function DashboardView() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Widget 配置状�?
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([
    { id: 'goal', name: '目标进度', icon: <Target className="h-4 w-4" />, visible: true, size: 'small' },
    { id: 'task', name: '今日任务', icon: <ListTodo className="h-4 w-4" />, visible: true, size: 'small' },
    { id: 'reminder', name: '即将到来', icon: <Bell className="h-4 w-4" />, visible: true, size: 'small' },
    { id: 'statistics', name: '统计数据', icon: <BarChart3 className="h-4 w-4" />, visible: true, size: 'medium' },
  ]);

  // 刷新所�?Widget
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    // 模拟刷新
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // 切换 Widget 可见�?
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setWidgetConfigs(prev =>
      prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w)
    );
  }, []);

  // 可见�?Widget
  const visibleWidgets = widgetConfigs.filter(w => w.visible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-6 lg:p-8">
      {/* 页面标题 */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">仪表�?/h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            刷新
          </Button>

          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="default" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Widget 设置
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  选择要显示的 Widget
                </p>
                <Separator />

                {widgetConfigs.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {widget.icon}
                      <Label htmlFor={widget.id} className="cursor-pointer">
                        {widget.name}
                      </Label>
                    </div>
                    <Switch
                      id={widget.id}
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    />
                  </div>
                ))}

                <Separator />

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setWidgetConfigs(prev =>
                        prev.map(w => ({ ...w, visible: true }))
                      );
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重置默认
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* 空状�?*/}
      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg shadow-sm">
          <LayoutDashboard className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">暂无 Widget</h2>
          <p className="text-muted-foreground mb-6">点击右上角设置按钮添�?Widget</p>
          <Button onClick={() => setSettingsOpen(true)}>
            打开设置
          </Button>
        </div>
      )}

      {/* Widget 网格 */}
      {visibleWidgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Goal Widget */}
          {widgetConfigs.find(w => w.id === 'goal')?.visible && (
            <GoalWidget
              size="small"
              onViewMore={() => console.log('Navigate to goals')}
              onGoalClick={(uuid) => console.log('Goal clicked:', uuid)}
            />
          )}

          {/* Task Widget */}
          {widgetConfigs.find(w => w.id === 'task')?.visible && (
            <TaskWidget
              size="small"
              onViewMore={() => console.log('Navigate to tasks')}
              onTaskClick={(uuid) => console.log('Task clicked:', uuid)}
              onTaskComplete={(uuid, completed) => console.log('Task complete:', uuid, completed)}
            />
          )}

          {/* Reminder Widget */}
          {widgetConfigs.find(w => w.id === 'reminder')?.visible && (
            <ReminderWidget
              size="small"
              onViewMore={() => console.log('Navigate to reminders')}
              onReminderClick={(uuid) => console.log('Reminder clicked:', uuid)}
              onConfirm={(uuid) => console.log('Reminder confirmed:', uuid)}
              onSnooze={(uuid, minutes) => console.log('Reminder snoozed:', uuid, minutes)}
            />
          )}

          {/* Statistics Widget - spans 2 columns on medium+ screens */}
          {widgetConfigs.find(w => w.id === 'statistics')?.visible && (
            <StatisticsWidget
              size="medium"
              onViewMore={() => console.log('Navigate to statistics')}
              className="md:col-span-2"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardView;
