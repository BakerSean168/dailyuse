/**
 * Reminder Template Management View
 *
 * 提醒模板管理视图 - 分组管理、批量操作、模板组织
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  CreateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';
import { reminderApplicationService } from '@dailyuse/reminder/application-client';

type ViewTab = 'templates' | 'groups';

export function ReminderTemplateView() {
  const [activeTab, setActiveTab] = useState<ViewTab>('templates');
  const [templates, setTemplates] = useState<ReminderTemplateClientDTO[]>([]);
  const [groups, setGroups] = useState<ReminderGroupClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 批量选择
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // 创建分组对话框
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [templatesResult, groupsResult] = await Promise.all([
        reminderApplicationService.listReminderTemplates(),
        reminderApplicationService.listReminderGroups(),
      ]);

      setTemplates(templatesResult.templates);
      setGroups(groupsResult.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('[ReminderTemplateView] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 批量操作
  const handleSelectAll = () => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(templates.map((t) => t.id)));
    }
  };

  const handleSelectTemplate = (id: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTemplates(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedTemplates.size === 0) return;

    const confirmed = confirm(`确定要删除选中的 ${selectedTemplates.size} 个模板吗？`);
    if (!confirmed) return;

    try {
      for (const id of selectedTemplates) {
        await reminderApplicationService.deleteReminderTemplate(id);
      }
      setSelectedTemplates(new Set());
      loadData();
    } catch (err) {
      console.error('[ReminderTemplateView] Batch delete failed:', err);
      alert('部分删除失败');
    }
  };

  const handleBatchMoveToGroup = async (groupId: string | null) => {
    if (selectedTemplates.size === 0) return;

    try {
      for (const templateId of selectedTemplates) {
        await reminderApplicationService.moveTemplateToGroup(templateId, groupId);
      }
      setSelectedTemplates(new Set());
      loadData();
    } catch (err) {
      console.error('[ReminderTemplateView] Batch move failed:', err);
      alert('移动失败');
    }
  };

  // 分组操作
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const request: CreateReminderGroupRequest = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
      };
      await reminderApplicationService.createReminderGroup(request);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      loadData();
    } catch (err) {
      console.error('[ReminderTemplateView] Create group failed:', err);
      alert('创建分组失败');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const confirmed = confirm('确定要删除此分组吗？分组内的模板将移至未分组。');
    if (!confirmed) return;

    try {
      await reminderApplicationService.deleteReminderGroup(id);
      loadData();
    } catch (err) {
      console.error('[ReminderTemplateView] Delete group failed:', err);
      alert('删除分组失败');
    }
  };

  const handleToggleGroupEnabled = async (id: string) => {
    try {
      await reminderApplicationService.toggleReminderGroupStatus(id);
      loadData();
    } catch (err) {
      console.error('[ReminderTemplateView] Toggle group failed:', err);
    }
  };

  // 按分组组织模板
  const templatesByGroup = templates.reduce(
    (acc, template) => {
      const groupId = template.groupId || 'ungrouped';
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(template);
      return acc;
    },
    {} as Record<string, ReminderTemplateClientDTO[]>,
  );

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
          onClick={loadData}
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
          <h1 className="text-2xl font-bold">模板管理</h1>
          <p className="text-muted-foreground">
            共 {templates.length} 个模板，{groups.length} 个分组
          </p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + 新建分组
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
          📋 按分组查看
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'groups'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📁 分组管理
        </button>
      </div>

      {/* Batch Actions Bar */}
      {activeTab === 'templates' && selectedTemplates.size > 0 && (
        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">已选择 {selectedTemplates.size} 个模板</span>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'ungrouped') {
                  handleBatchMoveToGroup(null);
                } else if (value) {
                  handleBatchMoveToGroup(value);
                }
                e.target.value = '';
              }}
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                移动到分组...
              </option>
              <option value="ungrouped">未分组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
            >
              删除选中
            </button>
            <button
              onClick={() => setSelectedTemplates(new Set())}
              className="px-3 py-1.5 border rounded-md text-sm hover:bg-secondary"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* Templates by Group View */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Select All */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTemplates.size === templates.length && templates.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span className="text-sm text-muted-foreground">全选</span>
          </div>

          {/* Ungrouped Templates */}
          {templatesByGroup['ungrouped']?.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                📂 未分组
                <span className="text-sm font-normal text-muted-foreground">
                  ({templatesByGroup['ungrouped'].length})
                </span>
              </h3>
              <div className="space-y-2">
                {templatesByGroup['ungrouped'].map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.has(template.id)}
                      onChange={() => handleSelectTemplate(template.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-lg">{template.icon || '🔔'}</span>
                    <span className="flex-1">{template.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        template.effectiveEnabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {template.effectiveEnabled ? '启用' : '禁用'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Templates */}
          {groups.map((group) => {
            const groupTemplates = templatesByGroup[group.id] || [];
            return (
              <div key={group.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className={group.enabled ? '' : 'opacity-50'}>📁 {group.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({groupTemplates.length})
                  </span>
                  {!group.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      分组已禁用
                    </span>
                  )}
                </h3>
                {groupTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">此分组暂无模板</p>
                ) : (
                  <div className="space-y-2">
                    {groupTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-md"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTemplates.has(template.id)}
                          onChange={() => handleSelectTemplate(template.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">{template.icon || '🔔'}</span>
                        <span className="flex-1">{template.title}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            template.effectiveEnabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {template.effectiveEnabled ? '启用' : '禁用'}
                        </span>
                        {template.controlledByGroup && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            分组控制
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {templates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">暂无提醒模板</div>
          )}
        </div>
      )}

      {/* Groups Management View */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-muted-foreground">暂无分组</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="mt-4 px-4 py-2 text-primary hover:underline"
              >
                创建第一个分组
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${!group.enabled ? 'opacity-50' : ''}`}>
                    {group.icon || '📁'}
                  </span>
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{templatesByGroup[group.id]?.length || 0} 个模板</span>
                      {group.controlMode && <span className="text-blue-600">分组控制模式</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleGroupEnabled(group.id)}
                    className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                      group.enabled ? 'hover:bg-yellow-100' : 'hover:bg-green-100'
                    }`}
                  >
                    {group.enabled ? '⏸️ 禁用' : '▶️ 启用'}
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="px-3 py-1.5 text-sm border rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Group Dialog */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">创建分组</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">分组名称 *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="输入分组名称"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="分组描述（可选）"
                  className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
