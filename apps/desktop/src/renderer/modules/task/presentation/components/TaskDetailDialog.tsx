/**
 * Task Detail Dialog
 *
 * 任务模板详情对话框 - 查看、编辑任务模板
 * 
 * EPIC-015 重构: 使用 Hook 代替直接调用 Infrastructure 层
 * - 使用 useTaskTemplate Hook 进行数据操作
 * - 使用 Entity 类型 (TaskTemplate)
 */

import { useState, useEffect, useCallback } from 'react';
import type { TaskTemplate } from '@dailyuse/domain-client/task';
import type { UpdateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TimeEstimationCard } from '../../../../shared/components/task/TimeEstimationCard';
import type { TimeEstimate } from '@dailyuse/contracts/goal';
import { useTaskTemplate } from '../hooks/useTaskTemplate';

interface TaskDetailDialogProps {
  templateUuid: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function TaskDetailDialog({ templateUuid, open, onClose, onUpdated }: TaskDetailDialogProps) {
  const [template, setTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 时间预估状态
  const [timeEstimate, setTimeEstimate] = useState<TimeEstimate | null>(null);
  const [estimatingTime, setEstimatingTime] = useState(false);

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState<ImportanceLevel>(ImportanceLevel.Moderate);

  // 使用 Hook 进行数据操作
  const { getTemplate, updateTemplate, deleteTemplate } = useTaskTemplate();

  const loadTemplate = useCallback(async () => {
    if (!templateUuid || !open) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getTemplate(templateUuid);
      if (result) {
        setTemplate(result);
        // 初始化编辑表单
        setEditTitle(result.title);
        setEditDescription(result.description ?? '');
        setEditImportance(result.importance);
      }
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to load template:', err);
      setError('加载任务模板失败');
    } finally {
      setLoading(false);
    }
  }, [templateUuid, open, getTemplate]);

  useEffect(() => {
    if (open) {
      loadTemplate();
      setIsEditing(false);
    }
  }, [open, loadTemplate]);

  const handleSave = async () => {
    if (!template) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // 构建符合 contracts 类型的请求
      // Story 2.3: urgency 已移除 - Priority 由后端根据 importance 和 dueDate 自动计算
      const request: UpdateTaskTemplateRequest = {
        title: editTitle,
        description: editDescription || undefined,
        importance: editImportance,
      };
      
      await updateTemplate(template.uuid, request);
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to save template:', err);
      setError('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;

    const confirmed = window.confirm('确定要删除这个任务模板吗？此操作无法撤销。');
    if (!confirmed) return;

    try {
      setIsSaving(true);
      await deleteTemplate(template.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to delete template:', err);
      setError('删除失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (template) {
      setEditTitle(template.title);
      setEditDescription(template.description ?? '');
      setEditImportance(template.importance);
    }
    setIsEditing(false);
  };

  // 时间预估处理
  const handleEstimateTimeClick = async () => {
    if (!template) return;

    setEstimatingTime(true);
    try {
      // 模拟AI调用 - 在实际应用中，这里会调用TaskTimeEstimationService
      // const estimate = await TimeEstimationService.estimateTaskTime({
      //   taskId: template.uuid,
      //   taskTitle: template.title,
      //   taskDescription: template.description || '',
      //   complexity: 'medium'
      // });
      
      // 临时模拟数据 - 演示用
      // 默认预估时间为 60 分钟
      const defaultEstimatedMinutes = 60;
      const mockEstimate: TimeEstimate = {
        taskId: template.uuid,
        taskTitle: template.title,
        estimatedMinutes: defaultEstimatedMinutes,
        confidenceScore: 0.75,
        reasoning: '基于任务描述复杂度和历史数据估算',
        adjustedMinutes: Math.round(defaultEstimatedMinutes * 1.1),
        adjustmentReason: '基于用户历史数据调整 +10%',
      };
      
      setTimeEstimate(mockEstimate);
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to estimate time:', err);
      setError('时间预估失败');
    } finally {
      setEstimatingTime(false);
    }
  };

  const handleEstimateChange = async (minutes: number) => {
    if (!template) return;

    try {
      setIsSaving(true);
      await updateTemplate(template.uuid, {
        title: template.title,
      });
      // 更新本地预估
      setTimeEstimate(prev => prev ? { ...prev, estimatedMinutes: minutes } : null);
      onUpdated();
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to update estimate:', err);
      setError('保存预估失败');
    } finally {
      setIsSaving(false);
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
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? '编辑任务模板' : '任务模板详情'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !template ? (
            <div className="text-center py-12 text-muted-foreground">
              任务模板不存在
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">标题</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                ) : (
                  <h3 className="text-lg font-semibold">{template.title}</h3>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">描述</label>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded-md resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {template.description || '无描述'}
                  </p>
                )}
              </div>

              {/* Importance */}
              <div className="space-y-2">
                <label className="text-sm font-medium">重要性</label>
                {isEditing ? (
                  <select
                    value={editImportance}
                    onChange={(e) => setEditImportance(e.target.value as ImportanceLevel)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={ImportanceLevel.Trivial}>无关紧要</option>
                    <option value={ImportanceLevel.Minor}>不太重要</option>
                    <option value={ImportanceLevel.Moderate}>中</option>
                    <option value={ImportanceLevel.Important}>重要</option>
                    <option value={ImportanceLevel.Vital}>极其重要</option>
                  </select>
                ) : (
                  <div className="text-muted-foreground">{template.importanceText}</div>
                )}
              </div>

              {/* Estimated Time with AI Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">预计用时</label>
                  <button
                    onClick={handleEstimateTimeClick}
                    disabled={estimatingTime}
                    className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {estimatingTime ? '预估中...' : '🤖 AI预估'}
                  </button>
                </div>
                {timeEstimate ? (
                  <TimeEstimationCard
                    estimate={timeEstimate}
                    isEstimating={estimatingTime}
                    showDetails={true}
                    onReEstimate={handleEstimateTimeClick}
                    onEstimateChange={handleEstimateChange}
                  />
                ) : (
                  <div className="text-muted-foreground">
                    未设置
                  </div>
                )}
              </div>

              {/* Task Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务类型</label>
                  <div className="text-muted-foreground">{template.taskTypeText}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">状态</label>
                  <div className="text-muted-foreground">{template.statusText}</div>
                </div>
              </div>

              {/* Time Config */}
              {template.timeDisplayText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间设置</label>
                  <div className="text-muted-foreground">{template.timeDisplayText}</div>
                </div>
              )}

              {/* Recurrence */}
              {template.recurrenceText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">重复规则</label>
                  <div className="text-muted-foreground">🔄 {template.recurrenceText}</div>
                </div>
              )}

              {/* Reminder */}
              {template.hasReminder && template.reminderText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">提醒</label>
                  <div className="text-muted-foreground">🔔 {template.reminderText}</div>
                </div>
              )}

              {/* Goal Binding */}
              {template.isLinkedToGoal && template.goalLinkText && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">关联目标</label>
                  <div className="text-muted-foreground">🎯 {template.goalLinkText}</div>
                </div>
              )}

              {/* Instance Stats */}
              <div className="space-y-2">
                <label className="text-sm font-medium">任务实例统计</label>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-secondary rounded-md">
                    <div className="text-2xl font-bold">{template.instanceCount}</div>
                    <div className="text-sm text-muted-foreground">总实例</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-md">
                    <div className="text-2xl font-bold text-green-700">{template.completedInstanceCount}</div>
                    <div className="text-sm text-green-600">已完成</div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-md">
                    <div className="text-2xl font-bold text-yellow-700">{template.pendingInstanceCount}</div>
                    <div className="text-sm text-yellow-600">待处理</div>
                  </div>
                </div>
                {template.instanceCount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">完成率</span>
                      <span className="font-medium">{Math.round(template.completionRate)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${template.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">创建时间: </span>
                  {template.formattedCreatedAt}
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间: </span>
                  {template.formattedUpdatedAt}
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={isSaving || loading || !template}
            className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50"
          >
            删除模板
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editTitle.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  关闭
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading || !template}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  编辑
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailDialog;
