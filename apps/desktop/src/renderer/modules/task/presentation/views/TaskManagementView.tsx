/**
 * TaskManagementView Component
 *
 * 任务模板管理视图
 * 功能�?
 * 1. 任务模板列表展示（按状态筛选）
 * 2. 批量操作（批量删除、批量归档）
 * 3. 依赖关系图查�?
 * 4. 模板创建/编辑入口
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { TaskTemplateClientDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';

/** Local TaskType constant — not exported from contracts */
const TaskType = {
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
} as const;
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Input } from '@dailyuse/ui-react-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-react-shadcn';
import { ScrollArea } from '@dailyuse/ui-react-shadcn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-react-shadcn';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@dailyuse/ui-react-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-react-shadcn';
import {
  Plus,
  Search,
  PlayCircle,
  PauseCircle,
  Archive,
  MoreVertical,
  Trash2,
  Edit,
  GitBranch,
  LayoutTemplate,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { useTaskTemplate } from '../hooks/useTaskTemplate';
import { useTaskStore } from '../stores/taskStore';

// ===================== 接口定义 =====================

interface TaskManagementViewProps {
  onCreateTemplate?: () => void;
  onEditTemplate?: (id: string) => void;
  onViewDependencies?: (id: string) => void;
}

// ===================== 工具函数 =====================

const statusConfig: Record<TaskTemplateStatus, { label: string; icon: typeof PlayCircle; color: string }> = {
  [TaskTemplateStatus.ACTIVE]: { label: '进行', icon: PlayCircle, color: 'text-green-600' },
  [TaskTemplateStatus.PAUSED]: { label: '已暂', icon: PauseCircle, color: 'text-yellow-600' },
  [TaskTemplateStatus.ARCHIVED]: { label: '已归', icon: Archive, color: 'text-gray-600' },
  [TaskTemplateStatus.DELETED]: { label: '已删', icon: Trash2, color: 'text-red-600' },
};

const taskTypeLabels: Record<string, string> = {
  [TaskType.ONE_TIME]: '单次任务',
  [TaskType.RECURRING]: '重复任务',
};

// ===================== 组件 =====================

export function TaskManagementView({
  onCreateTemplate,
  onEditTemplate,
  onViewDependencies,
}: TaskManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStatus, setCurrentStatus] = useState<TaskTemplateStatus>(TaskTemplateStatus.ACTIVE);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 使用 hook 获取模板数据
  const {
    templates,
    loading: isLoading,
    error,
    loadTemplates,
    deleteTemplate,
    updateTemplate,
    activateTemplate,
    pauseTemplate,
    archiveTemplate,
  } = useTaskTemplate();

  // 初始加载 - 使用 ref 防止重复加载
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadTemplates();
  }, []);

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    let result = templates.filter((t) => t.status === currentStatus);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [templates, currentStatus, searchQuery]);

  // 按状态统�?
  const statusCounts = useMemo(() => {
    return {
      [TaskTemplateStatus.ACTIVE]: templates.filter((t) => t.status === TaskTemplateStatus.ACTIVE).length,
      [TaskTemplateStatus.PAUSED]: templates.filter((t) => t.status === TaskTemplateStatus.PAUSED).length,
      [TaskTemplateStatus.ARCHIVED]: templates.filter((t) => t.status === TaskTemplateStatus.ARCHIVED).length,
      [TaskTemplateStatus.DELETED]: templates.filter((t) => t.status === TaskTemplateStatus.DELETED).length,
    };
  }, [templates]);

  // 选择模板
  const toggleTemplateSelection = useCallback((id: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全�?取消全�?
  const toggleSelectAll = useCallback(() => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map((t) => t.id)));
    }
  }, [filteredTemplates, selectedTemplates.size]);

  // 批量删除
  const handleBulkDelete = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    try {
      for (const id of selectedTemplates) {
        await deleteTemplate(id);
      }
      setSelectedTemplates(new Set());
      setShowDeleteAllDialog(false);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedTemplates, deleteConfirmText, deleteTemplate]);

  // 恢复模板（从暂停/归档状态）
  const handleResumeTemplate = useCallback(async (id: string) => {
    try {
      await activateTemplate(id);
    } catch (err) {
      console.error('Resume template failed:', err);
    }
  }, [activateTemplate]);

  // 暂停模板
  const handlePauseTemplate = useCallback(async (id: string) => {
    try {
      await pauseTemplate(id);
    } catch (err) {
      console.error('Pause template failed:', err);
    }
  }, [pauseTemplate]);

  // 归档模板
  const handleArchiveTemplate = useCallback(async (id: string) => {
    try {
      await archiveTemplate(id);
    } catch (err) {
      console.error('Archive template failed:', err);
    }
  }, [archiveTemplate]);

  // 空状态配�?
  const getEmptyState = () => {
    switch (currentStatus) {
      case TaskTemplateStatus.ACTIVE:
        return {
          icon: <LayoutTemplate className="h-16 w-16 text-muted-foreground/50" />,
          title: '暂无进行中的任务',
          description: '创建你的第一个任务模板开始管理日常任',
          showCreate: true,
        };
      case TaskTemplateStatus.PAUSED:
        return {
          icon: <PauseCircle className="h-16 w-16 text-yellow-500/50" />,
          title: '暂无已暂停的任务',
          description: '暂停的任务会显示在这',
          showCreate: false,
        };
      case TaskTemplateStatus.ARCHIVED:
        return {
          icon: <Archive className="h-16 w-16 text-gray-500/50" />,
          title: '暂无已归档的任务',
          description: '归档的任务会显示在这',
          showCreate: false,
        };
      case TaskTemplateStatus.DELETED:
      default:
        return {
          icon: <Archive className="h-16 w-16 text-gray-500/50" />,
          title: '暂无已删除的任务',
          description: '已删除的任务会显示在这里',
          showCreate: false,
        };
    }
  };

  const emptyState = getEmptyState();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">任务模板管理</h1>
            <p className="text-sm text-muted-foreground">
              管理和组织你的任务模�?
            </p>
          </div>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowDependencyDialog(true)}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                依赖关系�?
              </Button>
            )}
            <Button onClick={onCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              创建模板
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板..."
              className="pl-10"
            />
          </div>

          {/* Status Tabs */}
          <Tabs
            value={currentStatus}
            onValueChange={(v) => setCurrentStatus(v as TaskTemplateStatus)}
            className="w-auto"
          >
            <TabsList>
              {Object.entries(statusConfig).map(([status, config]) => {
                const Icon = config.icon;
                const count = statusCounts[status as TaskTemplateStatus];
                return (
                  <TabsTrigger key={status} value={status} className="gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    {config.label}
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.size > 0 && (
          <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
            <span className="text-sm">
              已选择 <strong>{selectedTemplates.size}</strong> 个模板
            </span>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedTemplates.size === filteredTemplates.length ? '取消全选' : '全选'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              批量删除
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button onClick={loadTemplates}>重试</Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                {emptyState.icon}
                <h3 className="mt-4 text-lg font-medium">{emptyState.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {emptyState.description}
                </p>
                {emptyState.showCreate && (
                  <Button className="mt-4" onClick={onCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个模�?
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplates.has(template.id)}
                  onSelect={() => toggleTemplateSelection(template.id)}
                  onEdit={() => onEditTemplate?.(template.id)}
                  onPause={() => handlePauseTemplate(template.id)}
                  onResume={() => handleResumeTemplate(template.id)}
                  onArchive={() => handleArchiveTemplate(template.id)}
                  onDelete={() => deleteTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              确认删除所有选中模板
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  您确定要删除选中�?<strong>{selectedTemplates.size}</strong> 个任务模板吗<
                </p>
                <p className="text-sm text-muted-foreground">
                  这将同时删除所有关联的任务实例和历史记录。此操作不可撤销�?
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="请输"DELETE 确认删除"
                  className="mt-4"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dependency Dialog */}
      <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              任务依赖关系�?
            </DialogTitle>
            <DialogDescription>
              查看任务模板之间的依赖关�?
            </DialogDescription>
          </DialogHeader>
          <div className="h-[500px] border rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">依赖关系图可视化组件</p>
            {/* TODO: 集成 TaskDAGVisualization 组件 */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDependencyDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== 子组�?=====================

interface TemplateCardProps {
  template: TaskTemplateClientDTO;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  onEdit,
  onPause,
  onResume,
  onArchive,
  onDelete,
}: TemplateCardProps) {
  const statusInfo = statusConfig[template.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className={`relative transition-all cursor-pointer hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 p-1 rounded-full bg-primary">
          <CheckCircle className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-base truncate">{template.title}</CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              {template.status === TaskTemplateStatus.ACTIVE && (
                <DropdownMenuItem onClick={onPause}>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  暂停
                </DropdownMenuItem>
              )}
              {template.status !== TaskTemplateStatus.ACTIVE && (
                <DropdownMenuItem onClick={onResume}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  恢复
                </DropdownMenuItem>
              )}
              {template.status !== TaskTemplateStatus.ARCHIVED && (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  归档
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
          <Badge variant="secondary">
            {taskTypeLabels[template.taskType] || template.taskType}
          </Badge>
          {template.recurrenceRule && (
            <Badge variant="outline" className="text-blue-600">
              <Clock className="h-3 w-3 mr-1" />
              重复
            </Badge>
          )}
          {template.goalBinding && (
            <Badge variant="outline" className="text-purple-600">
              <Target className="h-3 w-3 mr-1" />
              关联目标
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>实例: {template.instanceCount || 0}</span>
          <span>完成: {Math.round((template.completionRate || 0) * 100)}%</span>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TaskManagementView;
