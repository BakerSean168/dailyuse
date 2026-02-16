/**
 * ScheduleWeekView Component
 *
 * 周历主视�?
 * 功能�?
 * 1. 集成 WeekViewCalendar
 * 2. 创建/编辑日程对话�?
 * 3. 事件详情查看
 * 4. 周导航和事件管理
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
// 使用 Store 导出的类型别�?
import type { ScheduleClientDTO } from '../stores/scheduleStore';
import { useScheduleStore } from '../stores/scheduleStore';
import { WeekViewCalendar } from '../components/WeekViewCalendar';
import { CreateScheduleDialog } from '../components/dialogs/CreateScheduleDialog';
import { ScheduleEventList } from '../components/ScheduleEventList';
import { ConflictAlert } from '../components/ConflictAlert';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@dailyuse/ui-react-shadcn';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Flag,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface ScheduleWeekViewProps {
  className?: string;
}

// ===================== 工具函数 =====================

function formatEventTime(event: ScheduleClientDTO): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  
  return `${format(start, 'MM-dd HH:mm', { locale: zhCN })} - ${format(end, 'MM-dd HH:mm', { locale: zhCN })}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ===================== 组件 =====================

export function ScheduleWeekView({ className }: ScheduleWeekViewProps) {
  // Store
  const {
    schedules,
    isLoading,
    error,
    fetchSchedules,
    createSchedule,
    updateScheduleById,
    deleteSchedule,
    getSchedulesForWeek,
  } = useScheduleStore();

  // Local State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleClientDTO | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleClientDTO | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取当前周的日程
  const weekSchedules = useMemo(() => {
    return getSchedulesForWeek(currentWeekStart);
  }, [currentWeekStart, getSchedulesForWeek, schedules]);

  // 初始加载
  useEffect(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    fetchSchedules(currentWeekStart, weekEnd);
  }, [currentWeekStart, fetchSchedules]);

  // 处理周切�?
  const handleWeekChange = useCallback((startDate: Date, endDate: Date) => {
    setCurrentWeekStart(startDate);
  }, []);

  // 打开创建对话�?
  const handleCreate = useCallback(() => {
    setEditingSchedule(null);
    setShowCreateDialog(true);
  }, []);

  // 处理事件点击
  const handleEventClick = useCallback((event: ScheduleClientDTO) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  }, []);

  // 处理编辑
  const handleEdit = useCallback(() => {
    if (selectedEvent) {
      setEditingSchedule(selectedEvent);
      setShowEventDetails(false);
      setShowCreateDialog(true);
    }
  }, [selectedEvent]);

  // 处理删除确认
  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  // 执行删除
  const handleDelete = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      await deleteSchedule(selectedEvent.id);
      setShowDeleteConfirm(false);
      setShowEventDetails(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Delete schedule failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, deleteSchedule]);

  // 处理表单提交
  const handleSubmit = useCallback(async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        await updateScheduleById(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      setShowCreateDialog(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error('Submit schedule failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingSchedule, createSchedule, updateScheduleById]);

  // 从列表删�?
  const handleDeleteFromList = useCallback(async (id: string) => {
    if (!confirm('确定要删除这个日程吗')) return;
    
    try {
      await deleteSchedule(id);
    } catch (err) {
      console.error('Delete schedule failed:', err);
    }
  }, [deleteSchedule]);

  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* 错误提示 */}
      {error && (
        <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* 主体内容 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* 周历视图 */}
        <div className="lg:col-span-3 h-full">
          <WeekViewCalendar
            schedules={weekSchedules}
            isLoading={isLoading}
            onWeekChange={handleWeekChange}
            onCreate={handleCreate}
            onEventClick={handleEventClick}
          />
        </div>

        {/* 侧边栏：当日事件列表 */}
        <div className="h-full">
          <ScheduleEventList
            schedules={weekSchedules}
            isLoading={isLoading}
            title="本周日程"
            showCreateButton={false}
            onScheduleClick={handleEventClick}
            onDelete={handleDeleteFromList}
          />
        </div>
      </div>

      {/* 创建/编辑对话�?*/}
      <CreateScheduleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        editingSchedule={editingSchedule}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowCreateDialog(false);
          setEditingSchedule(null);
        }}
      />

      {/* 事件详情对话�?*/}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <DialogTitle className="flex items-center gap-2">
                    {selectedEvent.title}
                    {selectedEvent.hasConflict && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        冲突
                      </Badge>
                    )}
                  </DialogTitle>
                </div>
                <DialogDescription>日程详情</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 时间 */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatEventTime(selectedEvent)}</span>
                </div>

                {/* 地点 */}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {/* 描述 */}
                {selectedEvent.description && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.description}</span>
                  </div>
                )}

                {/* 优先�?*/}
                {selectedEvent.priority && (
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span>优先级: {selectedEvent.priority}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
                <Button variant="ghost" onClick={() => setShowEventDetails(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话�?*/}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除日程「{selectedEvent?.title}」吗？此操作不可撤销�?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ScheduleWeekView;
