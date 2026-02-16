/**
 * Reminder List View
 *
 * 提醒列表视图 - 显示所有提醒模板
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { reminderApplicationService } from '@dailyuse/reminder/application-client';
import { ReminderCard } from '../components/ReminderCard';
import { ReminderCreateDialog } from '../components/ReminderCreateDialog';
import { ReminderEditDialog } from '../components/ReminderEditDialog';

type FilterStatus = 'ALL' | 'ACTIVE' | 'PAUSED';

export function ReminderListView() {
  const [templates, setTemplates] = useState<ReminderTemplateClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplateClientDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reminderApplicationService.listReminderTemplates();
      setTemplates(result.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提醒失败');
      console.error('[ReminderListView] Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleTemplateCreated = () => {
    setShowCreateDialog(false);
    loadTemplates();
  };

  const handleToggleEnabled = async (id: string) => {
    try {
      await reminderApplicationService.toggleTemplateEnabled(id);
      loadTemplates();
    } catch (err) {
      console.error('[ReminderListView] Failed to toggle template:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await reminderApplicationService.deleteReminderTemplate(id);
      loadTemplates();
    } catch (err) {
      console.error('[ReminderListView] Failed to delete template:', err);
    }
  };

  // 过滤模板
  const filteredTemplates = templates.filter((template) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = template.title.toLowerCase().includes(query);
      const matchesDesc = template.description?.toLowerCase().includes(query);
      const matchesTags = template.tags?.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDesc && !matchesTags) return false;
    }
    // 状态过滤
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE' && !template.effectiveEnabled) return false;
      if (statusFilter === 'PAUSED' && template.effectiveEnabled) return false;
    }
    // 分组过滤
    if (groupFilter !== 'ALL' && template.groupId !== groupFilter) {
      return false;
    }
    return true;
  });

  // 按下次触发时间排序
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aNext = a.nextTriggerAt;
    const bNext = b.nextTriggerAt;
    if (!aNext && !bNext) return 0;
    if (!aNext) return 1;
    if (!bNext) return -1;
    return aNext - bNext;
  });

  // 统计信息
  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.effectiveEnabled).length,
    paused: templates.filter((t) => !t.effectiveEnabled).length,
  };

  // 获取所有分组
  const groups = Array.from(new Set(templates.map((t) => t.groupId).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error}</div>
        <button
          onClick={loadTemplates}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">提醒管理</h1>
          <p className="text-muted-foreground">
            共 {stats.total} 个提醒，{stats.active} 个活跃
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + 新建提醒
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 搜索提醒..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md bg-background"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="ALL">所有状态</option>
          <option value="ACTIVE">活跃</option>
          <option value="PAUSED">暂停</option>
        </select>
        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="ALL">所有分组</option>
            {groups.map((group) => (
              <option key={group} value={group!}>
                {group}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">总提醒数</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-muted-foreground">活跃</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
          <div className="text-sm text-muted-foreground">暂停中</div>
        </div>
      </div>

      {/* Reminder List */}
      {sortedTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card">
          <div className="text-4xl mb-2">🔔</div>
          <div className="text-muted-foreground">暂无提醒</div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 px-4 py-2 text-primary hover:underline"
          >
            创建第一个提醒
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTemplates.map((template) => (
            <ReminderCard
              key={template.id}
              template={template}
              onToggle={() => handleToggleEnabled(template.id)}
              onDelete={() => handleDeleteTemplate(template.id)}
              onEdit={() => setEditingTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <ReminderCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleTemplateCreated}
        />
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <ReminderEditDialog
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onUpdated={() => {
            loadTemplates();
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
