/**
 * Reminder Create Dialog Component
 *
 * 创建提醒对话框组件 - 简化版本
 */

import { useState } from 'react';
import type { CreateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { ReminderType, TriggerType, NotificationChannel } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { reminderApplicationService } from '@dailyuse/reminder/application-client';

interface ReminderCreateDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

type ScheduleType = 'once' | 'interval';

export function ReminderCreateDialog({ onClose, onCreated }: ReminderCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once');
  const [triggerTime, setTriggerTime] = useState('09:00');
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [importance, setImportance] = useState<ImportanceLevel>(ImportanceLevel.Moderate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('请输入提醒标题');
      return;
    }

    try {
      setLoading(true);

      const isInterval = scheduleType === 'interval';

      const request: CreateReminderTemplateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: ReminderType.RECURRING, // All reminders are recurring in simplified version
        trigger: {
          type: isInterval ? TriggerType.INTERVAL : TriggerType.FIXED_TIME,
          fixedTime: !isInterval
            ? {
                time: triggerTime, // "HH:mm" format
              }
            : undefined,
          interval: isInterval
            ? {
                minutes: intervalMinutes,
              }
            : undefined,
        },
        activeTime: {
          activatedAt: Date.now(),
        },
        notificationConfig: {
          channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
          title: title.trim(),
          body: description.trim() || undefined,
          sound: {
            enabled: true,
          },
          vibration: {
            enabled: true,
          },
        },
        importanceLevel: importance,
        tags: [],
      };

      await reminderApplicationService.createReminderTemplate(request);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      console.error('[ReminderCreateDialog] Failed to create:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">新建提醒</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">提醒标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入提醒标题"
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
              placeholder="提醒描述（可选）"
              className="w-full px-3 py-2 border rounded-md bg-background resize-none"
              rows={3}
            />
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium mb-1">触发类型</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="once">固定时间</option>
              <option value="interval">间隔重复</option>
            </select>
          </div>

          {/* Trigger Time (for fixed time) */}
          {scheduleType === 'once' && (
            <div>
              <label className="block text-sm font-medium mb-1">触发时间</label>
              <input
                type="time"
                value={triggerTime}
                onChange={(e) => setTriggerTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          )}

          {/* Interval (for interval type) */}
          {scheduleType === 'interval' && (
            <div>
              <label className="block text-sm font-medium mb-1">间隔时间（分钟）</label>
              <input
                type="number"
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 30)}
                min={1}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          )}

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium mb-1">重要程度</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value={ImportanceLevel.Vital}>极其重要</option>
              <option value={ImportanceLevel.Important}>非常重要</option>
              <option value={ImportanceLevel.Moderate}>中等重要</option>
              <option value={ImportanceLevel.Minor}>不太重要</option>
              <option value={ImportanceLevel.Trivial}>无关紧要</option>
            </select>
          </div>

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
