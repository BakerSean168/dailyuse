/**
 * Goal Detail Dialog
 *
 * 目标详情对话框 - 显示目标的完整信息
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Goal } from '@dailyuse/goal/domain-client';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { useGoal } from '../hooks';

interface GoalDetailDialogProps {
  goalUuid: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function GoalDetailDialog({ goalUuid, open, onClose, onUpdated }: GoalDetailDialogProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 useGoal hook
  const { getGoal, completeGoal: completeGoalAction, archiveGoal: archiveGoalAction, deleteGoal: deleteGoalAction } = useGoal();

  // 加载目标详情
  useEffect(() => {
    if (open && goalUuid) {
      loadGoalDetail();
    }
  }, [open, goalUuid]);

  const loadGoalDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGoal(goalUuid);
      setGoal(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('[GoalDetailDialog] Failed to load goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!goal) return;
    
    try {
      await completeGoalAction(goal.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('[GoalDetailDialog] Failed to complete goal:', err);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleArchive = async () => {
    if (!goal) return;
    
    try {
      await archiveGoalAction(goal.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('[GoalDetailDialog] Failed to archive goal:', err);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!goal || !confirm('确定要删除这个目标吗？')) return;
    
    try {
      await deleteGoalAction(goal.uuid);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('[GoalDetailDialog] Failed to delete goal:', err);
      setError(err instanceof Error ? err.message : '删除失败');
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
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">目标详情</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {goal && !loading && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
                {goal.description && (
                  <p className="text-muted-foreground">{goal.description}</p>
                )}
              </div>

              {/* 状态和进度 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      goal.status === GoalStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                      goal.status === GoalStatus.COMPLETED ? 'bg-blue-100 text-blue-800' :
                      goal.status === GoalStatus.ARCHIVED ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.status === GoalStatus.ACTIVE && '进行中'}
                      {goal.status === GoalStatus.COMPLETED && '已完成'}
                      {goal.status === GoalStatus.ARCHIVED && '已归档'}
                      {goal.status === GoalStatus.DRAFT && '草稿'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">进度</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${goal.overallProgress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{goal.overallProgress || 0}%</span>
                  </div>
                </div>
              </div>

              {/* 优先级信息 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">重要程度</label>
                <div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    goal.importance === ImportanceLevel.Vital ? 'bg-red-100 text-red-800' :
                    goal.importance === ImportanceLevel.Important ? 'bg-orange-100 text-orange-800' :
                    goal.importance === ImportanceLevel.Moderate ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.importance === ImportanceLevel.Vital && '极其重要'}
                    {goal.importance === ImportanceLevel.Important && '重要'}
                    {goal.importance === ImportanceLevel.Moderate && '一般'}
                    {goal.importance === ImportanceLevel.Minor && '不重要'}
                  </span>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                  <p className="text-sm">
                    {format(new Date(goal.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>

                {goal.targetDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">目标日期</label>
                    <p className="text-sm">
                      {format(new Date(goal.targetDate), 'yyyy-MM-dd', { locale: zhCN })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {goal && !loading && (
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/50">
            {goal.status === GoalStatus.ACTIVE && (
              <>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  完成目标
                </button>
                <button
                  onClick={handleArchive}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  归档
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              删除
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalDetailDialog;
