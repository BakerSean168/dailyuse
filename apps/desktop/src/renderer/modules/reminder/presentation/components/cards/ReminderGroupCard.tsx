/**
 * ReminderGroupCard - 提醒分组展示卡片
 *
 * 显示分组详情弹窗�?
 * - 分组标题栏和编辑按钮
 * - 控制模式（组控制/个体控制）和启用状态开�?
 * - 分组内模板九宫格展示
 * - 支持点击模板和右键菜�?
 *
 * @module reminder/presentation/components/cards
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Switch,
  Label,
  cn,
} from '@dailyuse/ui-react-shadcn';

import {
  Folder,
  Pencil,
  Plus,
  X,
  Bell,
  Settings,
  Power,
  MoreHorizontal,
} from 'lucide-react';
import type { ReminderGroupClientDTO, ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

// ============ Types ============

export interface ReminderGroupCardProps {
  /** 分组数据 */
  group: ReminderGroupClientDTO | null;
  /** 分组内的模板列表 */
  templates: ReminderTemplateClientDTO[];
  /** 是否打开 */
  open: boolean;
  /** 最大显示模板数 */
  maxDisplayCount?: number;
  /** 关闭回调 */
  onClose: () => void;
  /** 编辑分组 */
  onEditGroup?: (group: ReminderGroupClientDTO) => void;
  /** 创建模板 */
  onCreateTemplate?: (groupUuid: string) => void;
  /** 点击模板 */
  onTemplateClick?: (template: ReminderTemplateClientDTO) => void;
  /** 模板右键菜单 */
  onTemplateContextMenu?: (template: ReminderTemplateClientDTO, event: React.MouseEvent) => void;
  /** 切换控制模式 */
  onToggleControlMode?: (group: ReminderGroupClientDTO, isGroupControl: boolean) => Promise<void>;
  /** 切换启用状�?*/
  onToggleEnabled?: (group: ReminderGroupClientDTO, enabled: boolean) => Promise<void>;
  /** 查看所有模�?*/
  onShowAll?: (group: ReminderGroupClientDTO) => void;
}

// ============ Component ============

export function ReminderGroupCard({
  group,
  templates,
  open,
  maxDisplayCount = 9,
  onClose,
  onEditGroup,
  onCreateTemplate,
  onTemplateClick,
  onTemplateContextMenu,
  onToggleControlMode,
  onToggleEnabled,
  onShowAll,
}: ReminderGroupCardProps) {
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // 控制模式 - 假设组控制模式由 controlMode 字段控制
  const [localGroupControl, setLocalGroupControl] = useState(
    group?.controlMode === 'GROUP'
  );
  const [localEnabled, setLocalEnabled] = useState(group?.enabled ?? true);

  // 显示的模板（最多显�?maxDisplayCount 个）
  const displayTemplates = useMemo(() => {
    return templates.slice(0, maxDisplayCount);
  }, [templates, maxDisplayCount]);

  // 是否有更多模�?
  const hasMore = templates.length > maxDisplayCount;
  const moreCount = templates.length - maxDisplayCount;

  // 处理切换控制模式
  const handleToggleControlMode = useCallback(async (checked: boolean) => {
    if (!group || !onToggleControlMode) return;

    setIsTogglingMode(true);
    try {
      await onToggleControlMode(group, checked);
      setLocalGroupControl(checked);
    } finally {
      setIsTogglingMode(false);
    }
  }, [group, onToggleControlMode]);

  // 处理切换启用状�?
  const handleToggleStatus = useCallback(async (checked: boolean) => {
    if (!group || !onToggleEnabled) return;

    setIsTogglingStatus(true);
    try {
      await onToggleEnabled(group, checked);
      setLocalEnabled(checked);
    } finally {
      setIsTogglingStatus(false);
    }
  }, [group, onToggleEnabled]);

  // 处理编辑
  const handleEditGroup = useCallback(() => {
    if (group && onEditGroup) {
      onEditGroup(group);
    }
  }, [group, onEditGroup]);

  // 处理创建模板
  const handleCreateTemplate = useCallback(() => {
    if (group && onCreateTemplate) {
      onCreateTemplate(group.uuid);
    }
  }, [group, onCreateTemplate]);

  // 处理模板点击
  const handleTemplateClick = useCallback((template: ReminderTemplateClientDTO) => {
    onTemplateClick?.(template);
  }, [onTemplateClick]);

  // 处理模板右键菜单
  const handleTemplateContextMenu = useCallback((
    template: ReminderTemplateClientDTO,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    onTemplateContextMenu?.(template, event);
  }, [onTemplateContextMenu]);

  // 处理查看所�?
  const handleShowAll = useCallback(() => {
    if (group && onShowAll) {
      onShowAll(group);
    }
  }, [group, onShowAll]);

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {/* 标题�?*/}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Folder
                className="h-5 w-5"
                style={{ color: group.color || '#4CAF50' }}
              />
              <span>{group.name}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditGroup}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 控制选项�?*/}
        <div className="space-y-4 border-y py-4">
          {/* 控制模式 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>控制模式</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={localGroupControl}
                onCheckedChange={handleToggleControlMode}
                disabled={isTogglingMode}
              />
              <Label className="text-sm">
                {localGroupControl ? '组控' : '个体控制'}
              </Label>
            </div>
          </div>

          {/* 当前状�?*/}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Power className="h-4 w-4" />
              <span>当前状</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={localEnabled}
                onCheckedChange={handleToggleStatus}
                disabled={isTogglingStatus}
              />
              <Label className="text-sm">
                {localEnabled ? '已启用' : '已禁用'}
              </Label>
            </div>
          </div>
        </div>

        {/* 九宫格容�?*/}
        <div className="py-4">
          {templates.length === 0 ? (
            /* 空状�?*/
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">该分组暂无提</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateTemplate}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加提醒
              </Button>
            </div>
          ) : (
            /* 模板图标九宫�?*/
            <div className="grid grid-cols-3 gap-4">
              {displayTemplates.map((template) => (
                <div
                  key={template.uuid}
                  className={cn(
                    "flex flex-col items-center cursor-pointer group",
                    !template.effectiveEnabled && "opacity-50"
                  )}
                  onClick={() => handleTemplateClick(template)}
                  onContextMenu={(e) => handleTemplateContextMenu(template, e)}
                >
                  {/* 图标圆圈 */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105",
                    )}
                    style={{
                      backgroundColor: template.effectiveEnabled
                        ? (template.color || '#E3F2FD')
                        : '#F5F5F5'
                    }}
                  >
                    <Bell
                      className={cn(
                        "h-7 w-7",
                        template.effectiveEnabled ? "text-primary" : "text-gray-400"
                      )}
                    />
                  </div>
                  {/* 名称 */}
                  <span className="text-xs text-center mt-2 line-clamp-1 max-w-[80px]">
                    {template.title}
                  </span>
                </div>
              ))}

              {/* 更多按钮 */}
              {hasMore && (
                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={handleShowAll}
                >
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-105">
                    <MoreHorizontal className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-center mt-2 text-muted-foreground">
                    更多 ({moreCount})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReminderGroupCard;
