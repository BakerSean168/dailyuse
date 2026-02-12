/**
 * WeekViewCalendar Component
 *
 * 周历视图组件
 * 功能�?
 * 1. 7天周视图 x 24小时时间�?
 * 2. 事件块显�?
 * 3. 支持周导航和今日跳转
 * 4. 事件点击和创建回�?
 */

import { useState, useMemo, useCallback } from 'react';
import type { ScheduleClientDTO } from '../stores/scheduleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { ScrollArea } from '@dailyuse/ui-react-shadcn';
import { Skeleton } from '@dailyuse/ui-react-shadcn';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface WeekViewCalendarProps {
  schedules: ScheduleClientDTO[];
  isLoading?: boolean;
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  onCreate?: () => void;
  onEventClick?: (event: ScheduleClientDTO) => void;
}

interface WeekDay {
  date: string; // YYYY-MM-DD
  dayName: string;
  dateNumber: number;
  isToday: boolean;
}

// ===================== 工具函数 =====================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 周一为一周开�?
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayName(day: number): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day];
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(startTime: Date | number, endTime: Date | number): string {
  const start = typeof startTime === 'number' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'number' ? new Date(endTime) : endTime;
  
  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// ===================== 组件 =====================

export function WeekViewCalendar({
  schedules,
  isLoading = false,
  onWeekChange,
  onCreate,
  onEventClick,
}: WeekViewCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));

  // 计算周内每天
  const weekDays = useMemo((): WeekDay[] => {
    const days: WeekDay[] = [];
    const start = new Date(currentWeekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayName: getDayName(date.getDay()),
        dateNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
      });
    }

    return days;
  }, [currentWeekStart]);

  // 周范围文�?
  const weekRange = useMemo(() => {
    const start = currentWeekStart;
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}�?{day}日`;
    };

    return `${format(start)} - ${format(end)}`;
  }, [currentWeekStart]);

  // 24小时
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // 获取某天的事�?
  const getEventsForDay = useCallback((dateStr: string): ScheduleClientDTO[] => {
    return schedules.filter((event) => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [schedules]);

  // 计算事件位置样式
  const getEventStyle = useCallback((event: ScheduleClientDTO) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    const top = (startHour / 24) * 100;
    const height = (duration / 24) * 100;

    return {
      top: `${top}%`,
      height: `${Math.max(height, 2)}%`,
    };
  }, []);

  // 导航函数
  const previousWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);
    onWeekChange?.(newStart, newEnd);
  }, [currentWeekStart, onWeekChange]);

  const nextWeek = useCallback(() => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);
    onWeekChange?.(newStart, newEnd);
  }, [currentWeekStart, onWeekChange]);

  const goToToday = useCallback(() => {
    const today = getWeekStart(new Date());
    setCurrentWeekStart(today);
    
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    onWeekChange?.(today, end);
  }, [onWeekChange]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{weekRange}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建日程
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* 表头：星�?*/}
            <div className="flex border-b sticky top-0 bg-background z-10">
              <div className="w-16 shrink-0 border-r" />
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`flex-1 p-2 text-center border-r last:border-r-0 ${
                    day.isToday ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="text-sm text-muted-foreground">{day.dayName}</div>
                  <div className={`text-lg font-medium ${day.isToday ? 'text-primary' : ''}`}>
                    {day.dateNumber}
                  </div>
                </div>
              ))}
            </div>

            {/* 日历主体 */}
            <ScrollArea className="flex-1">
              <div className="flex">
                {/* 时间�?*/}
                <div className="w-16 shrink-0 border-r">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b text-xs text-muted-foreground flex items-start justify-end pr-2 pt-1"
                    >
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>

                {/* 每天的事件列 */}
                {weekDays.map((day) => (
                  <div
                    key={day.date}
                    className={`flex-1 relative border-r last:border-r-0 ${
                      day.isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* 时间槽网格背�?*/}
                    {hours.map((hour) => (
                      <div key={hour} className="h-12 border-b" />
                    ))}

                    {/* 当天的事�?*/}
                    {getEventsForDay(day.date).map((event) => (
                      <div
                        key={event.uuid}
                        className={`
                          absolute left-1 right-1 px-1.5 py-0.5 rounded text-xs cursor-pointer
                          transition-all hover:shadow-md overflow-hidden
                          ${event.hasConflict 
                            ? 'bg-yellow-100 border-l-2 border-yellow-500 text-yellow-800' 
                            : 'bg-blue-100 border-l-2 border-blue-500 text-blue-800'
                          }
                        `}
                        style={getEventStyle(event)}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          {event.hasConflict && <AlertTriangle className="h-3 w-3 shrink-0" />}
                          {event.title}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {formatEventTime(event.startTime, event.endTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WeekViewCalendar;
