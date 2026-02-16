/**
 * ReminderTemplateCard - 提醒模板详情卡片
 *
 * 显示模板详细信息的对话框�?
 * - 标题栏带启用/禁用开�?
 * - 状态指�?
 * - 基本信息（标题、描述、触发器、配置）
 * - 统计数据（总实例、已完成、待处理�?
 * - 时间信息（创建、更新时间）
 * - 操作按钮（编辑、查看实例）
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
  Badge,
  Switch,
  Label,
  Separator,
  Card,
  CardContent,
  cn,
} from '@dailyuse/ui-react-shadcn';

import {
  Bell,
  FileText,
  Clock,
  Settings,
  Calendar,
  CalendarClock,
  Pencil,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Folder,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

// ============ Types ============

export interface TemplateStats {
  total: number;
  completed: number;
  pending: number;
}

export interface ReminderTemplateCardProps {
  /** 模板数据 */
  template: ReminderTemplateClientDTO | null;
  /** 是否打开 */
  open: boolean;
  /** 统计数据 */
  stats?: TemplateStats;
  /** 关闭回调 */
  onClose: () => void;
  /** 编辑模板 */
  onEdit?: (template: ReminderTemplateClientDTO) => void;
  /** 查看实例 */
  onViewInstances?: (template: ReminderTemplateClientDTO) => void;
  /** 切换启用状�?*/
  onToggleEnabled?: (template: ReminderTemplateClientDTO, enabled: boolean) => Promise<void>;
}

// ============ Utils ============

function formatDate(dateValue?: string | number | Date): string {
  if (!dateValue) return '未知';
  const date = typeof dateValue === 'number' 
    ? new Date(dateValue)
    : typeof dateValue === 'string' 
      ? new Date(dateValue) 
      : dateValue;
  return format(date, 'yyyy年MM月dd'HH:mm', { locale: zhCN });
}

function getStatusInfo(template: ReminderTemplateClientDTO) {
  if (!template.effectiveEnabled) {
    return {
      color: 'secondary' as const,
      icon: PauseCircle,
      text: '已暂',
    };
  }
  // 可以根据 nextTriggerTime 等字段判断更多状�?
  return {
    color: 'default' as const,
    icon: CheckCircle,
    text: '活跃',
  };
}

function getTriggerText(template: ReminderTemplateClientDTO): string {
  // �?trigger 配置获取触发器描�?
  if (template.triggerText) {
    return template.triggerText;
  }
  if (!template.trigger) {
    return '未设';
  }

  const { type } = template.trigger;
  switch (type) {
    case 'FIXED_TIME':
      return `固定时间: ${template.trigger.fixedTime?.time || '未设'}`;
    case 'INTERVAL':
      return `间隔: ${template.trigger.interval?.minutes || 0} 分钟`;
    default:
      return type || '未知';
  }
}

// ============ Component ============

export function ReminderTemplateCard({
  template,
  open,
  stats = { total: 0, completed: 0, pending: 0 },
  onClose,
  onEdit,
  onViewInstances,
  onToggleEnabled,
}: ReminderTemplateCardProps) {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(template?.effectiveEnabled ?? true);

  // 状态信�?
  const statusInfo = useMemo(() => {
    if (!template) return null;
    return getStatusInfo(template);
  }, [template]);

  // 处理切换启用状�?
  const handleToggleStatus = useCallback(async (checked: boolean) => {
    if (!template || !onToggleEnabled) return;

    setIsTogglingStatus(true);
    try {
      await onToggleEnabled(template, checked);
      setLocalEnabled(checked);
    } finally {
      setIsTogglingStatus(false);
    }
  }, [template, onToggleEnabled]);

  // 处理编辑
  const handleEdit = useCallback(() => {
    if (template && onEdit) {
      onEdit(template);
    }
  }, [template, onEdit]);

  // 处理查看实例
  const handleViewInstances = useCallback(() => {
    if (template && onViewInstances) {
      onViewInstances(template);
    }
  }, [template, onViewInstances]);

  if (!template) return null;

  const StatusIcon = statusInfo?.icon || CheckCircle;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* 标题�?*/}
        <DialogHeader className="bg-primary text-primary-foreground -m-6 mb-4 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-primary-foreground">
              <Bell className="h-5 w-5" />
              <span>{template.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={localEnabled}
                  onCheckedChange={handleToggleStatus}
                  disabled={isTogglingStatus}
                />
                <Label className="text-sm text-primary-foreground">
                  {localEnabled ? '已启用' : '已禁用'}
                </Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:text-primary-foreground/80"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 状态指�?*/}
        <div className="flex items-center gap-2 py-2 bg-muted -mx-6 px-6">
          <Badge variant={statusInfo?.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo?.text}
          </Badge>
          {template.groupUuid && (
            <Badge variant="outline">
              <Folder className="h-3 w-3 mr-1" />
              分组�?
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            基本信息
          </h3>

          <div className="space-y-3">
            {/* 标题 */}
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">标题</p>
                <p className="text-sm">{template.title}</p>
              </div>
            </div>

            {/* 描述 */}
            {template.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">描述</p>
                  <p className="text-sm text-wrap">{template.description}</p>
                </div>
              </div>
            )}

            {/* 触发�?*/}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">触发</p>
                <Badge variant="outline" className="mt-1">
                  {getTriggerText(template)}
                </Badge>
              </div>
            </div>

            {/* 触发配置 */}
            {template.trigger && (
              <div className="flex items-start gap-3">
                <Settings className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">触发配置</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      类型: {template.trigger.type || 'unknown'}
                    </Badge>
                    {template.trigger.interval && (
                      <Badge variant="secondary" className="text-xs">
                        间隔: {template.trigger.interval.minutes} 分钟
                      </Badge>
                    )}
                    {template.trigger.fixedTime && (
                      <Badge variant="secondary" className="text-xs">
                        时间: {template.trigger.fixedTime.time}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* 统计信息 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            统计数据
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-primary/10">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总实</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">已完</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">待处</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-4" />

        {/* 时间信息 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            时间信息
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">创建时间</p>
                <p className="text-sm">{formatDate(template.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarClock className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">更新时间</p>
                <p className="text-sm">{formatDate(template.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              编辑模板
            </Button>
            <Button variant="outline" onClick={handleViewInstances}>
              <Eye className="h-4 w-4 mr-1" />
              查看实例
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReminderTemplateCard;
