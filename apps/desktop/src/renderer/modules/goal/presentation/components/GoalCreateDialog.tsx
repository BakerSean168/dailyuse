/**
 * Goal Create Dialog
 *
 * 创建新目标的对话框
 * EPIC-015 重构: 使用 ApplicationService 替代 Container
 */

import { useState } from 'react';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import type { CreateGoalRequest } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

interface GoalCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function GoalCreateDialog({ open, onClose, onCreated }: GoalCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<ImportanceLevel>(ImportanceLevel.Moderate);
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('请输入目标标题');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // 构建符合 contracts 类型的请求
      const request: CreateGoalRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        importance,
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
      };
      
      await goalApplicationService.createGoal(request);

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
      console.error('[GoalCreateDialog] Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">创建新目标</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              目标标题 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：完成产品 MVP"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目标的详细描述..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Importance */}
          <div className="space-y-2">
            <label className="text-sm font-medium">重要性</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              <option value={ImportanceLevel.Trivial}>无关紧要</option>
              <option value={ImportanceLevel.Minor}>不太重要</option>
              <option value={ImportanceLevel.Moderate}>中等重要</option>
              <option value={ImportanceLevel.Important}>非常重要</option>
              <option value={ImportanceLevel.Vital}>极其重要</option>
            </select>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">目标日期</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalCreateDialog;
