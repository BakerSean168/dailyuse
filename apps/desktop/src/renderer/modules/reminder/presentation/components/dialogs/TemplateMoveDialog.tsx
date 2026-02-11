/**
 * TemplateMoveDialog - 移动模板到其他分组对话框
 *
 * 功能�?
 * - 显示当前模板信息
 * - 选择目标分组
 * - 支持移出所有分组（移动到根目录�?
 * - 显示目标分组预览信息
 *
 * @module reminder/presentation/components/dialogs
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Checkbox,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@dailyuse/ui-react-shadcn';

import {
  FolderInput,
  Bell,
  Folder,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';

// ============ Types ============

export interface TemplateMoveDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 要移动的模板 */
  template: ReminderTemplateClientDTO | null;
  /** 可用的分组列�?*/
  groups: ReminderGroupClientDTO[];
  /** 获取分组内模板数�?*/
  getGroupTemplateCount?: (groupUuid: string) => number;
  /** 关闭回调 */
  onClose: () => void;
  /** 移动回调 */
  onMove: (templateUuid: string, targetGroupUuid: string | null) => Promise<void>;
}

// ============ Component ============

export function TemplateMoveDialog({
  open,
  template,
  groups,
  getGroupTemplateCount,
  onClose,
  onMove,
}: TemplateMoveDialogProps) {
  const [selectedGroupUuid, setSelectedGroupUuid] = useState<string>('');
  const [moveToRoot, setMoveToRoot] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // 初始化状�?
  useEffect(() => {
    if (open) {
      setSelectedGroupUuid('');
      setMoveToRoot(false);
    }
  }, [open]);

  // 当前分组名称
  const currentGroupName = useMemo(() => {
    if (!template?.groupUuid) return null;
    const group = groups.find(g => g.uuid === template.groupUuid);
    return group?.name || '未知分组';
  }, [template, groups]);

  // 分组选项（排除当前分组）
  const groupOptions = useMemo(() => {
    return groups
      .filter(g => g.uuid !== template?.groupUuid)
      .map(g => ({
        value: g.uuid,
        label: g.name,
        icon: g.icon,
        color: g.color,
        templateCount: getGroupTemplateCount?.(g.uuid) || 0,
        enabled: g.enabled,
      }));
  }, [groups, template, getGroupTemplateCount]);

  // 选中的分组信�?
  const selectedGroup = useMemo(() => {
    if (!selectedGroupUuid) return null;
    return groups.find(g => g.uuid === selectedGroupUuid);
  }, [selectedGroupUuid, groups]);

  // 处理移出分组选项变化
  const handleMoveToRootChange = useCallback((checked: boolean) => {
    setMoveToRoot(checked);
    if (checked) {
      setSelectedGroupUuid('');
    }
  }, []);

  // 是否可以移动
  const canMove = useMemo(() => {
    if (moveToRoot) return true;
    if (!selectedGroupUuid) return false;
    if (selectedGroupUuid === template?.groupUuid) return false;
    return true;
  }, [moveToRoot, selectedGroupUuid, template]);

  // 处理移动
  const handleMove = useCallback(async () => {
    if (!template || !canMove) return;

    setIsMoving(true);
    try {
      const targetGroupUuid = moveToRoot ? null : selectedGroupUuid;
      await onMove(template.uuid, targetGroupUuid);
      onClose();
    } catch (error) {
      console.error('移动模板失败:', error);
    } finally {
      setIsMoving(false);
    }
  }, [template, canMove, moveToRoot, selectedGroupUuid, onMove, onClose]);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {/* 标题 */}
        <DialogHeader className="bg-primary text-primary-foreground -m-6 mb-4 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-primary-foreground">
            <FolderInput className="h-5 w-5" />
            移动模板
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前模板信息 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm font-medium">当前模板</div>
              <div className="flex items-center gap-2 mt-1">
                <Bell className="h-4 w-4" />
                <span>{template.title}</span>
              </div>
              {currentGroupName && (
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Folder className="h-4 w-4" />
                  <span>当前分组: {currentGroupName}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* 目标分组选择 */}
          <div className="space-y-2">
            <Label>目标分组 *</Label>
            <Select
              value={selectedGroupUuid}
              onValueChange={setSelectedGroupUuid}
              disabled={moveToRoot}
            >
              <SelectTrigger>
                <Folder className="h-4 w-4 mr-2" />
                <SelectValue placeholder="选择要移动到的分�? />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    暂无可用分组
                  </div>
                ) : (
                  groupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Folder
                          className="h-4 w-4"
                          style={{ color: option.color ?? undefined }}
                        />
                        <span>{option.label}</span>
                        {option.value === template.groupUuid && (
                          <span className="text-xs text-primary ml-2">(当前分组)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 移出分组选项 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="moveToRoot"
              checked={moveToRoot}
              onCheckedChange={handleMoveToRootChange}
            />
            <Label htmlFor="moveToRoot" className="text-sm cursor-pointer">
              移出所有分组（移动到根目录�?
            </Label>
          </div>

          {/* 移到根目录提�?*/}
          {moveToRoot && (
            <Alert variant="default" className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700">
                模板将从当前分组移出，成为独立模�?
              </AlertDescription>
            </Alert>
          )}

          {/* 目标分组预览 */}
          {selectedGroup && !moveToRoot && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm font-medium mb-2">目标分组信息</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span>名称: {selectedGroup.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>包含模板: {getGroupTemplateCount?.(selectedGroup.uuid) || 0} �?/span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>状�? {selectedGroup.enabled ? '已启�? : '已禁�?}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-4" />

        {/* 操作按钮 */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isMoving}
          >
            取消
          </Button>
          <Button
            onClick={handleMove}
            disabled={!canMove || isMoving}
          >
            {isMoving ? '移动�?..' : '移动'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateMoveDialog;
