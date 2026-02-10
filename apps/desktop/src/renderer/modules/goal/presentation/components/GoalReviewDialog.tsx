/**
 * GoalReviewDialog Component
 *
 * 目标复盘对话框 - 用于创建/查看复盘记录
 */

import { useState, useEffect, useMemo } from 'react';
import type { GoalReview, Goal } from '@dailyuse/goal/domain-client';
import type {
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
} from '@dailyuse/contracts/goal';
import { ReviewType } from '@dailyuse/contracts/goal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-shadcn';
import { Button } from '@dailyuse/ui-shadcn';
import { Input } from '@dailyuse/ui-shadcn';
import { Label } from '@dailyuse/ui-shadcn';
import { Textarea } from '@dailyuse/ui-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-shadcn';
import { BookOpen, Star } from 'lucide-react';

interface GoalReviewDialogProps {
  open: boolean;
  goalUuid: string;
  goal?: Goal | null;
  review?: GoalReview | null;
  onClose: () => void;
  /** 保存回调 - 使用 contracts 类型 */
  onSave: (data: CreateGoalReviewRequest | UpdateGoalReviewRequest) => Promise<void>;
}

/**
 * 表单 UI 状态（内部使用）
 */
interface FormState {
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string;
  challenges: string;
  improvements: string;
}

// 复盘类型选项
const REVIEW_TYPES = [
  { value: ReviewType.WEEKLY, label: '周复盘' },
  { value: ReviewType.MONTHLY, label: '月复盘' },
  { value: ReviewType.QUARTERLY, label: '季度复盘' },
  { value: ReviewType.ANNUAL, label: '年度复盘' },
  { value: ReviewType.ADHOC, label: '临时复盘' },
];

const DEFAULT_FORM_STATE: FormState = {
  type: ReviewType.WEEKLY,
  rating: 3,
  summary: '',
  achievements: '',
  challenges: '',
  improvements: '',
};

// ============ Helper Functions ============

/**
 * 将表单状态转换为 CreateGoalReviewRequest
 */
function formStateToCreateRequest(goalUuid: string, form: FormState): CreateGoalReviewRequest {
  return {
    goalUuid,
    title: form.summary, // 使用 summary 作为 title
    content: form.summary,
    reviewType: form.type,
    rating: form.rating,
    achievements: form.achievements || undefined,
    challenges: form.challenges || undefined,
    nextActions: form.improvements || undefined,
  };
}

/**
 * 将表单状态转换为 UpdateGoalReviewRequest
 */
function formStateToUpdateRequest(form: FormState): UpdateGoalReviewRequest {
  return {
    title: form.summary,
    content: form.summary,
    rating: form.rating,
    achievements: form.achievements || undefined,
    challenges: form.challenges || undefined,
    nextActions: form.improvements || undefined,
  };
}

export function GoalReviewDialog({
  open,
  goalUuid,
  goal,
  review,
  onClose,
  onSave,
}: GoalReviewDialogProps) {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!review;
  const goalColor = goal?.color || '#3b82f6';

  // 重置表单
  useEffect(() => {
    if (open) {
      if (review) {
        setFormState({
          type: review.type,
          rating: review.rating,
          summary: review.summary,
          achievements: review.achievements || '',
          challenges: review.challenges || '',
          improvements: review.improvements || '',
        });
      } else {
        setFormState(DEFAULT_FORM_STATE);
      }
      setError(null);
    }
  }, [open, review]);

  // 表单验证
  const isValid = useMemo(() => {
    return (
      formState.summary.trim().length > 0 &&
      formState.rating >= 1 &&
      formState.rating <= 5
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
      setError('请填写必要信息');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // 转换为 contracts 类型
      const request = isEditing 
        ? formStateToUpdateRequest(formState)
        : formStateToCreateRequest(goalUuid, formState);
      await onSave(request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('[GoalReviewDialog] Failed to save:', err);
    } finally {
      setLoading(false);
    }
  };

  // 渲染评分星星
  const renderRatingStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleChange('rating', star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                star <= formState.rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: goalColor }} />
            {isEditing ? '查看复盘' : '创建复盘'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '查看或编辑复盘记录'
              : '记录目标的复盘总结，帮助反思和改进'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>复盘类型</Label>
              <Select
                value={formState.type}
                onValueChange={(value) => handleChange('type', value as ReviewType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择复盘类型" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>评分</Label>
              {renderRatingStars()}
            </div>
          </div>

          {/* 摘要 */}
          <div className="space-y-2">
            <Label htmlFor="summary">复盘摘要 *</Label>
            <Input
              id="summary"
              placeholder="一句话总结本次复盘"
              value={formState.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
            />
          </div>

          {/* 成果 */}
          <div className="space-y-2">
            <Label htmlFor="achievements">主要成果</Label>
            <Textarea
              id="achievements"
              placeholder="本阶段取得了哪些主要成果？"
              value={formState.achievements}
              onChange={(e) => handleChange('achievements', e.target.value)}
              rows={3}
            />
          </div>

          {/* 挑战 */}
          <div className="space-y-2">
            <Label htmlFor="challenges">遇到的挑战</Label>
            <Textarea
              id="challenges"
              placeholder="在实现目标过程中遇到了哪些挑战？"
              value={formState.challenges}
              onChange={(e) => handleChange('challenges', e.target.value)}
              rows={3}
            />
          </div>

          {/* 改进 */}
          <div className="space-y-2">
            <Label htmlFor="improvements">改进措施</Label>
            <Textarea
              id="improvements"
              placeholder="下一阶段有哪些可以改进的地方？"
              value={formState.improvements}
              onChange={(e) => handleChange('improvements', e.target.value)}
              rows={3}
            />
          </div>

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

export default GoalReviewDialog;
