/**
 * GoalRecordDialog Component
 *
 * 目标进度记录对话�?- 用于添加/编辑进度记录
 */

import { useState, useEffect } from 'react';
import type { GoalRecord, KeyResult } from '@dailyuse/goal/domain-client';
import type { CreateGoalRecordRequest } from '@dailyuse/contracts/goal';
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
import { Badge } from '@dailyuse/ui-react-shadcn';
import { PlusCircle, Zap } from 'lucide-react';

interface GoalRecordDialogProps {
  open: boolean;
  goalId: string;
  keyResultId: string;
  keyResult?: KeyResult | null;
  record?: GoalRecord | null;
  goalColor?: string;
  onClose: () => void;
  /** 保存回调 - 使用 contracts 类型 */
  onSave: (data: CreateGoalRecordRequest) => Promise<void>;
}

// 快速选择�?
const QUICK_VALUES = [1, 2, 5, 10];

export function GoalRecordDialog({
  open,
  goalId,
  keyResultId,
  keyResult,
  record,
  goalColor = '#3b82f6',
  onClose,
  onSave,
}: GoalRecordDialogProps) {
  const [value, setValue] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!record;

  // 重置表单
  useEffect(() => {
    if (open) {
      if (record) {
        setValue(record.value);
        setNote(record.note || '');
      } else {
        setValue(0);
        setNote('');
      }
      setError(null);
    }
  }, [open, record]);

  const isValid = value > 0 && value <= 10000;

  const handleSave = async () => {
    if (!isValid) {
      setError('请输入有效的增加值（大于0且不超过10000');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({ value, note: note.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('[GoalRecordDialog] Failed to save:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickValue = (quickValue: number) => {
    setValue(quickValue);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" style={{ color: goalColor }} />
            {isEditing ? '编辑记录' : '添加记录'}
          </DialogTitle>
          {keyResult && (
            <DialogDescription>
              为关键结�?"{keyResult.title}" 添加进度记录
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 增加值输�?*/}
          <div className="space-y-2">
            <Label htmlFor="value">增加值 *</Label>
            <div className="relative">
              <Input
                id="value"
                type="number"
                placeholder="请输入本次增加的数"
                value={value || ''}
                onChange={(e) => setValue(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="pr-16"
              />
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ backgroundColor: `${goalColor}20`, color: goalColor }}
              >
                单位
              </Badge>
            </div>
            {value > 10000 && (
              <p className="text-sm text-destructive">增加值不能超过 10000</p>
            )}
          </div>

          {/* 快速选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              快速选择
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_VALUES.map((quickValue) => (
                <Button
                  key={quickValue}
                  type="button"
                  size="sm"
                  variant={value === quickValue ? 'default' : 'outline'}
                  onClick={() => handleQuickValue(quickValue)}
                  style={
                    value === quickValue
                      ? { backgroundColor: goalColor, borderColor: goalColor }
                      : undefined
                  }
                >
                  {quickValue}
                </Button>
              ))}
            </div>
          </div>

          {/* 备注输入 */}
          <div className="space-y-2">
            <Label htmlFor="note">备注说明</Label>
            <Textarea
              id="note"
              placeholder="添加关于此次记录的详细说明..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* 当前进度预览 */}
          {keyResult && value > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm font-medium">进度预览</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">当前</span>
                <span>{keyResult.progress.currentValue}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">增加</span>
                <span style={{ color: goalColor }}>+{value}</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-sm font-medium">
                <span>预计新</span>
                <span>{keyResult.progress.currentValue + value}</span>
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
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GoalRecordDialog;
