/**
 * FocusModePanel Component
 *
 * 专注模式主面�?
 * Story 11-7: Advanced Features
 */

import { useState, useCallback } from 'react';
import { Zap, Target, CheckSquare, Play, Pause, Clock, List, Settings, Maximize2, Minimize2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { PomodoroTimer } from './PomodoroTimer';
import { FocusStatistics } from './FocusStatistics';

// Types
interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}

interface FocusSession {
  id: string;
  date: Date;
  duration: number;
  taskId?: string;
  taskName?: string;
  completed: boolean;
}

interface FocusModePanelProps {
  tasks: Task[];
  sessions: FocusSession[];
  onTaskSelect?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onSessionComplete?: (taskId: string | undefined, duration: number, completed: boolean) => void;
  className?: string;
}

// Priority configurations
const priorityConfig = {
  high: { label: '�?, color: 'bg-red-500' },
  medium: { label: '�?, color: 'bg-yellow-500' },
  low: { label: '�?, color: 'bg-green-500' },
};

// Task Item Component
interface TaskItemProps {
  task: Task;
  selected: boolean;
  onSelect: () => void;
  onComplete: () => void;
}

function TaskItem({ task, selected, onSelect, onComplete }: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
        task.completed && 'opacity-60'
      )}
      onClick={onSelect}
    >
      {/* Complete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
      >
        <CheckSquare
          className={cn('h-4 w-4', task.completed ? 'text-green-500' : 'text-muted-foreground')}
        />
      </Button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', task.completed && 'line-through')}>
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.priority && (
            <div className={cn('w-2 h-2 rounded-full', priorityConfig[task.priority].color)} />
          )}
          {task.estimatedPomodoros && (
            <span className="text-xs text-muted-foreground">
              🍅 {task.completedPomodoros || 0}/{task.estimatedPomodoros}
            </span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <Badge variant="secondary" className="shrink-0">
          当前
        </Badge>
      )}
    </div>
  );
}

// Main Component
export function FocusModePanel({
  tasks,
  sessions,
  onTaskSelect,
  onTaskComplete,
  onSessionComplete,
  className,
}: FocusModePanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'tasks' | 'stats'>('timer');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Handle task selection
  const handleTaskSelect = useCallback(
    (task: Task) => {
      setSelectedTaskId(task.id);
      onTaskSelect?.(task);
    },
    [onTaskSelect]
  );

  // Handle session complete
  const handleSessionComplete = useCallback(
    (phase: string, duration: number) => {
      if (phase === 'work') {
        onSessionComplete?.(selectedTaskId || undefined, Math.round(duration / 60), true);
      }
    },
    [selectedTaskId, onSessionComplete]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    // In real app, would use Electron's fullscreen API
  }, [isFullscreen]);

  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : '',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">专注模式</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer" className="gap-2">
            <Clock className="h-4 w-4" />
            计时�?
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <List className="h-4 w-4" />
            任务
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Target className="h-4 w-4" />
            统计
          </TabsTrigger>
        </TabsList>

        {/* Timer Tab */}
        <TabsContent value="timer" className="flex-1 flex flex-col items-center justify-center">
          <div className="space-y-4 w-full max-w-sm">
            {/* Current task indicator */}
            {selectedTask && (
              <Card className="bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">当前任务:</span>
                    <span className="text-sm truncate">{selectedTask.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timer */}
            <div className="flex justify-center">
              <PomodoroTimer
                taskName={selectedTask?.name}
                onComplete={handleSessionComplete}
              />
            </div>

            {/* Quick task select */}
            {!selectedTask && pendingTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">选择一个任务开始专�?/CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 3).map((task) => (
                      <Button
                        key={task.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleTaskSelect(task)}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        <span className="truncate">{task.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {/* Pending tasks */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  待完�?({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      没有待完成的任务
                    </p>
                  ) : (
                    pendingTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        selected={task.id === selectedTaskId}
                        onSelect={() => handleTaskSelect(task)}
                        onComplete={() => onTaskComplete?.(task)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    已完�?({completedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        selected={task.id === selectedTaskId}
                        onSelect={() => handleTaskSelect(task)}
                        onComplete={() => onTaskComplete?.(task)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="flex-1">
          <ScrollArea className="h-[400px]">
            <FocusStatistics sessions={sessions} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FocusModePanel;
