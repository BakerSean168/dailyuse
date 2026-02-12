/**
 * Schedule Edit Dialog Component
 *
 * 编辑调度任务对话框组件
 * 支持暂停/恢复任务状态和元数据更新
 */

import { useState, useEffect } from 'react';
import { scheduleApplicationService } from '@dailyuse/schedule/application-client';
import type { ScheduleTask } from '@dailyuse/schedule/domain-client';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

interface ScheduleEditDialogProps {
  task: ScheduleTask;
  onClose: () => void;
  onUpdated: () => void;
}

export function ScheduleEditDialog({ task, onClose, onUpdated }: ScheduleEditDialogProps) {
  const [enabled, setEnabled] = useState(task.enabled);
  const [tags, setTags] = useState<string[]>(task.metadata?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 重置表单当 task 变化时
    setEnabled(task.enabled);
    setTags(task.metadata?.tags || []);
  }, [task]);

  const handleToggleEnabled = async () => {
    setError(null);
    try {
      setLoading(true);
      if (enabled) {
        await scheduleApplicationService.pauseScheduleTask(task.uuid);
      } else {
        await scheduleApplicationService.resumeScheduleTask(task.uuid);
      }
      setEnabled(!enabled);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
      console.error('[ScheduleEditDialog] Failed to toggle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setError(null);
    try {
      setLoading(true);
      const newTags = [...tags, newTag.trim()];
      await scheduleApplicationService.updateTaskMetadata(task.uuid, {
        tags: newTags,
      });
      setTags(newTags);
      setNewTag('');
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setError(null);
    try {
      setLoading(true);
      const newTags = tags.filter((t) => t !== tagToRemove);
      await scheduleApplicationService.updateTaskMetadata(task.uuid, {
        tags: newTags,
      });
      setTags(newTags);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setError(null);
    try {
      setLoading(true);
      await scheduleApplicationService.completeScheduleTask(task.uuid, '用户手动完成');
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '完成任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    try {
      setLoading(true);
      await scheduleApplicationService.cancelScheduleTask(task.uuid, '用户手动取消');
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 检查任务是否已结束
  const isTaskEnded = [
    ScheduleTaskStatus.COMPLETED,
    ScheduleTaskStatus.CANCELLED,
    ScheduleTaskStatus.FAILED,
  ].includes(task.status as ScheduleTaskStatus);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">编辑调度任务</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Task Info (Read-only) */}
          <div className="p-4 bg-muted/50 rounded-md space-y-2">
            <h3 className="font-medium text-sm mb-2">任务信息</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">名称:</span>
              <span className="font-medium">{task.name}</span>
            </div>
            {task.description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">描述:</span>
                <span>{task.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">调度规则:</span>
              <span className="font-mono text-xs">{task.schedule.cronExpression}</span>
            </div>
            {task.schedule.cronDescription && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">说明:</span>
                <span>{task.schedule.cronDescription}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">来源模块:</span>
              <span>{task.sourceModuleDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">执行统计:</span>
              <span>{task.executionSummary}</span>
            </div>
            {task.nextRunAtFormatted && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">下次运行:</span>
                <span>{task.nextRunAtFormatted}</span>
              </div>
            )}
          </div>

          {/* Status Toggle */}
          {!isTaskEnded && (
            <div className="p-4 border rounded-md">
              <h3 className="font-medium text-sm mb-3">任务状态</h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm">
                    当前状态:
                    <span
                      className={`ml-2 font-medium ${enabled ? 'text-green-600' : 'text-yellow-600'}`}
                    >
                      {enabled ? '运行中' : '已暂停'}
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleToggleEnabled}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    enabled
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {loading ? '处理中...' : enabled ? '暂停任务' : '恢复任务'}
                </button>
              </div>
            </div>
          )}

          {/* Tags Management */}
          <div className="p-4 border rounded-md">
            <h3 className="font-medium text-sm mb-3">标签管理</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">暂无标签</span>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加新标签"
                className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                onClick={handleAddTag}
                disabled={loading || !newTag.trim()}
                className="px-4 py-2 bg-secondary text-sm rounded-md hover:bg-secondary/80 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {!isTaskEnded && (
            <div className="p-4 border rounded-md">
              <h3 className="font-medium text-sm mb-3">快捷操作</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 disabled:opacity-50"
                >
                  标记完成
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  取消任务
                </button>
              </div>
            </div>
          )}

          {/* Task Ended Notice */}
          {isTaskEnded && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground text-center">
                此任务已 {task.statusDisplay}，无法进行更多操作
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
