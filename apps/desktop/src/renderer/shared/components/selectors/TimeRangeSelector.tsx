/**
 * TimeRangeSelector Component
 *
 * 时间范围选择�?
 * Story 11-7: Advanced Features
 */

import { useState, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar as CalendarComponent,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addDays, addWeeks, addMonths, addQuarters, addYears, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export type TimeRangeType = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimeRange {
  start: Date;
  end: Date;
  type: TimeRangeType;
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  showCustomRange?: boolean;
  className?: string;
}

const rangeLabels: Record<TimeRangeType, string> = {
  day: '',
  week: '',
  month: '',
  quarter: '季度',
  year: '',
  custom: '自定',
};

// Get range for a specific date and type
function getRangeForDate(date: Date, type: TimeRangeType): TimeRange {
  switch (type) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date), type };
    case 'week':
      return { start: startOfWeek(date, { locale: zhCN }), end: endOfWeek(date, { locale: zhCN }), type };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date), type };
    case 'quarter':
      return { start: startOfQuarter(date), end: endOfQuarter(date), type };
    case 'year':
      return { start: startOfYear(date), end: endOfYear(date), type };
    default:
      return { start: startOfDay(date), end: endOfDay(date), type };
  }
}

// Format range display text
function formatRangeText(range: TimeRange): string {
  const { start, end, type } = range;

  switch (type) {
    case 'day':
      return format(start, 'yyyy年M月d', { locale: zhCN });
    case 'week':
      return `${format(start, 'M月d', { locale: zhCN })} - ${format(end, 'M月d', { locale: zhCN })}`;
    case 'month':
      return format(start, 'yyyy年M', { locale: zhCN });
    case 'quarter':
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `${start.getFullYear()}年Q${quarter}`;
    case 'year':
      return `${start.getFullYear()}年`;
    case 'custom':
      return `${format(start, 'M/d', { locale: zhCN })} - ${format(end, 'M/d', { locale: zhCN })}`;
    default:
      return '';
  }
}

export function TimeRangeSelector({
  value,
  onChange,
  showCustomRange = true,
  className,
}: TimeRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Navigate to previous period
  const handlePrevious = useCallback(() => {
    const { start, type } = value;
    let newDate: Date;

    switch (type) {
      case 'day':
        newDate = subDays(start, 1);
        break;
      case 'week':
        newDate = subWeeks(start, 1);
        break;
      case 'month':
        newDate = subMonths(start, 1);
        break;
      case 'quarter':
        newDate = subQuarters(start, 1);
        break;
      case 'year':
        newDate = subYears(start, 1);
        break;
      default:
        newDate = subDays(start, 1);
    }

    onChange(getRangeForDate(newDate, type));
  }, [value, onChange]);

  // Navigate to next period
  const handleNext = useCallback(() => {
    const { start, type } = value;
    let newDate: Date;

    switch (type) {
      case 'day':
        newDate = addDays(start, 1);
        break;
      case 'week':
        newDate = addWeeks(start, 1);
        break;
      case 'month':
        newDate = addMonths(start, 1);
        break;
      case 'quarter':
        newDate = addQuarters(start, 1);
        break;
      case 'year':
        newDate = addYears(start, 1);
        break;
      default:
        newDate = addDays(start, 1);
    }

    onChange(getRangeForDate(newDate, type));
  }, [value, onChange]);

  // Go to today
  const handleToday = useCallback(() => {
    onChange(getRangeForDate(new Date(), value.type));
  }, [value.type, onChange]);

  // Change range type
  const handleTypeChange = useCallback(
    (type: TimeRangeType) => {
      if (type === 'custom') {
        setIsCalendarOpen(true);
        onChange({ ...value, type });
      } else {
        onChange(getRangeForDate(value.start, type));
      }
    },
    [value, onChange]
  );

  // Handle calendar selection
  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        if (value.type === 'custom') {
          // For custom, just update start/end
          onChange({ start: startOfDay(date), end: endOfDay(date), type: 'custom' });
        } else {
          onChange(getRangeForDate(date, value.type));
        }
        setIsCalendarOpen(false);
      }
    },
    [value.type, onChange]
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Range Type Selector */}
      <Select value={value.type} onValueChange={(v) => handleTypeChange(v as TimeRangeType)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(rangeLabels).map(([type, label]) => {
            if (type === 'custom' && !showCustomRange) return null;
            return (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Current Range Display */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              {formatRangeText(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={value.start}
              onSelect={handleCalendarSelect}
              locale={zhCN}
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Today Button */}
      <Button variant="outline" size="sm" onClick={handleToday}>
        今天
      </Button>
    </div>
  );
}

export default TimeRangeSelector;
