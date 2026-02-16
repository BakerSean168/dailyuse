/**
 * ReminderDesktopView - 提醒桌面主视�?
 *
 * 手机桌面风格的提醒管理界面：
 * - 左侧主内容区：网格布局显示模板和分�?
 * - 右侧侧边栏：即将到来的提醒列�?
 * - 支持右键菜单、删除确�?
 * - 集成所�?Dialogs �?Cards 组件
 *
 * @module reminder/presentation/views
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
} from '@dailyuse/ui-react-shadcn';

import {
  Bell,
  Folder,
  Plus,
  FolderPlus,
  RefreshCw,
  Pencil,
  Trash2,
  Power,
  FolderInput,
} from 'lucide-react';

// 组件导入
import {
  ReminderGroupCard,
  ReminderTemplateCard,
  ReminderGroupDialog,
  ReminderTemplateDialog,
  TemplateMoveDialog,
  ReminderInstanceSidebar,
} from '../components';
import type { TemplateStats, UpcomingData } from '../components';

// Hooks
import { useReminder } from '../hooks';

// 类型 - 直接使用 contracts 类型
import type { 
  ReminderTemplateClientDTO, 
  ReminderGroupClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';

// ============ Types ============

interface ContextMenuItem {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenu {
  show: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface DeleteDialog {
  show: boolean;
  type: 'template' | 'group';
  uuid: string;
  name: string;
}

// ============ Component ============

export function ReminderDesktopView() {
  // State from hook
  const {
    templates,
    groups,
    loading,
    error,
    loadTemplates,
    loadGroups,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateEnabled,
    createGroup,
    updateGroup,
    deleteGroup,
    refresh,
  } = useReminder();

  // 本地状�?
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog 状�?
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    template: ReminderTemplateClientDTO | null;
  }>({ open: false, template: null });

  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    group: ReminderGroupClientDTO | null;
  }>({ open: false, group: null });

  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    template: ReminderTemplateClientDTO | null;
  }>({ open: false, template: null });

  // Card 状�?
  const [templateCard, setTemplateCard] = useState<{
    open: boolean;
    template: ReminderTemplateClientDTO | null;
  }>({ open: false, template: null });

  const [groupCard, setGroupCard] = useState<{
    open: boolean;
    group: ReminderGroupClientDTO | null;
  }>({ open: false, group: null });

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    show: false,
    x: 0,
    y: 0,
    items: [],
  });

  // 删除确认
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>({
    show: false,
    type: 'template',
    uuid: '',
    name: '',
  });

  // 模拟账户 UUID（实际应�?context 获取�?
  const accountUuid = 'demo-account';

  // 初始化数�?
  useEffect(() => {
    refresh(accountUuid);
  }, [accountUuid, refresh]);

  // 未分组的模板
  const ungroupedTemplates = useMemo(() => {
    return templates.filter(t => !t.groupUuid);
  }, [templates]);

  // 获取分组内模板数�?
  const getGroupTemplateCount = useCallback((groupUuid: string) => {
    return templates.filter(t => t.groupUuid === groupUuid).length;
  }, [templates]);

  // 获取分组内的模板
  const getGroupTemplates = useCallback((groupUuid: string) => {
    return templates.filter(t => t.groupUuid === groupUuid);
  }, [templates]);

  // 模拟的即将到来的提醒数据
  const upcomingData: UpcomingData = useMemo(() => ({
    total: templates.filter(t => t.effectiveEnabled).length,
    reminders: templates
      .filter(t => t.effectiveEnabled && t.nextTriggerAt)
      .map(t => ({
        uuid: t.uuid,
        title: t.title,
        message: t.description ?? undefined,
        nextTriggerAt: new Date(t.nextTriggerAt!).toISOString(),
        priority: 'normal' as const,
        templateUuid: t.uuid,
        metadata: { tags: t.tags ?? [] },
      }))
      .slice(0, 20),
  }), [templates]);

  // ============ 刷新 ============

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh(accountUuid);
    } finally {
      setIsRefreshing(false);
    }
  }, [accountUuid, refresh]);

  // ============ 模板操作 ============

  const handleTemplateClick = useCallback((template: ReminderTemplateClientDTO) => {
    setTemplateCard({ open: true, template });
  }, []);

  const handleEditTemplate = useCallback((template: ReminderTemplateClientDTO) => {
    setTemplateCard({ open: false, template: null });
    setTemplateDialog({ open: true, template });
  }, []);

  const handleCreateTemplate = useCallback((groupUuid?: string) => {
    // 创建新模板，预设分组
    const newTemplate = groupUuid ? { groupUuid } as ReminderTemplateClientDTO : null;
    setTemplateDialog({ open: true, template: newTemplate });
  }, []);

  const handleSaveTemplate = useCallback(async (
    data: CreateReminderTemplateRequest | UpdateReminderTemplateRequest, 
    isEdit: boolean
  ) => {
    if (isEdit && templateDialog.template?.uuid) {
      // 更新模板 - 使用 contracts 类型
      await updateTemplate({
        uuid: templateDialog.template.uuid,
        request: data as UpdateReminderTemplateRequest,
      });
    } else {
      // 创建模板 - 直接传�?CreateReminderTemplateRequest
      await createTemplate(data as CreateReminderTemplateRequest);
    }
    setTemplateDialog({ open: false, template: null });
  }, [templateDialog.template, updateTemplate, createTemplate]);

  const handleDeleteTemplate = useCallback((template: ReminderTemplateClientDTO) => {
    setDeleteDialog({
      show: true,
      type: 'template',
      uuid: template.uuid,
      name: template.title,
    });
  }, []);

  const handleToggleTemplateEnabled = useCallback(async (template: ReminderTemplateClientDTO) => {
    await toggleTemplateEnabled(template.uuid);
  }, [toggleTemplateEnabled]);

  const handleMoveTemplate = useCallback((template: ReminderTemplateClientDTO) => {
    setMoveDialog({ open: true, template });
  }, []);

  const handleMoveTemplateSave = useCallback(async (templateUuid: string, targetGroupUuid: string | null) => {
    await updateTemplate({
      uuid: templateUuid,
      request: {
        groupUuid: targetGroupUuid || undefined,
      },
    });
    setMoveDialog({ open: false, template: null });
  }, [updateTemplate]);

  // ============ 分组操作 ============

  const handleGroupClick = useCallback((group: ReminderGroupClientDTO) => {
    setGroupCard({ open: true, group });
  }, []);

  const handleEditGroup = useCallback((group: ReminderGroupClientDTO) => {
    setGroupCard({ open: false, group: null });
    setGroupDialog({ open: true, group });
  }, []);

  const handleCreateGroup = useCallback(() => {
    setGroupDialog({ open: true, group: null });
  }, []);

  const handleSaveGroup = useCallback(async (
    data: CreateReminderGroupRequest | UpdateReminderGroupRequest, 
    isEdit: boolean
  ) => {
    if (isEdit && groupDialog.group?.uuid) {
      // 更新分组 - 使用 contracts 类型
      await updateGroup({
        uuid: groupDialog.group.uuid,
        request: data as UpdateReminderGroupRequest,
      });
    } else {
      // 创建分组 - 直接传�?CreateReminderGroupRequest
      await createGroup(data as CreateReminderGroupRequest);
    }
    setGroupDialog({ open: false, group: null });
  }, [groupDialog.group, updateGroup, createGroup]);

  const handleDeleteGroup = useCallback((group: ReminderGroupClientDTO) => {
    setDeleteDialog({
      show: true,
      type: 'group',
      uuid: group.uuid,
      name: group.name,
    });
  }, []);

  // ============ 右键菜单 ============

  const handleTemplateContextMenu = useCallback((template: ReminderTemplateClientDTO, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          icon: <Pencil className="h-4 w-4" />,
          title: '编辑模板',
          action: () => handleEditTemplate(template),
        },
        {
          icon: <Power className="h-4 w-4" />,
          title: template.effectiveEnabled ? '禁用' : '启用',
          action: () => handleToggleTemplateEnabled(template),
        },
        {
          icon: <FolderInput className="h-4 w-4" />,
          title: '移动到分',
          action: () => handleMoveTemplate(template),
        },
        { divider: true } as ContextMenuItem,
        {
          icon: <Trash2 className="h-4 w-4" />,
          title: '删除',
          action: () => handleDeleteTemplate(template),
          danger: true,
        },
      ],
    });
  }, [handleEditTemplate, handleToggleTemplateEnabled, handleMoveTemplate, handleDeleteTemplate]);

  const handleGroupContextMenu = useCallback((group: ReminderGroupClientDTO, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          icon: <Pencil className="h-4 w-4" />,
          title: '编辑分组',
          action: () => handleEditGroup(group),
        },
        {
          icon: <Plus className="h-4 w-4" />,
          title: '添加模板',
          action: () => handleCreateTemplate(group.uuid),
        },
        { divider: true } as ContextMenuItem,
        {
          icon: <Trash2 className="h-4 w-4" />,
          title: '删除分组',
          action: () => handleDeleteGroup(group),
          danger: true,
        },
      ],
    });
  }, [handleEditGroup, handleCreateTemplate, handleDeleteGroup]);

  const handleDesktopContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          icon: <Plus className="h-4 w-4" />,
          title: '创建提醒模板',
          action: () => handleCreateTemplate(),
        },
        {
          icon: <FolderPlus className="h-4 w-4" />,
          title: '创建分组',
          action: handleCreateGroup,
        },
        { divider: true } as ContextMenuItem,
        {
          icon: <RefreshCw className="h-4 w-4" />,
          title: '刷新',
          action: handleRefresh,
        },
      ],
    });
  }, [handleCreateTemplate, handleCreateGroup, handleRefresh]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, show: false }));
  }, []);

  // ============ 删除确认 ============

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.type === 'template') {
      await deleteTemplate(deleteDialog.uuid);
    } else {
      await deleteGroup(deleteDialog.uuid);
    }
    setDeleteDialog({ show: false, type: 'template', uuid: '', name: '' });
  }, [deleteDialog, deleteTemplate, deleteGroup]);

  // 模板统计（模拟）
  const templateStats: TemplateStats = {
    total: 0,
    completed: 0,
    pending: 0,
  };

  return (
    <div className="flex h-full bg-background">
      {/* 左侧主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 手机桌面风格的网格布局 */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            className="min-h-full"
            onContextMenu={handleDesktopContextMenu}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {/* 未分组的模板图标 */}
              {ungroupedTemplates.map((template) => (
                <div
                  key={template.uuid}
                  className={cn(
                    "flex flex-col items-center cursor-pointer group",
                    !template.effectiveEnabled && "opacity-50"
                  )}
                  onClick={() => handleTemplateClick(template)}
                  onContextMenu={(e) => handleTemplateContextMenu(template, e)}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                    style={{
                      backgroundColor: template.effectiveEnabled
                        ? (template.color || '#E3F2FD')
                        : '#F5F5F5'
                    }}
                  >
                    <Bell
                      className={cn(
                        "h-8 w-8",
                        template.effectiveEnabled ? "text-primary" : "text-gray-400"
                      )}
                    />
                  </div>
                  <span className="text-xs text-center mt-2 line-clamp-2 max-w-[80px]">
                    {template.title}
                  </span>
                </div>
              ))}

              {/* 分组图标（文件夹风格�?*/}
              {groups.map((group) => (
                <div
                  key={group.uuid}
                  className={cn(
                    "flex flex-col items-center cursor-pointer group",
                    !group.enabled && "opacity-50"
                  )}
                  onClick={() => handleGroupClick(group)}
                  onContextMenu={(e) => handleGroupContextMenu(group, e)}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm relative"
                    style={{
                      backgroundColor: group.enabled
                        ? (group.color || '#E8F5E9')
                        : '#F5F5F5'
                    }}
                  >
                    <Folder
                      className={cn(
                        "h-8 w-8",
                        group.enabled ? "text-green-600" : "text-gray-400"
                      )}
                    />
                    {/* 模板数量角标 */}
                    {getGroupTemplateCount(group.uuid) > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {getGroupTemplateCount(group.uuid)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-center mt-2 line-clamp-2 max-w-[80px]">
                    {group.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部工具�?*/}
        <div className="p-4 border-t flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-12 w-12"
            onClick={() => handleCreateTemplate()}
          >
            <Plus className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-12 w-12"
            onClick={handleCreateGroup}
          >
            <FolderPlus className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-12 w-12"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={cn("h-6 w-6", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* 右侧提醒实例侧边�?*/}
      <ReminderInstanceSidebar
        upcomingData={upcomingData}
        isLoading={loading}
        error={error}
        onRefresh={handleRefresh}
        onReminderClick={(reminder) => {
          const template = templates.find(t => t.uuid === reminder.templateUuid);
          if (template) {
            setTemplateCard({ open: true, template });
          }
        }}
      />

      {/* 右键菜单 */}
      {contextMenu.show && (
        <div
          className="fixed inset-0 z-50"
          onClick={closeContextMenu}
          onContextMenu={(e) => {
            e.preventDefault();
            closeContextMenu();
          }}
        >
          <div
            className="absolute bg-popover border rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.items.map((item, index) => (
              item.divider ? (
                <div key={index} className="h-px bg-border my-1" />
              ) : (
                <button
                  key={index}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                    item.danger && "text-destructive hover:bg-destructive/10",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!item.disabled) {
                      item.action();
                      closeContextMenu();
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon}
                  {item.title}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* 模板详情卡片 */}
      <ReminderTemplateCard
        template={templateCard.template}
        open={templateCard.open}
        stats={templateStats}
        onClose={() => setTemplateCard({ open: false, template: null })}
        onEdit={handleEditTemplate}
        onToggleEnabled={async (template, enabled) => {
          await handleToggleTemplateEnabled(template);
        }}
      />

      {/* 分组详情卡片 */}
      <ReminderGroupCard
        group={groupCard.group}
        templates={groupCard.group ? getGroupTemplates(groupCard.group.uuid) : []}
        open={groupCard.open}
        onClose={() => setGroupCard({ open: false, group: null })}
        onEditGroup={handleEditGroup}
        onCreateTemplate={(groupUuid) => handleCreateTemplate(groupUuid)}
        onTemplateClick={handleTemplateClick}
        onTemplateContextMenu={handleTemplateContextMenu}
      />

      {/* 模板编辑对话�?*/}
      <ReminderTemplateDialog
        open={templateDialog.open}
        template={templateDialog.template}
        groups={groups}
        onClose={() => setTemplateDialog({ open: false, template: null })}
        onSave={handleSaveTemplate}
      />

      {/* 分组编辑对话�?*/}
      <ReminderGroupDialog
        open={groupDialog.open}
        group={groupDialog.group}
        onClose={() => setGroupDialog({ open: false, group: null })}
        onSave={handleSaveGroup}
      />

      {/* 移动模板对话�?*/}
      <TemplateMoveDialog
        open={moveDialog.open}
        template={moveDialog.template}
        groups={groups}
        getGroupTemplateCount={getGroupTemplateCount}
        onClose={() => setMoveDialog({ open: false, template: null })}
        onMove={handleMoveTemplateSave}
      />

      {/* 删除确认对话�?*/}
      <AlertDialog open={deleteDialog.show} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, show: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{deleteDialog.type === 'template' ? '模板' : '分组'} "{deleteDialog.name}" 吗？
              此操作无法撤销�?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ReminderDesktopView;
