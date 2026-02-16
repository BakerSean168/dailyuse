/**
 * TaskCompleteDialog Component
 *
 * 任务完成确认对话�?
 * 功能�?
 * 1. 显示任务信息
 * 2. 显示关联�?Goal/KeyResult 信息
 * 3. 根据 AggregationMethod 显示不同的输入提�?
 * 4. 用户手动输入 Record �?
 * 5. 防止误触，提供二次确�?
 */

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { KeyResultCalculationMethod as AggregationMethod } from '@dailyuse/contracts/goal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import { Input } from '@dailyuse/ui-react-shadcn';
import { Textarea } from '@dailyuse/ui-react-shadcn';
import { Label } from '@dailyuse/ui-react-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-react-shadcn';
import {
  CheckCircle,
  Target,
  Key,
  Calculator,
  Clock,
  FileText,
  Info,
  PlusCircle,
  ArrowUpCircle,
  TrendingUp,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface GoalBinding {
  goalId: string;
  goalTitle: string;
  keyResultId: string;
  keyResultTitle: string;
  aggregationMethod: AggregationMethod;
  currentValue: number;
  targetValue: number;
  unit?: string;
}

interface TaskCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  instanceDate: number | Date;
  goalBinding?: GoalBinding;
  showQuickValues?: boolean;
  isLoading?: boolean;
  onConfirm?: (data: CompleteTaskData) => void;
  onCancel?: () => void;
}

interface CompleteTaskData {
  recordValue?: number;
  note?: string;
  duration?: number;
}

// ===================== 工具函数 =====================

const getAggregationMethodText = (method?: AggregationMethod): string => {
  const textMap: Record<AggregationMethod, string> = {
    [AggregationMethod.Sum]: '累加',
    [AggregationMethod.Max]: '最大',
    [AggregationMethod.Average]: '平均',
    [AggregationMethod.Min]: '最小',
    [AggregationMethod.Last]: '最新',
  };
  return method ? textMap[method] || '未知' : '未知';
};

const getAggregationMethodColor = (method?: AggregationMethod): string => {
  const colorMap: Record<AggregationMethod, string> = {
    [AggregationMethod.Sum]: 'bg-blue-100 text-blue-800',
    [AggregationMethod.Max]: 'bg-green-100 text-green-800',
    [AggregationMethod.Average]: 'bg-cyan-100 text-cyan-800',
    [AggregationMethod.Min]: 'bg-yellow-100 text-yellow-800',
    [AggregationMethod.Last]: 'bg-purple-100 text-purple-800',
  };
  return method ? colorMap[method] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
};

const getAggregationMethodIcon = (method?: AggregationMethod) => {
  switch (method) {
    case AggregationMethod.Sum:
      return <PlusCircle className="h-4 w-4" />;
    case AggregationMethod.Max:
      return <ArrowUpCircle className="h-4 w-4" />;
    case AggregationMethod.Average:
      return <TrendingUp className="h-4 w-4" />;
    case AggregationMethod.Min:
      return <ArrowDownCircle className="h-4 w-4" />;
    case AggregationMethod.Last:
      return <RefreshCw className="h-4 w-4" />;
    default:
      return <Calculator className="h-4 w-4" />;
  }
};

const getInputLabel = (method?: AggregationMethod, hasGoalBinding?: boolean): string => {
  if (!hasGoalBinding) return '本次完成';
  
  const labelMap: Record<AggregationMethod, string> = {
    [AggregationMethod.Sum]: '本次完成量（将累加到当前进度',
    [AggregationMethod.Max]: '本次达到的最高',
    [AggregationMethod.Average]: '本次的值（将计算平均值）',
    [AggregationMethod.Min]: '本次的最小',
    [AggregationMethod.Last]: '最新的值（将覆盖当前值）',
  };
  return method ? labelMap[method] || '本次完成' : '本次完成';
};

const getInputHint = (method?: AggregationMethod): string => {
  const hintMap: Record<AggregationMethod, string> = {
    [AggregationMethod.Sum]: '例如：跑'5 公里，输'5',
    [AggregationMethod.Max]: '例如：考试分数 85 分，输入 85',
    [AggregationMethod.Average]: '例如：每日学'2 小时，输'2',
    [AggregationMethod.Min]: '输入本次的最小',
    [AggregationMethod.Last]: '输入最新的',
  };
  return method ? hintMap[method] || '请输入本次完成的数量' : '请输入本次完成的数量';
};

const calculatePercentage = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

const getProgressColor = (current: number, target: number): string => {
  const percentage = (current / target) * 100;
  if (percentage >= 100) return 'text-green-600';
  if (percentage >= 70) return 'text-blue-600';
  if (percentage >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

// ===================== 组件 =====================

export function TaskCompleteDialog({
  open,
  onOpenChange,
  taskTitle,
  instanceDate,
  goalBinding,
  showQuickValues = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: TaskCompleteDialogProps) {
  const [recordValue, setRecordValue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState<number | null>(null);

  // 快捷�?
  const quickValues = useMemo(() => {
    if (!goalBinding) return [];

    const { aggregationMethod, targetValue, currentValue } = goalBinding;

    switch (aggregationMethod) {
      case AggregationMethod.Sum:
        return [1, 5, 10, 20, 50];
      case AggregationMethod.Max: {
        const remaining = targetValue - currentValue;
        return [
          Math.floor(remaining * 0.5),
          Math.floor(remaining * 0.7),
          Math.floor(remaining * 0.9),
          remaining,
          targetValue,
        ].filter((v) => v > 0);
      }
      case AggregationMethod.Average:
        return [
          Math.floor(targetValue * 0.8),
          Math.floor(targetValue * 0.9),
          targetValue,
          Math.floor(targetValue * 1.1),
          Math.floor(targetValue * 1.2),
        ].filter((v) => v > 0);
      default:
        return [];
    }
  }, [goalBinding]);

  // 校验
  const isValid = useMemo(() => {
    if (goalBinding) {
      return recordValue !== null && recordValue > 0;
    }
    return true;
  }, [goalBinding, recordValue]);

  // 预测完成后的进度
  const predictProgress = useCallback(() => {
    if (!goalBinding || !recordValue) return '';

    const { aggregationMethod, currentValue, targetValue, unit } = goalBinding;
    let predictedValue = currentValue;

    switch (aggregationMethod) {
      case AggregationMethod.Sum:
        predictedValue = currentValue + recordValue;
        break;
      case AggregationMethod.Max:
        predictedValue = Math.max(currentValue, recordValue);
        break;
      case AggregationMethod.Last:
        predictedValue = recordValue;
        break;
      case AggregationMethod.Average:
        predictedValue = (currentValue + recordValue) / 2;
        break;
      default:
        predictedValue = currentValue + recordValue;
    }

    const percentage = calculatePercentage(predictedValue, targetValue);
    return `${predictedValue} / ${targetValue} ${unit || ''} (${percentage}%)`;
  }, [goalBinding, recordValue]);

  const handleConfirm = () => {
    if (!isValid || isLoading) return;

    const data: CompleteTaskData = {
      note: note || undefined,
      duration: duration || undefined,
    };

    if (goalBinding && recordValue !== null && recordValue > 0) {
      data.recordValue = recordValue;
    }

    onConfirm?.(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const formatDate = (date: number | Date): string => {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd EEEE', { locale: zhCN });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle>完成任务</DialogTitle>
          </div>
          <DialogDescription>
            确认完成任务并记录相关信�?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 任务信息 */}
          <div className="p-4 rounded-lg bg-secondary/50">
            <h3 className="font-medium text-lg mb-1">{taskTitle}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(instanceDate)}
            </p>
          </div>

          {/* 关联目标信息 */}
          {goalBinding && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">关联目标</span>
                    <span>{goalBinding.goalTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">关键结果</span>
                    <span>{goalBinding.keyResultTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">计算方式</span>
                    <Badge className={getAggregationMethodColor(goalBinding.aggregationMethod)}>
                      {getAggregationMethodText(goalBinding.aggregationMethod)}
                    </Badge>
                  </div>

                  {/* 当前进度 */}
                  <div className="pt-2 border-t border-blue-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">当前进度</span>
                      <Badge className={getProgressColor(goalBinding.currentValue, goalBinding.targetValue)}>
                        {calculatePercentage(goalBinding.currentValue, goalBinding.targetValue)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">当前值：</span>
                      <span className="font-medium">
                        {goalBinding.currentValue} {goalBinding.unit || ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">目标值：</span>
                      <span className="font-medium">
                        {goalBinding.targetValue} {goalBinding.unit || ''}
                      </span>
                    </div>
                    <Progress
                      value={calculatePercentage(goalBinding.currentValue, goalBinding.targetValue)}
                      className="h-2"
                    />
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 输入完成�?*/}
          {goalBinding && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {getAggregationMethodIcon(goalBinding.aggregationMethod)}
                  {getInputLabel(goalBinding.aggregationMethod, true)}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={recordValue || ''}
                    onChange={(e) => setRecordValue(e.target.value ? Number(e.target.value) : null)}
                    placeholder={getInputHint(goalBinding.aggregationMethod)}
                    min={0}
                    step={0.01}
                    className="flex-1"
                    autoFocus
                  />
                  {goalBinding.unit && (
                    <span className="text-sm text-muted-foreground">{goalBinding.unit}</span>
                  )}
                </div>
              </div>

              {/* 预测结果 */}
              {recordValue !== null && recordValue > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <span className="font-medium">完成后预计：</span> {predictProgress()}
                  </AlertDescription>
                </Alert>
              )}

              {/* 快捷�?*/}
              {showQuickValues && quickValues.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">快捷值：</span>
                  <div className="flex flex-wrap gap-2">
                    {quickValues.map((value) => (
                      <Badge
                        key={value}
                        variant={recordValue === value ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => setRecordValue(value)}
                      >
                        {value} {goalBinding.unit || ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 无目标绑定提�?*/}
          {!goalBinding && (
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription>
                此任务未关联目标，点击确认后将直接完成�?
              </AlertDescription>
            </Alert>
          )}

          {/* 完成备注 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              完成备注（可选）
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录本次完成的情".."
              rows={3}
            />
          </div>

          {/* 实际耗时 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              实际耗时（可选）
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={duration || ''}
                onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : null)}
                placeholder="记录实际花费的时"
                min={0}
                step={5}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">分钟</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            确认完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TaskCompleteDialog;
