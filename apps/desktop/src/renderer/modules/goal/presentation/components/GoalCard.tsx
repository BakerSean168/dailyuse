/**
 * Goal Card Component
 *
 * 显示单个目标的卡片组件
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Goal } from '@dailyuse/goal/domain-client';
import { useGoal } from '../hooks';
import { GoalDetailDialog } from './GoalDetailDialog';

interface GoalCardProps {
  goal: Goal;
  onUpdate: () => void;
}

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 使用 useGoal hook
  const { completeGoal: completeGoalAction, archiveGoal: archiveGoalAction, activateGoal: activateGoalAction } = useGoal();

  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      await completeGoalAction(goal.id);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to complete goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsUpdating(true);
      await archiveGoalAction(goal.id);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to archive goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivate = async () => {
    try {
      setIsUpdating(true);
      await activateGoalAction(goal.id);
      onUpdate();
    } catch (err) {
      console.error('[GoalCard] Failed to activate goal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 状态颜色映射
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
  };

  // 重要性颜色 (ImportanceLevel: Vital, Important, Moderate, Minor, Trivial)
  const importanceColors: Record<string, string> = {
    Vital: 'text-red-600',
    Important: 'text-orange-500',
    Moderate: 'text-blue-500',
    Minor: 'text-gray-500',
    Trivial: 'text-gray-400',
  };

  // 计算剩余天数
  const getDaysRemaining = () => {
    if (!goal.targetDate) return null;
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  // 计算进度 (overallProgress 是 0-100 的百分比)
  const progress = goal.overallProgress ?? 0;

  const handleDetailClose = () => {
    setShowDetail(false);
  };

  const handleDetailUpdate = () => {
    onUpdate();
    setShowDetail(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不打开详情
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowDetail(true);
  };

  return (
    <div
      className={`
        rounded-lg border bg-card p-4 space-y-3 transition-all cursor-pointer
        hover:shadow-md hover:border-primary/50
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
      `}
      style={{ borderLeftColor: goal.color ?? undefined, borderLeftWidth: goal.color ? '4px' : undefined }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {goal.description}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[goal.status] ?? statusColors.DRAFT}`}>
          {goal.status}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">进度</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {goal.importance && (
          <span className={`${importanceColors[goal.importance] ?? 'text-gray-500'}`}>
            ⚡ {goal.importanceText ?? goal.importance}
          </span>
        )}
        {goal.targetDate && (
          <span className={`${
            daysRemaining !== null && daysRemaining < 0 ? 'text-red-600 font-medium' :
            daysRemaining !== null && daysRemaining <= 7 ? 'text-orange-500' :
            'text-muted-foreground'
          }`}>
            📅 {daysRemaining !== null && daysRemaining < 0 
              ? `已逾期 ${Math.abs(daysRemaining)} 天`
              : daysRemaining !== null && daysRemaining === 0
              ? '今天到期'
              : daysRemaining !== null && daysRemaining <= 7
              ? `${daysRemaining} 天后到期`
              : format(new Date(goal.targetDate), 'yyyy-MM-dd', { locale: zhCN })
            }
          </span>
        )}
      </div>

      {/* Key Results Count */}
      {goal.keyResults && goal.keyResults.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {goal.keyResults.length} 个关键结果
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {goal.status === 'ACTIVE' && (
          <>
            <button
              onClick={handleComplete}
              className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              完成
            </button>
            <button
              onClick={handleArchive}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              归档
            </button>
          </>
        )}
        {goal.status === 'ARCHIVED' && (
          <button
            onClick={handleActivate}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            重新激活
          </button>
        )}
        {goal.status === 'COMPLETED' && (
          <div className="flex-1 text-center text-sm text-green-600">
            ✓ 已完成
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <GoalDetailDialog
        goalId={goal.id}
        open={showDetail}
        onClose={handleDetailClose}
        onUpdated={handleDetailUpdate}
      />
    </div>
  );
}

export default GoalCard;
