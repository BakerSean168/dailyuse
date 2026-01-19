/**
 * Schedule Create Dialog Component
 *
 * 创建调度任务对话框组件
 */

import { useState } from 'react';
import { scheduleApplicationService } from '@dailyuse/application-client/schedule';
import type {
  CreateScheduleTaskRequest,
  ScheduleConfigServerDTO,
} from '@dailyuse/contracts/schedule';
import { SourceModule, Timezone } from '@dailyuse/contracts/schedule';

interface ScheduleCreateDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';

// Helper function to convert schedule type to cron expression
function getCronExpression(type: ScheduleType, scheduledTime?: string): string {
  if (type === 'cron') {
    return '0 9 * * *'; // Default: every day at 9:00
  }

  // Parse time from scheduledTime if available
  const date = scheduledTime ? new Date(scheduledTime) : new Date();
  const minute = date.getMinutes();
  const hour = date.getHours();

  switch (type) {
    case 'once':
      // For one-time, we use the exact date/time as cron
      return `${minute} ${hour} ${date.getDate()} ${date.getMonth() + 1} *`;
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${date.getDay()}`;
    case 'monthly':
      return `${minute} ${hour} ${date.getDate()} * *`;
    default:
      return '0 9 * * *';
  }
}

export function ScheduleCreateDialog({ onClose, onCreated }: ScheduleCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceModule, setSourceModule] = useState<SourceModule>(SourceModule.REMINDER);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once');
  const [scheduledTime, setScheduledTime] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('请输入任务名称');
      return;
    }

    if (scheduleType === 'once' && !scheduledTime) {
      setError('请选择执行时间');
      return;
    }

    if (scheduleType === 'cron' && !cronExpression) {
      setError('请输入 Cron 表达式');
      return;
    }

    try {
      setLoading(true);

      // Build cron expression based on schedule type
      const finalCronExpression =
        scheduleType === 'cron' ? cronExpression : getCronExpression(scheduleType, scheduledTime);

      const scheduleConfig: ScheduleConfigServerDTO = {
        cronExpression: finalCronExpression,
        timezone: Timezone.SHANGHAI,
        startDate: scheduledTime ? new Date(scheduledTime).toISOString() : null,
        endDate: scheduleType === 'once' ? new Date(scheduledTime).toISOString() : null,
        maxExecutions: scheduleType === 'once' ? 1 : null,
      };

      const request: CreateScheduleTaskRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        sourceModule,
        sourceEntityId: `desktop-${Date.now()}`,
        schedule: scheduleConfig,
      };

      await scheduleApplicationService.createScheduleTask(request);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      console.error('[ScheduleCreateDialog] Failed to create:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">新建调度任务</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">任务名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称"
              className="w-full px-3 py-2 border rounded-md bg-background"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任务描述（可选）"
              className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              rows={3}
            />
          </div>

          {/* Source Module */}
          <div>
            <label className="block text-sm font-medium mb-1">来源模块</label>
            <select
              value={sourceModule}
              onChange={(e) => setSourceModule(e.target.value as SourceModule)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value={SourceModule.REMINDER}>🔔 提醒</option>
              <option value={SourceModule.TASK}>✅ 任务</option>
              <option value={SourceModule.GOAL}>🎯 目标</option>
            </select>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium mb-1">调度类型</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="once">一次性</option>
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="cron">Cron 表达式</option>
            </select>
          </div>

          {/* Scheduled Time (for once) */}
          {scheduleType === 'once' && (
            <div>
              <label className="block text-sm font-medium mb-1">执行时间 *</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          )}

          {/* Cron Expression */}
          {scheduleType === 'cron' && (
            <div>
              <label className="block text-sm font-medium mb-1">Cron 表达式 *</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="例如: 0 9 * * *（每天 9 点）"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                格式: 分 时 日 月 星期 (例: 0 9 * * * 表示每天9点)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-secondary transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
