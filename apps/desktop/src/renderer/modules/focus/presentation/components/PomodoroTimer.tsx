/**
 * PomodoroTimer Component
 *
 * 番茄钟计时器组件
 * Story 11-7: Advanced Features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Zap, Settings, Volume2, VolumeX } from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Progress,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Label,
  Input,
  cn,
} from '@dailyuse/ui-react-shadcn';

// Types
type TimerPhase = 'work' | 'short_break' | 'long_break';
type TimerStatus = 'idle' | 'running' | 'paused';

interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface PomodoroTimerProps {
  taskName?: string;
  onComplete?: (phase: TimerPhase, duration: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  onSkip?: () => void;
  className?: string;
}

// Default settings
const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

// Phase configs
const phaseConfig: Record<TimerPhase, { label: string; color: string; icon: typeof Zap }> = {
  work: { label: '专注时间', color: 'text-primary', icon: Zap },
  short_break: { label: '短休', color: 'text-green-500', icon: Coffee },
  long_break: { label: '长休', color: 'text-blue-500', icon: Coffee },
};

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Timer Settings Component
interface TimerSettingsProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
}

function TimerSettings({ settings, onChange }: TimerSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="work">专注时长 (分钟)</Label>
        <Input
          id="work"
          type="number"
          min={1}
          max={120}
          value={settings.workDuration}
          onChange={(e) => onChange({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="short">短休息时间(分钟)</Label>
        <Input
          id="short"
          type="number"
          min={1}
          max={30}
          value={settings.shortBreakDuration}
          onChange={(e) => onChange({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="long">长休息时间(分钟)</Label>
        <Input
          id="long"
          type="number"
          min={1}
          max={60}
          value={settings.longBreakDuration}
          onChange={(e) => onChange({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sessions">长休息间隔(次数)</Label>
        <Input
          id="sessions"
          type="number"
          min={1}
          max={10}
          value={settings.sessionsUntilLongBreak}
          onChange={(e) => onChange({ ...settings, sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
        />
      </div>
    </div>
  );
}

// Main Component
export function PomodoroTimer({
  taskName,
  onComplete,
  onStart,
  onPause,
  onSkip,
  className,
}: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [phase, setPhase] = useState<TimerPhase>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [totalTime, setTotalTime] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Get current phase duration
  const getPhaseDuration = useCallback(
    (p: TimerPhase) => {
      switch (p) {
        case 'work':
          return settings.workDuration * 60;
        case 'short_break':
          return settings.shortBreakDuration * 60;
        case 'long_break':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  // Play notification sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    // Use system notification or audio
    try {
      const audio = new Audio('/sounds/timer-complete.mp3');
      audio.play().catch(() => {
        // Fallback: use system beep
        console.log('Timer completed!');
      });
    } catch {
      console.log('Timer completed!');
    }
  }, [soundEnabled]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    playSound();

    const duration = totalTime - timeLeft;
    onComplete?.(phase, duration);

    if (phase === 'work') {
      const newSessionCount = completedSessions + 1;
      setCompletedSessions(newSessionCount);

      // Check if it's time for a long break
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setPhase('long_break');
        const duration = getPhaseDuration('long_break');
        setTimeLeft(duration);
        setTotalTime(duration);
      } else {
        setPhase('short_break');
        const duration = getPhaseDuration('short_break');
        setTimeLeft(duration);
        setTotalTime(duration);
      }
    } else {
      // After break, start work phase
      setPhase('work');
      const duration = getPhaseDuration('work');
      setTimeLeft(duration);
      setTotalTime(duration);
    }

    setStatus('idle');
  }, [phase, completedSessions, settings, totalTime, timeLeft, getPhaseDuration, playSound, onComplete]);

  // Timer tick
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [status, handlePhaseComplete]);

  // Start timer
  const handleStart = useCallback(() => {
    setStatus('running');
    onStart?.();
  }, [onStart]);

  // Pause timer
  const handlePause = useCallback(() => {
    setStatus('paused');
    onPause?.();
  }, [onPause]);

  // Reset timer
  const handleReset = useCallback(() => {
    setStatus('idle');
    const duration = getPhaseDuration(phase);
    setTimeLeft(duration);
    setTotalTime(duration);
  }, [phase, getPhaseDuration]);

  // Skip to next phase
  const handleSkip = useCallback(() => {
    onSkip?.();
    handlePhaseComplete();
  }, [onSkip, handlePhaseComplete]);

  // Calculate progress
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const { label, color, icon: PhaseIcon } = phaseConfig[phase];

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Phase indicator */}
          <div className="flex items-center gap-2">
            <PhaseIcon className={cn('h-5 w-5', color)} />
            <span className={cn('font-medium', color)}>{label}</span>
            <Badge variant="secondary" className="ml-2">
              �?{completedSessions + 1} 个番�?
            </Badge>
          </div>

          {/* Task name */}
          {taskName && (
            <p className="text-sm text-muted-foreground text-center truncate max-w-full">
              当前任务: {taskName}
            </p>
          )}

          {/* Timer display */}
          <div className="relative w-48 h-48">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} 283`}
                className={color}
              />
            </svg>
            {/* Time text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm text-muted-foreground">
                {status === 'running' ? '专注中...' : status === 'paused' ? '已暂' : '准备开'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {status === 'running' ? (
              <Button size="lg" onClick={handlePause}>
                <Pause className="h-5 w-5 mr-2" />
                暂停
              </Button>
            ) : (
              <Button size="lg" onClick={handleStart}>
                <Play className="h-5 w-5 mr-2" />
                {status === 'paused' ? '继续' : '开'}
              </Button>
            )}

            <Button variant="outline" size="icon" onClick={handleReset} title="重置">
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button variant="outline" size="icon" onClick={handleSkip} title="跳过">
              <SkipForward className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? '关闭声音' : '开启声'}
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="设置">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <TimerSettings settings={settings} onChange={setSettings} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Session indicators */}
          <div className="flex items-center gap-1">
            {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full',
                  i < completedSessions % settings.sessionsUntilLongBreak
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PomodoroTimer;
