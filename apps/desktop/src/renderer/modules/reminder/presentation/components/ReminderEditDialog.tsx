/**
 * Reminder Edit Dialog Component
 *
 * 编辑提醒模板对话框组件
 */

import { useState, useEffect } from 'react';
import type { ReminderTemplateClientDTO, UpdateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { ReminderType, TriggerType } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { reminderApplicationService } from '../../application/services/ReminderApplicationService';

interface ReminderEditDialogProps {
  template: ReminderTemplateClientDTO;
  onClose: () => void;
  onUpdated: () => void;
}

export function ReminderEditDialog({ template, onClose, onUpdated }: ReminderEditDialogProps) {
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description || '');
  const [importanceLevel, setImportanceLevel] = useState(template.importanceLevel);
  const [color, setColor] = useState(template.color || '');
  const [tags, setTags] = useState<string[]>(template.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // 触发器设置
  const [triggerType, setTriggerType] = useState<TriggerType>(
    template.trigger?.type || TriggerType.FIXED_TIME
  );
  const [triggerTime, setTriggerTime] = useState('09:00');
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 重置表单当 template 变化时
    setTitle(template.title);
    setDescription(template.description || '');
    setImportanceLevel(template.importanceLevel);
    setColor(template.color || '');
    setTags(template.tags || []);
    
    // 解析触发器
    if (template.trigger) {
      setTriggerType(template.trigger.type);
      if (template.trigger.fixedTime?.time) {
        setTriggerTime(template.trigger.fixedTime.time);
      }
      if (template.trigger.interval?.minutes) {
        setIntervalMinutes(template.trigger.interval.minutes);
      }
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('请输入提醒标题');
      return;
    }

    try {
      setLoading(true);

      const request: UpdateReminderTemplateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        importanceLevel,
        color: color || undefined,
        tags: tags.length > 0 ? tags : undefined,
        trigger: triggerType === TriggerType.FIXED_TIME
          ? {
              type: TriggerType.FIXED_TIME,
              fixedTime: { time: triggerTime },
            }
          : {
              type: TriggerType.INTERVAL,
              interval: { minutes: intervalMinutes },
            },
      };

      await reminderApplicationService.updateReminderTemplate(template.uuid, request);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
      console.error('[ReminderEditDialog] Failed to update:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const importanceLevels = [
    { value: ImportanceLevel.Vital, label: '至关重要' },
    { value: ImportanceLevel.Important, label: '重要' },
    { value: ImportanceLevel.Moderate, label: '一般' },
    { value: ImportanceLevel.Minor, label: '次要' },
    { value: ImportanceLevel.Trivial, label: '琐碎' },
  ];

  const colorPresets = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">编辑提醒模板</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="提醒标题"
              className="w-full px-3 py-2 border rounded-md bg-background"
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

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium mb-1">触发方式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="triggerType"
                  checked={triggerType === TriggerType.FIXED_TIME}
                  onChange={() => setTriggerType(TriggerType.FIXED_TIME)}
                  className="w-4 h-4"
                />
                <span className="text-sm">固定时间</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="triggerType"
                  checked={triggerType === TriggerType.INTERVAL}
                  onChange={() => setTriggerType(TriggerType.INTERVAL)}
                  className="w-4 h-4"
                />
                <span className="text-sm">时间间隔</span>
              </label>
            </div>
          </div>

          {/* Fixed Time Input */}
          {triggerType === TriggerType.FIXED_TIME && (
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

          {/* Interval Input */}
          {triggerType === TriggerType.INTERVAL && (
            <div>
              <label className="block text-sm font-medium mb-1">间隔时间（分钟）</label>
              <input
                type="number"
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
                min={1}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                每 {intervalMinutes} 分钟触发一次
              </p>
            </div>
          )}

          {/* Current Trigger Info */}
          {template.triggerText && (
            <div className="p-3 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">当前设置: </span>
              <span className="text-sm font-medium">{template.triggerText}</span>
            </div>
          )}

          {/* Importance Level */}
          <div>
            <label className="block text-sm font-medium mb-1">重要程度</label>
            <select
              value={importanceLevel}
              onChange={(e) => setImportanceLevel(e.target.value as ImportanceLevel)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {importanceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1">颜色</label>
            <div className="flex gap-2 flex-wrap">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor('')}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  !color ? 'border-foreground' : 'border-gray-300'
                }`}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary rounded-md text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签"
                className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-4 py-2 bg-secondary text-sm rounded-md hover:bg-secondary/80 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">类型:</span>
              <span>{template.type === ReminderType.ONE_TIME ? '一次性' : '循环'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">状态:</span>
              <span className={template.effectiveEnabled ? 'text-green-600' : 'text-yellow-600'}>
                {template.effectiveEnabled ? '已启用' : '已暂停'}
              </span>
            </div>
            {template.stats && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">触发次数:</span>
                <span>{template.stats.totalTriggers || 0}</span>
              </div>
            )}
            {template.nextTriggerText && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">下次触发:</span>
                <span>{template.nextTriggerText}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
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
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
