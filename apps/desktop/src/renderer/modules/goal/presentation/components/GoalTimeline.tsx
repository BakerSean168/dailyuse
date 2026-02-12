/**
 * GoalTimeline Component
 *
 * 目标时间线视�?
 * Story 11-7: Advanced Features
 */

import { useMemo, useState } from 'react';
import { Target, Flag, Calendar, CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Button,
  ScrollArea,
  ScrollBar,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { TimeRangeSelector, type TimeRange } from '@/renderer/shared/components/selectors/TimeRangeSelector';

import { format, differenceInDays, isWithinInterval, isBefore, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Types
interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
  description?: string;
}

interface GoalTimelineItem {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  color?: string;
  milestones?: Milestone[];
}

interface GoalTimelineProps {
  goals: GoalTimelineItem[];
  onGoalClick?: (goal: GoalTimelineItem) => void;
  onMilestoneClick?: (milestone: Milestone, goal: GoalTimelineItem) => void;
  className?: string;
}

// Status configurations
const statusColors: Record<string, string> = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  overdue: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  not_started: '未开�?,
  in_progress: '进行�?,
  completed: '已完�?,
  overdue: '已逾期',
};

// Calculate timeline range
function calculateTimelineRange(goals: GoalTimelineItem[], range: TimeRange) {
  const { start, end } = range;
  const totalDays = differenceInDays(end, start) + 1;

  return { start, end, totalDays };
}

// Calculate position percentage
function calculatePosition(date: Date, start: Date, totalDays: number): number {
  const days = differenceInDays(date, start);
  return Math.max(0, Math.min(100, (days / totalDays) * 100));
}

// Goal Bar Component
interface GoalBarProps {
  goal: GoalTimelineItem;
  timelineStart: Date;
  totalDays: number;
  onClick: () => void;
}

function GoalBar({ goal, timelineStart, totalDays, onClick }: GoalBarProps) {
  const startPos = calculatePosition(goal.startDate, timelineStart, totalDays);
  const endPos = calculatePosition(goal.endDate, timelineStart, totalDays);
  const width = Math.max(endPos - startPos, 2);

  // Milestones within the goal range
  const visibleMilestones = goal.milestones?.filter((m) =>
    isWithinInterval(m.date, { start: goal.startDate, end: goal.endDate })
  );

  return (
    <div className="relative h-10 group">
      {/* Goal bar */}
      <div
        className={cn(
          'absolute h-8 rounded-md cursor-pointer transition-all hover:h-10 hover:-translate-y-1 hover:shadow-md',
          statusColors[goal.status]
        )}
        style={{
          left: `${startPos}%`,
          width: `${width}%`,
          minWidth: '60px',
        }}
        onClick={onClick}
      >
        {/* Progress indicator */}
        <div
          className="absolute inset-0 bg-white/30 rounded-md"
          style={{ width: `${goal.progress}%` }}
        />
        {/* Goal name */}
        <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
          <span className="text-xs font-medium text-white truncate">
            {goal.name}
          </span>
        </div>
      </div>

      {/* Milestones */}
      {visibleMilestones?.map((milestone) => {
        const pos = calculatePosition(milestone.date, timelineStart, totalDays);
        return (
          <div
            key={milestone.id}
            className="absolute top-0 transform -translate-x-1/2 cursor-pointer z-10"
            style={{ left: `${pos}%` }}
            title={`${milestone.name} - ${format(milestone.date, 'MM/dd')}`}
          >
            {milestone.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Flag className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Timeline Header with dates
interface TimelineHeaderProps {
  start: Date;
  end: Date;
  totalDays: number;
}

function TimelineHeader({ start, end, totalDays }: TimelineHeaderProps) {
  // Generate date markers
  const markers = useMemo(() => {
    const result: { date: Date; position: number; isMonth: boolean }[] = [];
    const step = totalDays <= 7 ? 1 : totalDays <= 31 ? 7 : 30;

    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      result.push({
        date,
        position: (i / totalDays) * 100,
        isMonth: date.getDate() === 1 || i === 0,
      });
    }

    return result;
  }, [start, totalDays]);

  return (
    <div className="relative h-8 border-b">
      {markers.map((marker, i) => (
        <div
          key={i}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${marker.position}%` }}
        >
          <div className={cn('h-2 w-px', marker.isMonth ? 'bg-foreground' : 'bg-muted-foreground')} />
          <span className={cn('text-xs', marker.isMonth ? 'font-medium' : 'text-muted-foreground')}>
            {marker.isMonth
              ? format(marker.date, 'M/d', { locale: zhCN })
              : format(marker.date, 'd', { locale: zhCN })}
          </span>
        </div>
      ))}
    </div>
  );
}

// Today Marker
function TodayMarker({ start, totalDays }: { start: Date; totalDays: number }) {
  const today = new Date();
  const pos = calculatePosition(today, start, totalDays);

  if (pos < 0 || pos > 100) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
      style={{ left: `${pos}%` }}
    >
      <div className="absolute -top-1 -left-2 bg-red-500 text-white text-xs px-1 rounded">
        今天
      </div>
    </div>
  );
}

// Main Component
export function GoalTimeline({
  goals,
  onGoalClick,
  onMilestoneClick,
  className,
}: GoalTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
    type: 'month',
  });

  const { start, end, totalDays } = useMemo(
    () => calculateTimelineRange(goals, timeRange),
    [goals, timeRange]
  );

  // Filter goals that overlap with the time range
  const visibleGoals = useMemo(() => {
    return goals.filter((goal) => {
      return !(isAfter(goal.startDate, end) || isBefore(goal.endDate, start));
    });
  }, [goals, start, end]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: visibleGoals.length,
      completed: visibleGoals.filter((g) => g.status === 'completed').length,
      inProgress: visibleGoals.filter((g) => g.status === 'in_progress').length,
      overdue: visibleGoals.filter((g) => g.status === 'overdue').length,
    };
  }, [visibleGoals]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">目标时间�?/h2>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Statistics */}
      <div className="flex gap-4">
        <Badge variant="outline" className="gap-1">
          <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
          总计: {stats.total}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
          进行�? {stats.inProgress}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          已完�? {stats.completed}
        </Badge>
        {stats.overdue > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Circle className="h-3 w-3 fill-current" />
            逾期: {stats.overdue}
          </Badge>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-4">
          {visibleGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2 opacity-50" />
              <p>该时间范围内没有目标</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[800px] relative">
                {/* Timeline Header */}
                <TimelineHeader start={start} end={end} totalDays={totalDays} />

                {/* Goals */}
                <div className="relative py-4 space-y-3">
                  {/* Today Marker */}
                  <TodayMarker start={start} totalDays={totalDays} />

                  {/* Goal Bars */}
                  {visibleGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4">
                      {/* Goal name on left */}
                      <div className="w-32 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start truncate text-xs h-8"
                          onClick={() => onGoalClick?.(goal)}
                        >
                          {goal.name}
                          <ChevronRight className="h-3 w-3 ml-auto" />
                        </Button>
                      </div>
                      {/* Timeline bar */}
                      <div className="flex-1 relative">
                        <GoalBar
                          goal={goal}
                          timelineStart={start}
                          totalDays={totalDays}
                          onClick={() => onGoalClick?.(goal)}
                        />
                      </div>
                      {/* Progress on right */}
                      <div className="w-16 text-right text-xs text-muted-foreground">
                        {goal.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded bg-gray-400" />
          <span className="text-muted-foreground">未开�?/span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded bg-blue-500" />
          <span className="text-muted-foreground">进行�?/span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded bg-green-500" />
          <span className="text-muted-foreground">已完�?/span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded bg-red-500" />
          <span className="text-muted-foreground">已逾期</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">里程�?/span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">已达成里程碑</span>
        </div>
      </div>
    </div>
  );
}

export default GoalTimeline;
