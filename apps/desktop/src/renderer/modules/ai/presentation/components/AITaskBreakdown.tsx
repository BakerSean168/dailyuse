/**
 * AITaskBreakdown Component
 *
 * AI 任务分解组件
 * Story 11-7: Advanced Features
 */

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, Plus, X, Check, RefreshCw, Wand2, ListTree, Edit2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Input,
  Textarea,
  Badge,
  Checkbox,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  cn,
} from '@dailyuse/ui-react-shadcn';

// Types
interface SubTask {
  id: string;
  name: string;
  description?: string;
  estimatedMinutes?: number;
  selected: boolean;
}

interface AITaskBreakdownProps {
  taskName: string;
  taskDescription?: string;
  onConfirm: (subtasks: Omit<SubTask, 'id' | 'selected'>[]) => void;
  onCancel?: () => void;
  className?: string;
  trigger?: React.ReactNode;
}

// Mock AI response (in real app, would call AI service)
async function generateSubtasks(
  taskName: string,
  taskDescription?: string
): Promise<SubTask[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate mock subtasks based on task name
  const templates: Record<string, SubTask[]> = {
    default: [
      { id: '1', name: '分析需求和目标', estimatedMinutes: 30, selected: true },
      { id: '2', name: '制定实施计划', estimatedMinutes: 20, selected: true },
      { id: '3', name: '准备所需资源', estimatedMinutes: 15, selected: true },
      { id: '4', name: '执行核心任务', estimatedMinutes: 60, selected: true },
      { id: '5', name: '检查和验收结果', estimatedMinutes: 20, selected: true },
    ],
  };

  // Customize based on keywords
  if (taskName.includes('设计') || taskName.includes('界面')) {
    return [
      { id: '1', name: '收集设计灵感和参�?, estimatedMinutes: 30, selected: true },
      { id: '2', name: '创建线框�?, estimatedMinutes: 45, selected: true },
      { id: '3', name: '设计视觉风格', estimatedMinutes: 60, selected: true },
      { id: '4', name: '制作高保真原�?, estimatedMinutes: 90, selected: true },
      { id: '5', name: '收集反馈并迭�?, estimatedMinutes: 30, selected: true },
    ];
  }

  if (taskName.includes('开�?) || taskName.includes('编程') || taskName.includes('代码')) {
    return [
      { id: '1', name: '分析技术方�?, estimatedMinutes: 30, selected: true },
      { id: '2', name: '搭建开发环�?, estimatedMinutes: 20, selected: true },
      { id: '3', name: '编写核心逻辑', estimatedMinutes: 120, selected: true },
      { id: '4', name: '编写单元测试', estimatedMinutes: 45, selected: true },
      { id: '5', name: '代码审查和优�?, estimatedMinutes: 30, selected: true },
    ];
  }

  if (taskName.includes('文档') || taskName.includes('报告')) {
    return [
      { id: '1', name: '收集相关资料', estimatedMinutes: 30, selected: true },
      { id: '2', name: '整理大纲结构', estimatedMinutes: 20, selected: true },
      { id: '3', name: '撰写初稿', estimatedMinutes: 90, selected: true },
      { id: '4', name: '审阅和修�?, estimatedMinutes: 30, selected: true },
      { id: '5', name: '格式化和定稿', estimatedMinutes: 15, selected: true },
    ];
  }

  return templates.default;
}

// Generate unique ID
function generateId(): string {
  return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// SubTask Item Component
interface SubTaskItemProps {
  subtask: SubTask;
  onToggle: () => void;
  onEdit: (name: string, estimatedMinutes?: number) => void;
  onRemove: () => void;
}

function SubTaskItem({ subtask, onToggle, onEdit, onRemove }: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subtask.name);
  const [editMinutes, setEditMinutes] = useState(subtask.estimatedMinutes?.toString() || '');

  const handleSave = () => {
    onEdit(editName, editMinutes ? parseInt(editMinutes) : undefined);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Input
          type="number"
          value={editMinutes}
          onChange={(e) => setEditMinutes(e.target.value)}
          placeholder="分钟"
          className="w-20"
        />
        <Button size="icon" variant="ghost" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
        !subtask.selected && 'opacity-50'
      )}
    >
      <Checkbox
        checked={subtask.selected}
        onCheckedChange={onToggle}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{subtask.name}</p>
      </div>
      {subtask.estimatedMinutes && (
        <Badge variant="outline" className="shrink-0">
          {subtask.estimatedMinutes} 分钟
        </Badge>
      )}
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(true)}>
        <Edit2 className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Main Component
export function AITaskBreakdown({
  taskName,
  taskDescription,
  onConfirm,
  onCancel,
  className,
  trigger,
}: AITaskBreakdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState('');

  // Generate subtasks
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateSubtasks(taskName, taskDescription);
      setSubtasks(result);
    } catch (error) {
      console.error('Failed to generate subtasks:', error);
    } finally {
      setLoading(false);
    }
  }, [taskName, taskDescription]);

  // Toggle subtask selection
  const handleToggle = useCallback((id: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, selected: !st.selected } : st))
    );
  }, []);

  // Edit subtask
  const handleEdit = useCallback((id: string, name: string, estimatedMinutes?: number) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, name, estimatedMinutes } : st))
    );
  }, []);

  // Remove subtask
  const handleRemove = useCallback((id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  }, []);

  // Add custom subtask
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskName.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: generateId(),
        name: newSubtaskName.trim(),
        selected: true,
      },
    ]);
    setNewSubtaskName('');
  }, [newSubtaskName]);

  // Confirm selection
  const handleConfirm = useCallback(() => {
    const selectedSubtasks = subtasks
      .filter((st) => st.selected)
      .map(({ name, description, estimatedMinutes }) => ({
        name,
        description,
        estimatedMinutes,
      }));
    onConfirm(selectedSubtasks);
    setOpen(false);
  }, [subtasks, onConfirm]);

  // Calculate totals
  const selectedCount = subtasks.filter((st) => st.selected).length;
  const totalMinutes = subtasks
    .filter((st) => st.selected)
    .reduce((sum, st) => sum + (st.estimatedMinutes || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Wand2 className="h-4 w-4" />
            AI 分解任务
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn('max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 任务分解
          </DialogTitle>
          <DialogDescription>
            AI 会将任务拆分为可执行的子任务，你可以选择、编辑或添加新的子任�?
          </DialogDescription>
        </DialogHeader>

        {/* Task info */}
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <ListTree className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{taskName}</span>
            </div>
            {taskDescription && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {taskDescription}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Generate button */}
        {subtasks.length === 0 && (
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 正在分析...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始智能分�?
              </>
            )}
          </Button>
        )}

        {/* Subtasks list */}
        {subtasks.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                已�?{selectedCount} 个子任务，预�?{totalMinutes} 分钟
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1"
              >
                <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
                重新生成
              </Button>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-1 pr-4">
                {subtasks.map((subtask) => (
                  <SubTaskItem
                    key={subtask.id}
                    subtask={subtask}
                    onToggle={() => handleToggle(subtask.id)}
                    onEdit={(name, minutes) => handleEdit(subtask.id, name, minutes)}
                    onRemove={() => handleRemove(subtask.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Add custom subtask */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="添加自定义子任务..."
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleAddSubtask}
                disabled={!newSubtaskName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            确认创建 {selectedCount} 个子任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AITaskBreakdown;
