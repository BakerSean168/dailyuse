/**
 * Schedule Calendar View Component
 *
 * 调度任务日历视图组件 - 按日历形式展示任务
 * 支持任务拖拽到不同日期（视觉预览）
 */

import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';

interface ScheduleCalendarViewProps {
  tasks: ScheduleTask[];
  onTaskClick: (task: ScheduleTask) => void;
  onTaskDrop?: (task: ScheduleTask, newDate: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: ScheduleTask[];
}

export function ScheduleCalendarView({ tasks, onTaskClick, onTaskDrop }: ScheduleCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<ScheduleTask | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the previous Sunday
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End on the next Saturday
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Find tasks for this day
      const dayTasks = tasks.filter((task) => {
        if (!task.execution.nextRunAt) return false;
        const nextRun = new Date(task.execution.nextRunAt);
        return nextRun >= dayStart && nextRun <= dayEnd;
      });
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        tasks: dayTasks,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, tasks]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthYear = format(currentDate, 'yyyy年M月', { locale: zhCN });

  // 拖拽事件处理
  const handleDragStart = useCallback((e: React.DragEvent, task: ScheduleTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedTask && onTaskDrop) {
      onTaskDrop(draggedTask, date);
    }
    setDraggedTask(null);
    setDragOverDate(null);
  }, [draggedTask, onTaskDrop]);

  return (
    <div className="border rounded-lg bg-card p-4">
      {/* Drag Preview Banner */}
      {draggedTask && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          📦 正在拖动: <strong>{draggedTask.name}</strong>
          {dragOverDate && (
            <span className="ml-2">
              → {format(dragOverDate, 'M月d日', { locale: zhCN })}
            </span>
          )}
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{monthYear}</h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
          >
            ◀
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
          >
            今天
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onDragOver={(e) => handleDragOver(e, day.date)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day.date)}
            className={`min-h-[100px] border rounded p-1 transition-colors ${
              day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'
            } ${day.isToday ? 'border-primary border-2' : ''} ${
              dragOverDate && dragOverDate.getTime() === day.date.getTime()
                ? 'bg-blue-100 border-blue-400'
                : ''
            }`}
          >
            {/* Date Number */}
            <div
              className={`text-sm font-medium mb-1 ${
                day.isToday
                  ? 'text-primary'
                  : day.isCurrentMonth
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {day.date.getDate()}
            </div>

            {/* Tasks for this day */}
            <div className="space-y-1">
              {day.tasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(task)}
                  className={`w-full text-left text-xs px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing ${
                    task.isOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  title={`${task.name} (拖拽可调整日期)`}
                >
                  {getSourceIcon(task.sourceModule)} {task.name}
                </button>
              ))}
              {day.tasks.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{day.tasks.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSourceIcon(sourceModule: string): string {
  switch (sourceModule) {
    case 'REMINDER':
      return '🔔';
    case 'TASK':
      return '✅';
    case 'GOAL':
      return '🎯';
    default:
      return '📅';
  }
}
