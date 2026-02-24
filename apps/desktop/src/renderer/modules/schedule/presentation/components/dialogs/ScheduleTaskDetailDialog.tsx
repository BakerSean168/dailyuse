/**
 * ScheduleTaskDetailDialog Component
 *
 * 调度任务详情对话�?
 * 功能�?
 * 1. 显示任务基本信息
 * 2. 显示执行信息
 * 3. 显示调度配置
 * 4. 显示执行历史
 */

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '@dailyuse/contracts/schedule';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import { ScrollArea } from '@dailyuse/ui-react-shadcn';
import { Separator } from '@dailyuse/ui-react-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-react-shadcn';
import {
  CalendarClock,
  Clock,
  Info,
  Settings,
  History,
  Check,
  X,
  AlertTriangle,
  Play,
  Pause,
  Target,
  Bell,
  CheckSquare,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface ScheduleTaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ScheduleTaskClientDTO | null;
  isLoading?: boolean;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ===================== 工具函数 =====================

function formatDateTime(date: Date | number | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  [ScheduleTaskStatus.ACTIVE]: { label: '活跃', color: 'bg-green-100 text-green-800', icon: Play },
  [ScheduleTaskStatus.PAUSED]: { label: '暂停', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  [ScheduleTaskStatus.COMPLETED]: { label: '已完', color: 'bg-blue-100 text-blue-800', icon: Check },
  [ScheduleTaskStatus.CANCELLED]: { label: '已取', color: 'bg-gray-100 text-gray-800', icon: X },
  [ScheduleTaskStatus.FAILED]: { label: '失败', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const sourceModuleConfig: Record<string, { label: string; color: string; icon: typeof Target }> = {
  [SourceModule.GOAL]: { label: '目标', color: 'bg-purple-100 text-purple-800', icon: Target },
  [SourceModule.REMINDER]: { label: '提醒', color: 'bg-orange-100 text-orange-800', icon: Bell },
  [SourceModule.TASK]: { label: '任务', color: 'bg-blue-100 text-blue-800', icon: CheckSquare },
};

const executionStatusConfig: Record<string, { label: string; color: string }> = {
  [ExecutionStatus.SUCCESS]: { label: '成功', color: 'bg-green-100 text-green-800' },
  [ExecutionStatus.FAILED]: { label: '失败', color: 'bg-red-100 text-red-800' },
  [ExecutionStatus.SKIPPED]: { label: '跳过', color: 'bg-gray-100 text-gray-800' },
};

// ===================== 组件 =====================

export function ScheduleTaskDetailDialog({
  open,
  onOpenChange,
  task,
  isLoading = false,
  onPause,
  onResume,
  onDelete,
}: ScheduleTaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('info');

  const status = task ? statusConfig[task.status] : null;
  const sourceModule = task ? sourceModuleConfig[task.sourceModule] : null;
  const executionStatus = task?.execution.lastExecutionStatus
    ? executionStatusConfig[task.execution.lastExecutionStatus]
    : null;

  const handlePause = useCallback(() => {
    if (task) onPause?.(task.id);
  }, [task, onPause]);

  const handleResume = useCallback(() => {
    if (task) onResume?.(task.id);
  }, [task, onResume]);

  const handleDelete = useCallback(() => {
    if (task) onDelete?.(task.id);
  }, [task, onDelete]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>任务详情</DialogTitle>
              <DialogDescription>Schedule Task Details</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="gap-1">
                <Info className="h-4 w-4" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1">
                <Settings className="h-4 w-4" />
                调度配置
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="h-4 w-4" />
                执行历史
              </TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 基本信息卡片 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">任务名称</p>
                      <p className="font-medium">{task.name}</p>
                    </div>
                    {task.description && (
                      <div>
                        <p className="text-xs text-muted-foreground">描述</p>
                        <p className="text-sm">{task.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">来源模块</p>
                      {sourceModule && (
                        <Badge className={sourceModule.color}>
                          {sourceModule.label}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">任务状</p>
                      {status && (
                        <Badge className={status.color}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">启用状</p>
                      <Badge className={task.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {task.enabled ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 执行信息卡片 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      执行信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">执行次数</p>
                      <p className="font-medium">{task.execution.executionCount} 次</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">下次执行</p>
                      <p className="text-sm">{formatDateTime(task.execution.nextRunAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">上次执行</p>
                      <p className="text-sm">{formatDateTime(task.execution.lastRunAt)}</p>
                    </div>
                    {task.execution.lastExecutionStatus && (
                      <div>
                        <p className="text-xs text-muted-foreground">上次执行状态</p>
                        {executionStatus && (
                          <Badge className={executionStatus.color}>
                            {executionStatus.label}
                          </Badge>
                        )}
                      </div>
                    )}
                    {task.execution.consecutiveFailures > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">连续失败</p>
                        <Badge variant="destructive">
                          {task.execution.consecutiveFailures} �?
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 调度配置 */}
            <TabsContent value="schedule" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    调度配置
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cron 表达</p>
                      <p className="font-mono text-sm">{task.schedule.cronExpression}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">时区</p>
                      <p className="text-sm">{task.schedule.timezone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">开始日</p>
                      <p className="text-sm">{formatDate(task.schedule.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">结束日期</p>
                      <p className="text-sm">{formatDate(task.schedule.endDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 执行历史 */}
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <History className="h-4 w-4" />
                    执行历史
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p>执行历史记录加载中...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <Separator />

        <DialogFooter className="gap-2">
          {task.status === ScheduleTaskStatus.ACTIVE && (
            <Button variant="outline" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </Button>
          )}
          {task.status === ScheduleTaskStatus.PAUSED && (
            <Button variant="outline" onClick={handleResume}>
              <Play className="h-4 w-4 mr-2" />
              恢复
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            删除
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleTaskDetailDialog;
