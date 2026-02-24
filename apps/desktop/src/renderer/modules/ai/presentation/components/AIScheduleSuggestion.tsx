/**
 * AIScheduleSuggestion Component
 *
 * AI 日程建议组件
 * Story 11-7: Advanced Features
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Sun,
  Moon,
  Coffee,
  Zap,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  ScrollArea,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';
import { format, addHours, setHours, setMinutes, isToday, isTomorrow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Types
interface Task {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  dueDate?: Date;
}

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  taskId: string;
  taskName: string;
  reason: string;
  confidence: number; // 0-100
}

interface ScheduleSuggestion {
  date: Date;
  slots: TimeSlot[];
  summary: string;
  tips: string[];
}

interface AIScheduleSuggestionProps {
  tasks: Task[];
  existingEvents?: { startTime: Date; endTime: Date }[];
  onConfirm: (slots: TimeSlot[]) => void;
  onCancel?: () => void;
  className?: string;
  trigger?: React.ReactNode;
}

// Time period configurations
const timePeriods = {
  morning: { label: '上午', icon: Sun, color: 'text-yellow-500', start: 9, end: 12 },
  afternoon: { label: '下午', icon: Coffee, color: 'text-orange-500', start: 14, end: 18 },
  evening: { label: '晚上', icon: Moon, color: 'text-purple-500', start: 19, end: 22 },
} as const;

// Priority configurations
const priorityConfig = {
  high: { label: '高优先级', color: 'bg-red-100 text-red-700', energyLevel: 'high' },
  medium: { label: '中优先级', color: 'bg-yellow-100 text-yellow-700', energyLevel: 'medium' },
  low: { label: '低优先级', color: 'bg-green-100 text-green-700', energyLevel: 'low' },
};

// Mock AI scheduling (in real app, would call AI service)
async function generateScheduleSuggestion(
  tasks: Task[],
  existingEvents: { startTime: Date; endTime: Date }[]
): Promise<ScheduleSuggestion> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const today = new Date();
  const slots: TimeSlot[] = [];
  let currentTime = setMinutes(setHours(today, 9), 0);

  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    return 0;
  });

  // Generate time slots
  for (const task of sortedTasks) {
    const hour = currentTime.getHours();

    // Skip lunch break (12-14)
    if (hour >= 12 && hour < 14) {
      currentTime = setMinutes(setHours(currentTime, 14), 0);
    }

    // Skip after work hours
    if (hour >= 18 && hour < 19) {
      currentTime = setMinutes(setHours(currentTime, 19), 0);
    }

    // Stop after 22:00
    if (hour >= 22) {
      break;
    }

    const endTime = addHours(currentTime, task.estimatedMinutes / 60);

    // Generate reason based on task characteristics
    let reason = '';
    let confidence = 85;

    if (task.priority === 'high') {
      if (hour < 12) {
        reason = '高优先级任务适合在精力充沛的上午处理';
        confidence = 92;
      } else {
        reason = '建议尽早完成高优先级任务';
        confidence = 85;
      }
    } else if (task.priority === 'medium') {
      reason = '中等优先级任务可以在下午稳定状态下完成';
      confidence = 80;
    } else {
      reason = '低优先级任务可以安排在相对轻松的时段';
      confidence = 75;
    }

    slots.push({
      id: `slot_${task.id}`,
      startTime: new Date(currentTime),
      endTime,
      taskId: task.id,
      taskName: task.name,
      reason,
      confidence,
    });

    currentTime = addHours(currentTime, task.estimatedMinutes / 60 + 0.25); // Add 15min buffer
  }

  // Generate tips
  const tips = [
    '建议在高精力时段处理复杂任务',
    '每完成一个专注周期，休息5-10分钟',
    '午饭后适合处理例行性工',
    '傍晚时分可以进行回顾和规',
  ];

  return {
    date: today,
    slots,
    summary: `已为 ${slots.length} 个任务安排时间，预计总时�?${Math.round(tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60)} 小时`,
    tips: tips.slice(0, 3),
  };
}

// Time Slot Card Component
interface TimeSlotCardProps {
  slot: TimeSlot;
  selected: boolean;
  onToggle: () => void;
}

function TimeSlotCard({ slot, selected, onToggle }: TimeSlotCardProps) {
  const hour = slot.startTime.getHours();
  const period =
    hour < 12 ? timePeriods.morning : hour < 18 ? timePeriods.afternoon : timePeriods.evening;
  const PeriodIcon = period.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        selected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
      )}
      onClick={onToggle}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Time period icon */}
          <div className={cn('p-2 rounded-md bg-muted', period.color)}>
            <PeriodIcon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{slot.taskName}</span>
              <Badge variant="outline" className="shrink-0">
                {slot.confidence}% 匹配
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{slot.reason}</p>
          </div>

          {/* Selection indicator */}
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
              selected ? 'bg-primary border-primary' : 'border-muted-foreground'
            )}
          >
            {selected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Component
export function AIScheduleSuggestion({
  tasks,
  existingEvents = [],
  onConfirm,
  onCancel,
  className,
  trigger,
}: AIScheduleSuggestionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Generate suggestion
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateScheduleSuggestion(tasks, existingEvents);
      setSuggestion(result);
      // Select all by default
      setSelectedSlots(new Set(result.slots.map((s) => s.id)));
    } catch (error) {
      console.error('Failed to generate schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [tasks, existingEvents]);

  // Toggle slot selection
  const handleToggle = useCallback((slotId: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }, []);

  // Select/deselect all
  const handleSelectAll = useCallback(() => {
    if (!suggestion) return;
    if (selectedSlots.size === suggestion.slots.length) {
      setSelectedSlots(new Set());
    } else {
      setSelectedSlots(new Set(suggestion.slots.map((s) => s.id)));
    }
  }, [suggestion, selectedSlots]);

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (!suggestion) return;
    const slots = suggestion.slots.filter((s) => selectedSlots.has(s.id));
    onConfirm(slots);
    setOpen(false);
  }, [suggestion, selectedSlots, onConfirm]);

  // Format date label
  const dateLabel = suggestion
    ? isToday(suggestion.date)
      ? '今天'
      : isTomorrow(suggestion.date)
        ? '明天'
        : format(suggestion.date, 'MM月dd', { locale: zhCN })
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            AI 安排日程
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn('max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 日程建议
          </DialogTitle>
          <DialogDescription>
            AI 会根据任务优先级、预估时长和你的精力曲线，智能安排最佳时�?
          </DialogDescription>
        </DialogHeader>

        {/* Task summary */}
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                待安排 <strong>{tasks.length}</strong> 个任务
              </span>
              <span className="text-sm text-muted-foreground">
                总时长 {Math.round(tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60)} 小时
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Generate button */}
        {!suggestion && (
          <Button
            onClick={handleGenerate}
            disabled={loading || tasks.length === 0}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 正在规划...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成智能日程
              </>
            )}
          </Button>
        )}

        {/* Suggestion result */}
        {suggestion && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{dateLabel}</span>
                <Badge variant="secondary">{suggestion.slots.length} 个时间段</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedSlots.size === suggestion.slots.length ? '取消全' : '全'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </div>

            {/* Time slots */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-4">
                {suggestion.slots.map((slot) => (
                  <TimeSlotCard
                    key={slot.id}
                    slot={slot}
                    selected={selectedSlots.has(slot.id)}
                    onToggle={() => handleToggle(slot.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Tips */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {suggestion.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        �?{tip}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!suggestion || selectedSlots.size === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            应用 {selectedSlots.size} 个日�?
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AIScheduleSuggestion;
