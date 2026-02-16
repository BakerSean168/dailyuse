/**
 * Task List View
 *
 * 任务列表视图 - 显示所有任务模板和实例
 * 
 * EPIC-015 重构: 使用 Hook 代替直接调用 Infrastructure 层
 * - 使用 useTaskTemplate Hook 获取模板数据
 * - 使用 useTaskInstance Hook 获取实例数据
 * - 数据来自 Store，由 Hook 统一管理
 */

import { useState, useEffect } from 'react';
import type { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-client';
import { TaskCard } from '../components/TaskCard';
import { TaskCreateDialog } from '../components/TaskCreateDialog';
import { TaskStatistics } from '../components/TaskStatistics';
import { TaskDependencyGraph } from '../components/TaskDependencyGraph';
import { TaskListSkeleton } from '../../../../shared/components/Skeleton';
import { VirtualList } from '../../../../shared/components/VirtualList';
import { useTaskTemplate } from '../hooks/useTaskTemplate';
import { useTaskInstance } from '../hooks/useTaskInstance';

export function TaskListView() {
  // ===== 使用 Hooks 获取数据 =====
  const {
    templates,
    loading: templateLoading,
    error: templateError,
    loadTemplates,
    refresh: refreshTemplates,
  } = useTaskTemplate();
  
  const {
    loading: instanceLoading,
    error: instanceError,
    getTodayInstances,
    refresh: refreshInstances,
  } = useTaskInstance();
  
  // ===== 本地 UI 状态 =====
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'today' | 'stats' | 'dependencies'>('templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  // 视图模式: grid(网格) / list(列表，支持虚拟滚动)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ===== 派生状态 =====
  const loading = templateLoading || instanceLoading;
  const error = templateError || instanceError;
  const todayInstances = getTodayInstances();

  const handleTaskCreated = () => {
    setShowCreateDialog(false);
    refreshTemplates();
  };

  const handleRefresh = () => {
    refreshTemplates();
    refreshInstances();
  };

  // 过滤任务
  const filteredTemplates = templates.filter((template) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = template.title.toLowerCase().includes(query);
      const matchesDesc = template.description?.toLowerCase().includes(query);
      const matchesTags = template.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDesc && !matchesTags) return false;
    }
    // 状态过滤 - 使用 Entity 的 getter 属性
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE' && !template.isActive) return false;
      if (statusFilter === 'PAUSED' && !template.isPaused) return false;
      if (statusFilter === 'ARCHIVED' && !template.isArchived) return false;
    }
    // 类型过滤
    if (typeFilter !== 'ALL' && template.taskType !== typeFilter) {
      return false;
    }
    return true;
  });

  // 使用骨架屏替代简单的加载提示
  if (loading && templates.length === 0) {
    return <TaskListSkeleton />;
  }

  if (error && templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error}</div>
        <button
          onClick={handleRefresh}
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
          <h1 className="text-2xl font-bold">任务管理</h1>
          <p className="text-muted-foreground">
            共 {templates.length} 个任务模板
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + 新建任务
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          任务模板
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          今日任务
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 统计
        </button>
        <button
          onClick={() => setActiveTab('dependencies')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'dependencies'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🔗 依赖图
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <TaskStatistics templates={templates} />
      )}

      {/* Dependencies Tab */}
      {activeTab === 'dependencies' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">选择任务查看依赖关系:</label>
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => setSelectedTemplateId(e.target.value || null)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">-- 选择任务 --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          
          {selectedTemplateId ? (
            <TaskDependencyGraph 
              tasks={templates.filter(t => t.id === selectedTemplateId)} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card">
              <div className="text-4xl mb-2">🔗</div>
              <div className="text-muted-foreground">请选择一个任务以查看其依赖关系</div>
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      {(activeTab === 'templates' || activeTab === 'today') && (
        <>
          {/* Search and Filter Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">🟢 活跃</option>
              <option value="PAUSED">⏸️ 已暂停</option>
              <option value="ARCHIVED">📦 已归档</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="ALL">全部类型</option>
              <option value="ONE_TIME">📌 一次性</option>
              <option value="RECURRING">🔄 重复</option>
            </select>
            {/* 视图模式切换 */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}`}
                title="网格视图"
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}`}
                title="列表视图（大数据量时更流畅）"
              >
                ☰
              </button>
            </div>
          </div>

          {/* Task Cards */}
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 border rounded-lg bg-card">
              <div className="text-4xl">✅</div>
              <div className="text-muted-foreground">
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? '没有找到匹配的任务'
                  : '还没有任务，创建第一个吧！'}
              </div>
              {!searchQuery && statusFilter === 'ALL' && typeFilter === 'ALL' && (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  创建任务
                </button>
              )}
              {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  清除筛选
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            /* 列表视图 - 使用虚拟滚动优化大数据量 */
            <VirtualList
              items={filteredTemplates}
              renderItem={(template) => (
                <TaskCard
                  template={template}
                  onUpdate={handleRefresh}
                />
              )}
              getItemKey={(template) => template.id}
              estimateSize={120}
              threshold={30}
              height="calc(100vh - 320px)"
              className="border rounded-lg"
              renderEmpty={() => null}
            />
          ) : (
            /* 网格视图 */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TaskCard
                  key={template.id}
                  template={template}
                  onUpdate={handleRefresh}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <TaskCreateDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

export default TaskListView;
