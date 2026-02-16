/**
 * FocusStatistics Component
 *
 * 专注统计组件
 * Story 11-7: Advanced Features
 */

import { useMemo } from 'react';
import { Clock, Zap, Target, TrendingUp, Calendar, Award, Timer, Coffee } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Badge,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Types
interface FocusSession {
  id: string;
  date: Date;
  duration: number; // minutes
  taskId?: string;
  taskName?: string;
  completed: boolean;
}

interface FocusStatisticsProps {
  sessions: FocusSession[];
  dailyGoal?: number; // minutes
  weeklyGoal?: number; // minutes
  className?: string;
}

// Calculate statistics
function calculateStats(sessions: FocusSession[]) {
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: zhCN });
  const weekEnd = endOfWeek(today, { locale: zhCN });

  const todaySessions = sessions.filter((s) => isSameDay(s.date, today));
  const weekSessions = sessions.filter(
    (s) => s.date >= weekStart && s.date <= weekEnd
  );

  const todayTotal = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const weekTotal = weekSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const completedSessions = sessions.filter((s) => s.completed).length;
  const averageSession = totalSessions > 0 ? totalTime / totalSessions : 0;

  // Streak calculation (consecutive days with focus)
  let currentStreak = 0;
  const checkDate = new Date(today);
  while (true) {
    const hasSession = sessions.some((s) => isSameDay(s.date, checkDate));
    if (hasSession) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Weekly distribution
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyDistribution = weekDays.map((day) => {
    const daySessions = sessions.filter((s) => isSameDay(s.date, day));
    return {
      date: day,
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
      sessions: daySessions.length,
    };
  });

  return {
    todayTotal,
    weekTotal,
    totalSessions,
    totalTime,
    completedSessions,
    averageSession,
    currentStreak,
    weeklyDistribution,
  };
}

// Format duration
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

// Stat Card Component
interface StatCardProps {
  icon: typeof Clock;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, subtext, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={cn('p-2 rounded-md bg-background', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

// Weekly Chart Component
interface WeeklyChartProps {
  data: { date: Date; minutes: number; sessions: number }[];
  maxMinutes?: number;
}

function WeeklyChart({ data, maxMinutes }: WeeklyChartProps) {
  const max = maxMinutes || Math.max(...data.map((d) => d.minutes), 60);

  return (
    <div className="flex items-end justify-between gap-1 h-32">
      {data.map((day, i) => {
        const height = max > 0 ? (day.minutes / max) * 100 : 0;
        const dayLabel = format(day.date, 'E', { locale: zhCN });
        const isTodayDay = isToday(day.date);

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {/* Bar */}
            <div className="relative w-full h-24 flex items-end justify-center">
              <div
                className={cn(
                  'w-8 rounded-t transition-all',
                  isTodayDay ? 'bg-primary' : 'bg-primary/60',
                  day.minutes === 0 && 'bg-muted'
                )}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              {/* Tooltip on hover */}
              {day.minutes > 0 && (
                <div className="absolute -top-8 opacity-0 hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md">
                  {formatDuration(day.minutes)}
                </div>
              )}
            </div>
            {/* Day label */}
            <span className={cn('text-xs', isTodayDay ? 'font-bold' : 'text-muted-foreground')}>
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Main Component
export function FocusStatistics({
  sessions,
  dailyGoal = 120,
  weeklyGoal = 600,
  className,
}: FocusStatisticsProps) {
  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  const dailyProgress = Math.min((stats.todayTotal / dailyGoal) * 100, 100);
  const weeklyProgress = Math.min((stats.weekTotal / weeklyGoal) * 100, 100);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">专注统计</h2>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4" />
            今日专注
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatDuration(stats.todayTotal)}</span>
              <span className="text-muted-foreground">目标: {formatDuration(dailyGoal)}</span>
            </div>
            <Progress value={dailyProgress} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">
              {dailyProgress >= 100 ? '🎉 目标达成!' : `还需 ${formatDuration(dailyGoal - stats.todayTotal)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            本周概览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatDuration(stats.weekTotal)}</span>
              <span className="text-muted-foreground">目标: {formatDuration(weeklyGoal)}</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>

          {/* Weekly chart */}
          <WeeklyChart data={stats.weeklyDistribution} maxMinutes={dailyGoal} />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Zap}
          label="总专注次"
          value={stats.totalSessions}
          subtext={`完成 ${stats.completedSessions} 次`}
        />
        <StatCard
          icon={Clock}
          label="总专注时"
          value={formatDuration(stats.totalTime)}
          color="text-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="平均每次"
          value={formatDuration(Math.round(stats.averageSession))}
          color="text-green-500"
        />
        <StatCard
          icon={Award}
          label="连续天数"
          value={`${stats.currentStreak} 天`}
          subtext={stats.currentStreak >= 7 ? '🔥 保持热度!' : undefined}
          color="text-orange-500"
        />
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">最近专</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">还没有专注记</p>
              <p className="text-xs">开始你的第一个番茄钟吧</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {session.completed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        完成
                      </Badge>
                    ) : (
                      <Badge variant="outline">中断</Badge>
                    )}
                    <span className="text-sm truncate max-w-40">
                      {session.taskName || '自由专注'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{session.duration} 分钟</span>
                    <span className="mx-1">·</span>
                    <span>{format(session.date, 'MM/dd HH:mm', { locale: zhCN })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FocusStatistics;
