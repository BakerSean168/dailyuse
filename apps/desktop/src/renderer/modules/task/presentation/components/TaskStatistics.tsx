/**
 * Task Statistics Component
 *
 * 任务统计组件 - 显示任务完成率和趋势
 * 
 * EPIC-015 重构: 使用 Entity 类型
 * - Props 接受 TaskTemplate Entity 数组
 * - 使用 Entity 的 getter 方法（isActive, isPaused, isArchived）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TaskTemplate } from '@dailyuse/task/domain-client';

interface TaskStatisticsProps {
  templates: TaskTemplate[];
}

export function TaskStatistics({ templates }: TaskStatisticsProps) {
  // 计算统计数据 - 使用 Entity 的 getter 属性
  const stats = useMemo(() => {
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.isActive).length;
    const pausedTemplates = templates.filter(t => t.isPaused).length;
    const archivedTemplates = templates.filter(t => t.isArchived).length;

    // 计算总实例数和完成率
    let totalInstances = 0;
    let completedInstances = 0;
    let pendingInstances = 0;

    templates.forEach(t => {
      totalInstances += t.instanceCount || 0;
      completedInstances += t.completedInstanceCount || 0;
      pendingInstances += t.pendingInstanceCount || 0;
    });

    const overallCompletionRate = totalInstances > 0
      ? Math.round((completedInstances / totalInstances) * 100)
      : 0;

    // 按重要性分组
    const byImportance = {
      vital: templates.filter(t => t.importance === 'vital').length,
      important: templates.filter(t => t.importance === 'important').length,
      moderate: templates.filter(t => t.importance === 'moderate').length,
      minor: templates.filter(t => t.importance === 'minor').length,
      trivial: templates.filter(t => t.importance === 'trivial').length,
    };

    // 按类型分组
    const byType = {
      recurring: templates.filter(t => t.taskType === 'RECURRING').length,
      oneTime: templates.filter(t => t.taskType === 'ONE_TIME').length,
    };

    return {
      totalTemplates,
      activeTemplates,
      pausedTemplates,
      archivedTemplates,
      totalInstances,
      completedInstances,
      pendingInstances,
      overallCompletionRate,
      byImportance,
      byType,
    };
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border rounded-lg">
          <div className="text-3xl font-bold text-primary">{stats.totalTemplates}</div>
          <div className="text-sm text-muted-foreground">任务模板</div>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <div className="text-3xl font-bold text-green-600">{stats.activeTemplates}</div>
          <div className="text-sm text-muted-foreground">活跃中</div>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{stats.completedInstances}</div>
          <div className="text-sm text-muted-foreground">已完成实例</div>
        </div>
        <div className="p-4 bg-card border rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">{stats.pendingInstances}</div>
          <div className="text-sm text-muted-foreground">待处理实例</div>
        </div>
      </div>

      {/* 完成率 */}
      <div className="p-4 bg-card border rounded-lg">
        <h3 className="font-semibold mb-3">总体完成率</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${stats.overallCompletionRate}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.overallCompletionRate}%
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {stats.completedInstances} / {stats.totalInstances} 个任务实例已完成
        </div>
      </div>

      {/* 按状态分布 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-card border rounded-lg">
          <h3 className="font-semibold mb-3">按状态分布</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                活跃
              </span>
              <span className="font-medium">{stats.activeTemplates}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                暂停
              </span>
              <span className="font-medium">{stats.pausedTemplates}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                归档
              </span>
              <span className="font-medium">{stats.archivedTemplates}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card border rounded-lg">
          <h3 className="font-semibold mb-3">按类型分布</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🔄</span>
                重复任务
              </span>
              <span className="font-medium">{stats.byType.recurring}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📌</span>
                一次性任务
              </span>
              <span className="font-medium">{stats.byType.oneTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 按重要性分布 */}
      <div className="p-4 bg-card border rounded-lg">
        <h3 className="font-semibold mb-3">按重要性分布</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 bg-red-100 rounded">
            <div className="text-xl font-bold text-red-600">{stats.byImportance.vital}</div>
            <div className="text-xs text-red-600">极重要</div>
          </div>
          <div className="p-2 bg-orange-100 rounded">
            <div className="text-xl font-bold text-orange-600">{stats.byImportance.important}</div>
            <div className="text-xs text-orange-600">重要</div>
          </div>
          <div className="p-2 bg-blue-100 rounded">
            <div className="text-xl font-bold text-blue-600">{stats.byImportance.moderate}</div>
            <div className="text-xs text-blue-600">中等</div>
          </div>
          <div className="p-2 bg-gray-100 rounded">
            <div className="text-xl font-bold text-gray-600">{stats.byImportance.minor}</div>
            <div className="text-xs text-gray-600">次要</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xl font-bold text-gray-400">{stats.byImportance.trivial}</div>
            <div className="text-xs text-gray-400">琐碎</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskStatistics;
