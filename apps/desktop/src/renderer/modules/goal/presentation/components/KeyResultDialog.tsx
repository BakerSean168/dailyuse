/**
 * KeyResultDialog Component
 *
 * 关键结果对话�?- 用于创建/编辑关键结果
 */

import { useState, useEffect, useMemo } from 'react';
import type { KeyResult, Goal } from '@dailyuse/goal/domain-client';
import type {
  AddKeyResultRequest,
  UpdateKeyResultRequest,
} from '@dailyuse/contracts/goal';
import { KeyResultCalculationMethod as AggregationMethod, KeyResultValueType } from '@dailyuse/contracts/goal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Input } from '@dailyuse/ui-react-shadcn';
import { Label } from '@dailyuse/ui-react-shadcn';
import { Textarea } from '@dailyuse/ui-react-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import { Target } from 'lucide-react';

interface KeyResultDialogProps {
  open: boolean;
  goalId: string;
  goal?: Goal | null;
  keyResult?: KeyResult | null;
  onClose: () => void;
  /** 保存回调 - 使用 contracts 类型 */
  onSave: (data: AddKeyResultRequest | UpdateKeyResultRequest) => Promise<void>;
}

/**
 * 表单 UI 状态（内部使用�?
 */
interface FormState {
  title: string;
  description: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;
  aggregationMethod: AggregationMethod;
}

// 聚合方法选项
const AGGREGATION_METHODS = [
  { value: AggregationMethod.Sum, label: '求和', hint: '适合累计型指' },
  { value: AggregationMethod.Average, label: '求平', hint: '适合平均值型指标' },
  { value: AggregationMethod.Max, label: '取最大', hint: '适合峰值型指标' },
  { value: AggregationMethod.Min, label: '取最小', hint: '适合低值型指标' },
  { value: AggregationMethod.Last, label: '取最后一', hint: '适合绝对值型指标' },
];

const DEFAULT_FORM_STATE: FormState = {
  title: '',
  description: '',
  startValue: 0,
  targetValue: 100,
  currentValue: 0,
  weight: 1,
  aggregationMethod: AggregationMethod.Sum,
};

// ============ Helper Functions ============

/**
 * 将表单状态转换为 AddKeyResultRequest
 */
function formStateToAddRequest(goalId: string, form: FormState): AddKeyResultRequest {
  return {
    goalId,
    title: form.title,
    description: form.description || undefined,
    valueType: KeyResultValueType.INCREMENTAL, // 默认使用累积值类�?
    aggregationMethod: form.aggregationMethod,
    targetValue: form.targetValue,
    currentValue: form.currentValue,
    weight: form.weight,
  };
}

/**
 * 将表单状态转换为 UpdateKeyResultRequest
 */
function formStateToUpdateRequest(form: FormState): UpdateKeyResultRequest {
  return {
    title: form.title,
    description: form.description || undefined,
    startValue: form.startValue,
    targetValue: form.targetValue,
    weight: form.weight,
  };
}

export function KeyResultDialog({
  open,
  goalId,
  goal,
  keyResult,
  onClose,
  onSave,
}: KeyResultDialogProps) {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!keyResult;
  const goalColor = goal?.color || '#3b82f6';

  // 重置表单
  useEffect(() => {
    if (open) {
      if (keyResult) {
        setFormState({
          title: keyResult.title,
          description: keyResult.description || '',
          startValue: 0, // 初始值默认为0
          targetValue: keyResult.progress.targetValue,
          currentValue: keyResult.progress.currentValue,
          weight: keyResult.weight,
          aggregationMethod: keyResult.progress.aggregationMethod || AggregationMethod.Sum,
        });
      } else {
        setFormState(DEFAULT_FORM_STATE);
      }
      setError(null);
    }
  }, [open, keyResult]);

  // 计算预览进度
  const progressPreview = useMemo(() => {
    const { startValue, currentValue, targetValue } = formState;
    const range = targetValue - startValue;
    if (range <= 0) return 0;
    const progress = ((currentValue - startValue) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [formState.startValue, formState.currentValue, formState.targetValue]);

  // 表单验证
  const isValid = useMemo(() => {
    return (
      formState.title.trim().length > 0 &&
      formState.targetValue > formState.startValue &&
      formState.weight >= 1 &&
      formState.weight <= 10
    );
  }, [formState]);

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!isValid) {
      setError('请检查表单填写是否正');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // 转换�?contracts 类型
      const request = isEditing 
        ? formStateToUpdateRequest(formState)
        : formStateToAddRequest(goalId, formState);
      await onSave(request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('[KeyResultDialog] Failed to save:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: goalColor }} />
            {isEditing ? '编辑关键结果' : '创建关键结果'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '修改关键结果的信'
              : '为目标添加一个新的关键结果，用于衡量目标进度'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h4 className="font-medium">基本信息</h4>

            <div className="space-y-2">
              <Label htmlFor="title">名称 *</Label>
              <Input
                id="title"
                placeholder="例如：新增活跃用户数"
                value={formState.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="描述这个关键结果..."
                value={formState.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* 数值配�?*/}
          <div className="space-y-4">
            <h4 className="font-medium">数值配</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startValue">起始</Label>
                <Input
                  id="startValue"
                  type="number"
                  value={formState.startValue}
                  onChange={(e) => handleChange('startValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">初始数</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">目标值 *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formState.targetValue}
                  onChange={(e) => handleChange('targetValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">期望达到的数</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">当前</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formState.currentValue}
                  onChange={(e) => handleChange('currentValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">目前的实际数</p>
              </div>
            </div>
          </div>

          {/* 高级配置 */}
          <div className="space-y-4">
            <h4 className="font-medium">高级配置</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aggregationMethod">进度计算方法</Label>
                <Select
                  value={formState.aggregationMethod}
                  onValueChange={(value) =>
                    handleChange('aggregationMethod', value as AggregationMethod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择计算方法" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex flex-col">
                          <span>{method.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {method.hint}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">权重 (1-10)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  max={10}
                  value={formState.weight}
                  onChange={(e) => handleChange('weight', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  该关键结果在目标中的重要程度
                </p>
              </div>
            </div>
          </div>

          {/* 进度预览 */}
          {formState.title && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">进度预览</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm truncate max-w-[70%]">
                  {formState.title || '关键结果名称'}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: goalColor }}
                >
                  {progressPreview.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={progressPreview}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formState.startValue}</span>
                <span>
                  {formState.currentValue} / {formState.targetValue}
                </span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || loading}
            style={{ backgroundColor: isValid ? goalColor : undefined }}
          >
            {loading ? '保存中...' : isEditing ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KeyResultDialog;
